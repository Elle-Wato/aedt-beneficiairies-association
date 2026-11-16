"""AEDT Beneficiaries Association back end (Flask)."""
import json
import logging
import os

import click
from flask import Flask, jsonify, request, send_from_directory
from werkzeug.exceptions import HTTPException

from . import db
from .auth import hash_password, password_problem
from .content import KINDS, slugify


def _env_bool(name, default=False):
    v = os.environ.get(name)
    return default if v is None else v.strip().lower() in ("1", "true", "yes", "on")


def create_app(overrides=None):
    app = Flask(__name__, static_folder=None)
    base = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    app.config.update(
        SECRET_KEY=os.environ.get("SECRET_KEY", ""),
        DATABASE_URL=os.environ.get("DATABASE_URL", ""),
        SQLITE_PATH=os.environ.get("SQLITE_PATH", os.path.join(base, "instance", "aedt.db")),
        UPLOAD_DIR=os.environ.get("UPLOAD_DIR", os.path.join(base, "instance", "uploads")),
        FRONTEND_DIST=os.environ.get("FRONTEND_DIST", ""),      # optional: serve the built React site too
        CORS_ORIGINS=[o.strip().rstrip("/") for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()],
        TRUST_PROXY=_env_bool("TRUST_PROXY", True),
        TOKEN_HOURS=int(os.environ.get("TOKEN_HOURS", "12")),
        FORM_LIMIT=int(os.environ.get("FORM_LIMIT", "10")),     # form posts per IP per hour
        MAX_CONTENT_LENGTH=25 * 1024 * 1024,
        SMTP_HOST=os.environ.get("SMTP_HOST", ""), SMTP_PORT=os.environ.get("SMTP_PORT", "587"),
        SMTP_USER=os.environ.get("SMTP_USER", ""), SMTP_PASSWORD=os.environ.get("SMTP_PASSWORD", ""),
        SMTP_FROM=os.environ.get("SMTP_FROM", ""), NOTIFY_EMAIL=os.environ.get("NOTIFY_EMAIL", ""),
        AUTO_SEED=_env_bool("AUTO_SEED", True),
    )
    # keep a copy of uploaded images in the database (on by default with PostgreSQL/Neon), so photos
    # survive hosts that wipe their disk on every deploy
    app.config.setdefault("UPLOADS_IN_DB", _env_bool(
        "UPLOADS_IN_DB", (overrides or {}).get("DATABASE_URL", app.config["DATABASE_URL"]).startswith("postgres")))
    if overrides:
        app.config.update(overrides)
    if not app.config["SECRET_KEY"]:
        if app.debug or app.config.get("TESTING") or _env_bool("FLASK_DEBUG"):
            app.config["SECRET_KEY"] = "dev-only-secret-change-me-0123456789abcdef"
        else:
            raise RuntimeError("Set SECRET_KEY (a long random string) before running in production.")
    elif len(app.config["SECRET_KEY"]) < 32 and not app.config.get("TESTING"):
        raise RuntimeError("SECRET_KEY is too short. Use at least 32 random characters.")

    os.makedirs(os.path.dirname(app.config["SQLITE_PATH"]), exist_ok=True)
    os.makedirs(app.config["UPLOAD_DIR"], exist_ok=True)
    database = db.Database(app.config["DATABASE_URL"], app.config["SQLITE_PATH"])
    database.init_schema()
    app.extensions["aedt_db"] = database
    app.teardown_appcontext(db.close_db)
    logging.basicConfig(level=logging.INFO)

    from .public import bp as public_bp
    from .staff import bp as staff_bp
    from .members import bp as members_bp
    from .exports import bp as exports_bp
    app.register_blueprint(public_bp)
    app.register_blueprint(staff_bp)
    app.register_blueprint(members_bp)
    app.register_blueprint(exports_bp)

    with app.app_context():
        _bootstrap(app)

    @app.after_request
    def headers(resp):
        origin = request.headers.get("Origin", "").rstrip("/")
        if origin and origin in app.config["CORS_ORIGINS"]:
            resp.headers["Access-Control-Allow-Origin"] = origin
            resp.headers["Vary"] = "Origin"
            resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
            resp.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            resp.headers["Access-Control-Max-Age"] = "600"
        resp.headers.setdefault("X-Content-Type-Options", "nosniff")
        resp.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        if request.path.startswith("/api/staff"):
            resp.headers["Cache-Control"] = "no-store"
        return resp

    @app.before_request
    def preflight():
        if request.method == "OPTIONS" and request.path.startswith("/api/"):
            return app.make_default_options_response()

    @app.errorhandler(HTTPException)
    def http_error(e):
        if request.path.startswith("/api/"):
            msg = {413: "That file is too large (25 MB max).", 404: "Not found.",
                   405: "Method not allowed."}.get(e.code, e.description)
            return jsonify(ok=False, error=msg, errors={}), e.code
        return e

    @app.errorhandler(Exception)
    def server_error(e):
        app.logger.exception("Unhandled error")
        if request.path.startswith("/api/"):
            return jsonify(ok=False, error="Something went wrong on our side. Please try again.", errors={}), 500
        return "Server error", 500

    dist = app.config["FRONTEND_DIST"]
    if dist and os.path.isdir(dist):
        @app.get("/", defaults={"path": ""})
        @app.get("/<path:path>")
        def spa(path):            # serve the built React site; unknown paths go to index.html
            if path.startswith("api/"):
                return jsonify(ok=False, error="Not found."), 404
            full = os.path.join(dist, path)
            if path and os.path.isfile(full):
                return send_from_directory(dist, path)
            return send_from_directory(dist, "index.html")

    _register_cli(app)
    return app


