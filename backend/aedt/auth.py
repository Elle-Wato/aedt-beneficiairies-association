"""Staff sign-in: password hashing, signed tokens, role checks and a simple rate limiter."""
import threading
import time
from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
from flask import current_app, g, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

from . import db

ROLES = ("admin", "editor")          # admin: everything. editor: content, inbox and contributions.
MIN_PASSWORD = 10


def hash_password(pw):
    return generate_password_hash(pw, method="scrypt")


def verify_password(hash_, pw):
    try:
        return check_password_hash(hash_, pw)
    except (ValueError, TypeError):
        return False


def password_problem(pw):
    if not isinstance(pw, str) or len(pw) < MIN_PASSWORD:
        return f"Use at least {MIN_PASSWORD} characters."
    if pw.lower() == pw or pw.upper() == pw or not any(c.isdigit() for c in pw):
        return "Mix upper and lower case letters and at least one number."
    return None


def make_token(staff):
    hours = current_app.config["TOKEN_HOURS"]
    payload = {"sub": str(staff["id"]), "tv": staff["token_version"], "role": staff["role"],
               "iat": datetime.now(timezone.utc), "exp": datetime.now(timezone.utc) + timedelta(hours=hours)}
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")


def current_staff():
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    try:
        data = jwt.decode(header[7:], current_app.config["SECRET_KEY"], algorithms=["HS256"])
    except jwt.PyJWTError:
        return None
    staff = db.row("SELECT * FROM staff WHERE id = ?", (int(data["sub"]),))
    if not staff or not staff["active"] or staff["token_version"] != data.get("tv"):
        return None
    return staff


def staff_required(*roles):
    """Protect a staff route. With no roles, any active staff member may use it."""
    def deco(fn):
        @wraps(fn)
        def wrapper(*a, **kw):
            staff = current_staff()
            if not staff:
                return jsonify(ok=False, error="Please sign in again."), 401
            if roles and staff["role"] not in roles:
                return jsonify(ok=False, error="You do not have permission to do that."), 403
            g.staff = staff
            return fn(*a, **kw)
        return wrapper
    return deco


def public_staff(s):
    return {k: s[k] for k in ("id", "email", "name", "role", "active", "created_at", "last_login_at",
                              "must_change_password")}


# -- rate limiting (per process; enough to slow down form spam and password guessing) ------
_hits = {}
_lock = threading.Lock()


def client_ip():
    if current_app.config["TRUST_PROXY"] and request.access_route:
        return request.access_route[0]
    return request.remote_addr or "unknown"


def too_many(bucket, limit, per_seconds):
    if current_app.config.get("TESTING") and not current_app.config.get("RATE_LIMIT_IN_TESTS"):
        return False
    key = (bucket, client_ip())
    t = time.time()
    with _lock:
        hits = [h for h in _hits.get(key, []) if t - h < per_seconds]
        limited = len(hits) >= limit
        if not limited:
            hits.append(t)
        _hits[key] = hits
        if len(_hits) > 20000:          # keep memory bounded
            _hits.clear()
    return limited
