"""Public routes: the four forms, the live website content and uploaded images."""
import base64
import os

from flask import Blueprint, current_app, jsonify, request, send_from_directory

from . import db
from .auth import too_many
from .content import public_bundle
from .forms import CHECKS, LABELS
from .notify import send_async

bp = Blueprint("public", __name__)

MESSAGES = {
    "member": "Thank you for registering. We will contact you with the next steps, including how to pay the KES 500 registration.",
    "volunteer": "Thank you for signing up. We will contact you about upcoming activities.",
    "contact": "Thank you. We will reply by email.",
    "placement": "Application received. We will review it and contact you when a suitable placement comes up.",
}


def _submit(kind):
    if too_many("form", current_app.config["FORM_LIMIT"], 3600):
        return jsonify(ok=False, error="Too many submissions. Please try again later.",
                       errors={"_": "Too many submissions. Please try again later."}), 429
    raw = request.get_json(silent=True)
    if not isinstance(raw, dict):
        return jsonify(ok=False, error="Send the form as JSON.", errors={}), 400
    f = CHECKS[kind](raw)
    if f.spam:                      # bots fill the hidden field: pretend it worked, store nothing
        return jsonify(ok=True, message=MESSAGES[kind])
    if f.errors:
        first = next(iter(f.errors.values()))
        return jsonify(ok=False, errors=f.errors, error=first), 400
    data = f.data
    name = data.get("full_name") or data.get("name")
    dup = db.scalar("SELECT COUNT(*) FROM submissions WHERE type = ? AND email = ?", (kind, data["email"]))
    if dup:
        data["_repeat"] = True      # shown to staff as "has applied before"
    t = db.now()
    sid = db.insert("submissions", {"type": kind, "status": "new", "name": name, "email": data["email"],
                                    "phone": data.get("phone", ""), "data": db.dumps(data), "created_at": t,
                                    "updated_at": t})
    lines = [f"{k}: {', '.join(v) if isinstance(v, list) else v}" for k, v in data.items() if not k.startswith("_")]
    send_async(current_app.config, f"[AEDT website] New {LABELS[kind].lower()} from {name}",
               "\n".join(lines) + f"\n\nOpen the staff dashboard to follow up (#{sid}).")
    return jsonify(ok=True, message=MESSAGES[kind]), 201


@bp.post("/api/members")
def members():
    return _submit("member")


@bp.post("/api/volunteers")
def volunteers():
    return _submit("volunteer")


@bp.post("/api/contact")
def contact():
    return _submit("contact")


@bp.post("/api/placements")
def placements():
    return _submit("placement")


@bp.get("/api/public/content")
def content():
    resp = jsonify(public_bundle())
    resp.headers["Cache-Control"] = "public, max-age=60"
    return resp


@bp.get("/api/health")
def health():
    db.scalar("SELECT 1")
    return jsonify(ok=True)


@bp.get("/uploads/<path:name>")
def uploads(name):
    name = os.path.basename(name)
    path = os.path.join(current_app.config["UPLOAD_DIR"], name)
    if not os.path.isfile(path):          # disk was wiped (e.g. a redeploy): restore from the database copy
        r = db.row("SELECT data FROM uploads WHERE filename = ?", (name,))
        if r and r.get("data"):
            with open(path, "wb") as fh:
                fh.write(base64.b64decode(r["data"]))
    resp = send_from_directory(current_app.config["UPLOAD_DIR"], name)
    resp.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    return resp