def _bootstrap(app):
    """First run: create the first admin from ADMIN_EMAIL/ADMIN_PASSWORD and load the starting content."""
    if not db.scalar("SELECT COUNT(*) FROM staff"):
        email, pw = os.environ.get("ADMIN_EMAIL", "").strip().lower(), os.environ.get("ADMIN_PASSWORD", "")
        if email and pw:
            db.insert("staff", {"email": email, "name": os.environ.get("ADMIN_NAME", "Administrator"), "role": "admin",
                                "password_hash": hash_password(pw), "must_change_password": 1,
                                "created_at": db.now()})
            app.logger.info("Created first admin account for %s", email)
    if app.config["AUTO_SEED"] and not db.scalar("SELECT COUNT(*) FROM content"):
        seed_content()
    db.close_db()


def seed_content(path=None):
    path = path or os.path.join(os.path.dirname(__file__), "seed_content.json")
    with open(path, encoding="utf-8") as fh:
        seed = json.load(fh)
    t, n = db.now(), 0
    for kind in KINDS:
        for i, item in enumerate(seed.get(kind, [])):
            data = item["data"]
            title = data.get("title") or data.get("caption") or data.get("src", "")
            slug = item.get("slug") or slugify(title)
            if db.row("SELECT id FROM content WHERE kind = ? AND slug = ?", (kind, slug)):
                slug = f"{slug}-{i + 1}"
            db.insert("content", {"kind": kind, "slug": slug, "title": title[:200], "sort": (i + 1) * 10,
                                  "published": 1, "data": db.dumps(data), "created_at": t, "updated_at": t,
                                  "updated_by": "seed"}, commit=False)
            n += 1
    db.commit()
    return n


def _register_cli(app):
    @app.cli.command("create-admin")
    @click.option("--email", prompt=True)
    @click.option("--name", prompt=True)
    @click.password_option()
    def create_admin(email, name, password):
        """Create (or reset) an admin account."""
        problem = password_problem(password)
        if problem:
            raise click.ClickException(problem)
        email = email.strip().lower()
        existing = db.row("SELECT id, token_version FROM staff WHERE email = ?", (email,))
        if existing:
            db.update("staff", existing["id"], {"password_hash": hash_password(password), "role": "admin",
                                                "active": 1, "token_version": existing["token_version"] + 1})
            click.echo(f"Reset password and admin role for {email}")
        else:
            db.insert("staff", {"email": email, "name": name, "role": "admin", "password_hash": hash_password(password),
                                "created_at": db.now()})
            click.echo(f"Created admin {email}")

    @app.cli.command("seed")
    @click.option("--force", is_flag=True, help="Load even if content already exists (may duplicate items).")
    def seed(force):
        """Load the starting website content (campaigns, news, events, gallery)."""
        if db.scalar("SELECT COUNT(*) FROM content") and not force:
            raise click.ClickException("Content already exists. Use --force to load anyway.")
        click.echo(f"Loaded {seed_content()} items")
