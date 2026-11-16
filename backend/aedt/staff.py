"""Staff dashboard API. Every route needs a signed-in staff member; some need the admin role."""
import base64
import csv
import io
import os
import re
import secrets
from datetime import date

from flask import Blueprint, Response, current_app, g, jsonify, request
from PIL import Image, ImageOps

from . import db
from .auth import (ROLES, hash_password, make_token, password_problem, public_staff, staff_required,
                   too_many, verify_password)
from .content import KINDS, SCHEMAS, contribution_totals, load, slugify, staff_item, validate
from .forms import LABELS, STATUSES

bp = Blueprint("staff", __name__, url_prefix="/api/staff")
_DUMMY_HASH = hash_password("not-a-real-password-1A")
PAGE = 50


def me():
    return g.staff["email"]


def bad(msg, code=400, errors=None):
    return jsonify(ok=False, error=msg, errors=errors or {}), code


def body():
    d = request.get_json(silent=True)
    return d if isinstance(d, dict) else {}


def page_args():
    try:
        p = max(1, int(request.args.get("page", 1)))
    except ValueError:
        p = 1
    return p, (p - 1) * PAGE


def csv_response(filename, header, rows_):
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(header)
    for r in rows_:
        # stop spreadsheet formula injection from form input
        w.writerow([("'" + str(c)) if str(c)[:1] in ("=", "+", "-", "@") and not re.fullmatch(r"[+-]?\d[\d.]*", str(c))
                    else c for c in r])
    return Response("﻿" + buf.getvalue(), mimetype="text/csv",
                    headers={"Content-Disposition": f'attachment; filename="{filename}"'})


# -- sign in -------------------------------------------------------------------------------
@bp.post("/login")
def login():
    if too_many("login", 8, 900):
        return bad("Too many attempts. Wait 15 minutes and try again.", 429)
    d = body()
    email = str(d.get("email", "")).strip().lower()
    pw = str(d.get("password", ""))
    staff = db.row("SELECT * FROM staff WHERE email = ?", (email,))
    if not staff:
        verify_password(_DUMMY_HASH, pw)      # same work either way, so timing does not reveal emails
        return bad("Wrong email or password.", 401)
    if not verify_password(staff["password_hash"], pw) or not staff["active"]:
        return bad("Wrong email or password.", 401)
    db.update("staff", staff["id"], {"last_login_at": db.now()})
    db.audit(email, "signed in")
    return jsonify(ok=True, token=make_token(staff), staff=public_staff(staff))


@bp.get("/me")
@staff_required()
def whoami():
    return jsonify(ok=True, staff=public_staff(g.staff), statuses=STATUSES, labels=LABELS,
                   schemas=SCHEMAS)


@bp.post("/me/password")
@staff_required()
def change_password():
    d = body()
    if not verify_password(g.staff["password_hash"], str(d.get("current", ""))):
        return bad("Your current password is not right.", errors={"current": "Not right."})
    problem = password_problem(d.get("new"))
    if problem:
        return bad(problem, errors={"new": problem})
    tv = g.staff["token_version"] + 1
    db.update("staff", g.staff["id"], {"password_hash": hash_password(d["new"]), "token_version": tv,
                                       "must_change_password": 0})
    db.audit(me(), "changed own password")
    staff = db.row("SELECT * FROM staff WHERE id = ?", (g.staff["id"],))
    return jsonify(ok=True, token=make_token(staff), staff=public_staff(staff))


@bp.post("/me/logout-all")
@staff_required()
def logout_all():
    db.update("staff", g.staff["id"], {"token_version": g.staff["token_version"] + 1})
    return jsonify(ok=True)


# -- overview ------------------------------------------------------------------------------
@bp.get("/overview")
@staff_required()
def overview():
    counts = {k: {"new": 0, "total": 0} for k in STATUSES}
    for r in db.rows("SELECT type, status, COUNT(*) AS n FROM submissions GROUP BY type, status"):
        if r["type"] in counts:
            counts[r["type"]]["total"] += r["n"]
            if r["status"] == "new":
                counts[r["type"]]["new"] += r["n"]
    month = date.today().strftime("%Y-%m")
    money = db.row("SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS n FROM contributions WHERE status='confirmed'")
    month_total = db.scalar("SELECT COALESCE(SUM(amount),0) FROM contributions WHERE status='confirmed' "
                            "AND received_on LIKE ?", (month + "%",))
    totals = contribution_totals()
    camps = [staff_item(c, totals) for c in load("campaign", published_only=False)]
    camps = [{"id": c["id"], "slug": c["slug"], "title": c["data"].get("title"), "goal": c["data"].get("goal"),
              "raised": c["raised"], "status": c["data"].get("status"), "published": c["published"]}
             for c in camps if c["data"].get("goal")]
    recent = db.rows("SELECT id, type, status, name, created_at FROM submissions ORDER BY id DESC LIMIT 8")
    gifts = db.rows("SELECT id, campaign_slug, amount, donor_name, channel, received_on, kind, member_id FROM contributions "
                    "WHERE status='confirmed' ORDER BY received_on DESC, id DESC LIMIT 8")
    from .members import all_members, summary
    _attach_members(gifts)
    return jsonify(ok=True, counts=counts, money={"total": int(money["total"]), "count": money["n"],
                                                  "month": int(month_total or 0)},
                   campaigns=camps, recent=recent, gifts=gifts, members=summary(all_members()))


# -- inbox (form submissions) --------------------------------------------------------------
def _sub_out(r):
    r = dict(r)
    r["data"] = db.loads(r["data"], {})
    return r


@bp.get("/submissions")
@staff_required()
def list_submissions():
    kind = request.args.get("type", "")
    if kind not in STATUSES:
        return bad("Unknown form type.")
    where, params = ["type = ?"], [kind]
    status = request.args.get("status", "")
    if status:
        where.append("status = ?"); params.append(status)
    q = request.args.get("q", "").strip().lower()
    if q:
        where.append("(LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR phone LIKE ?)")
        params += [f"%{q}%"] * 3
    w = " AND ".join(where)
    p, off = page_args()
    total = db.scalar(f"SELECT COUNT(*) FROM submissions WHERE {w}", params)
    items = db.rows(f"SELECT * FROM submissions WHERE {w} ORDER BY id DESC LIMIT {PAGE} OFFSET {off}", params)
    return jsonify(ok=True, items=[_sub_out(i) for i in items], total=total, page=p, per_page=PAGE)


@bp.patch("/submissions/<int:sid>")
@staff_required()
def edit_submission(sid):
    sub = db.row("SELECT * FROM submissions WHERE id = ?", (sid,))
    if not sub:
        return bad("Not found.", 404)
    d, changes = body(), {}
    if "status" in d:
        if d["status"] not in STATUSES[sub["type"]]:
            return bad("Choose a valid status.")
        changes["status"] = d["status"]
    if "notes" in d:
        changes["notes"] = str(d["notes"])[:4000]
    if not changes:
        return bad("Nothing to change.")
    changes.update(updated_at=db.now(), updated_by=me())
    db.update("submissions", sid, changes)
    db.audit(me(), "updated submission", f"{sub['type']} #{sid}", changes.get("status", "notes"))
    return jsonify(ok=True, item=_sub_out(db.row("SELECT * FROM submissions WHERE id = ?", (sid,))))


@bp.delete("/submissions/<int:sid>")
@staff_required("admin")
def delete_submission(sid):
    sub = db.row("SELECT type, name FROM submissions WHERE id = ?", (sid,))
    if not sub:
        return bad("Not found.", 404)
    db.execute("DELETE FROM submissions WHERE id = ?", (sid,))
    db.audit(me(), "deleted submission", f"{sub['type']} #{sid}", sub["name"])
    return jsonify(ok=True)


@bp.get("/submissions/export")
@staff_required()
def export_submissions():
    kind = request.args.get("type", "")
    if kind not in STATUSES:
        return bad("Unknown form type.")
    items = [_sub_out(r) for r in db.rows("SELECT * FROM submissions WHERE type = ? ORDER BY id", (kind,))]
    keys = []
    for it in items:
        keys += [k for k in it["data"] if k not in keys and not k.startswith("_") and k not in ("consent",)]
    header = ["id", "received", "status"] + keys + ["staff notes"]
    out = [[it["id"], it["created_at"], it["status"]] +
           [", ".join(v) if isinstance(v := it["data"].get(k, ""), list) else v for k in keys] + [it["notes"]]
           for it in items]
    db.audit(me(), "exported submissions", kind, f"{len(items)} rows")
    return csv_response(f"aedt-{kind}-{date.today()}.csv", header, out)


# -- website content -----------------------------------------------------------------------
def _kind_ok(kind):
    return kind in KINDS


def _unique_slug(kind, base, exclude_id=None):
    slug, n = base, 2
    while db.row("SELECT id FROM content WHERE kind = ? AND slug = ?" + (" AND id != ?" if exclude_id else ""),
                 (kind, slug, exclude_id) if exclude_id else (kind, slug)):
        slug = f"{base}-{n}"; n += 1
    return slug


def _title_of(kind, data):
    return data.get("title") or data.get("caption") or data.get("src", "")


@bp.get("/content/<kind>")
@staff_required()
def list_content(kind):
    if not _kind_ok(kind):
        return bad("Unknown content type.", 404)
    totals = contribution_totals() if kind == "campaign" else None
    items = [staff_item(it, totals) for it in load(kind, published_only=False)]
    return jsonify(ok=True, items=items, schema=SCHEMAS[kind])


def _save_content(kind, cid=None):
    d = body()
    data, errors = validate(kind, d.get("data") or {})
    if errors:
        return bad("Please fix the highlighted fields.", errors=errors)
    published = 1 if d.get("published", True) else 0
    t = db.now()
    if cid is None:
        base = slugify(d.get("slug") or _title_of(kind, data))
        slug = _unique_slug(kind, base)
        sort = (db.scalar("SELECT COALESCE(MAX(sort), 0) FROM content WHERE kind = ?", (kind,)) or 0) + 10
        if kind == "photo":   # new photos show first in the gallery
            sort = (db.scalar("SELECT COALESCE(MIN(sort), 0) FROM content WHERE kind = ?", (kind,)) or 0) - 10
        cid = db.insert("content", {"kind": kind, "slug": slug, "title": _title_of(kind, data)[:200], "sort": sort,
                                    "published": published, "data": db.dumps(data), "created_at": t,
                                    "updated_at": t, "updated_by": me()}, commit=False)
        action = "created"
    else:
        cur = db.row("SELECT * FROM content WHERE id = ? AND kind = ?", (cid, kind))
        if not cur:
            return bad("Not found.", 404)
        slug = cur["slug"]
        if d.get("slug") and slugify(d["slug"]) != slug:
            new_slug = _unique_slug(kind, slugify(d["slug"]), cid)
            if kind == "campaign":   # keep recorded contributions attached to the campaign
                db.execute("UPDATE contributions SET campaign_slug = ? WHERE campaign_slug = ?", (new_slug, slug),
                           commit=False)
            slug = new_slug
        db.update("content", cid, {"slug": slug, "title": _title_of(kind, data)[:200], "published": published,
                                   "data": db.dumps(data), "updated_at": t, "updated_by": me()}, commit=False)
        action = "updated"
    if kind == "campaign" and data.get("featured"):   # only one featured campaign at a time
        for other in load("campaign", published_only=False):
            if other["id"] != cid and other["data"].get("featured"):
                other["data"].pop("featured", None)
                db.update("content", other["id"], {"data": db.dumps(other["data"])}, commit=False)
    db.commit()
    db.audit(me(), f"{action} {kind}", slug, _title_of(kind, data)[:120])
    it = db.row("SELECT * FROM content WHERE id = ?", (cid,))
    it["data"] = db.loads(it["data"], {})
    return jsonify(ok=True, item=staff_item(it, contribution_totals() if kind == "campaign" else None))


@bp.post("/content/<kind>")
@staff_required()
def create_content(kind):
    return _save_content(kind) if _kind_ok(kind) else bad("Unknown content type.", 404)


@bp.put("/content/<kind>/<int:cid>")
@staff_required()
def update_content(kind, cid):
    return _save_content(kind, cid) if _kind_ok(kind) else bad("Unknown content type.", 404)


@bp.delete("/content/<kind>/<int:cid>")
@staff_required()
def delete_content(kind, cid):
    it = db.row("SELECT slug, title FROM content WHERE id = ? AND kind = ?", (cid, kind))
    if not it:
        return bad("Not found.", 404)
    if kind == "campaign" and db.scalar("SELECT COUNT(*) FROM contributions WHERE campaign_slug = ?", (it["slug"],)):
        return bad("This campaign has recorded contributions. Unpublish it or mark it completed instead.")
    db.execute("DELETE FROM content WHERE id = ?", (cid,))
    db.audit(me(), f"deleted {kind}", it["slug"], it["title"])
    return jsonify(ok=True)


@bp.post("/content/<kind>/reorder")
@staff_required()
def reorder(kind):
    ids = body().get("ids")
    if not _kind_ok(kind) or not isinstance(ids, list):
        return bad("Send the items in their new order.")
    for i, cid in enumerate(ids):
        db.execute("UPDATE content SET sort = ? WHERE id = ? AND kind = ?", ((i + 1) * 10, int(cid), kind),
                   commit=False)
    db.commit()
    db.audit(me(), f"reordered {kind}s")
    return jsonify(ok=True)


# -- contributions -------------------------------------------------------------------------
CHANNELS = ("mpesa", "bank", "cash", "other")
C_KINDS = ("donation", "monthly", "registration")   # gift to a campaign/general fund, monthly member contribution, KES 500 fee
C_STATUSES = ("confirmed", "pending", "void")


def _check_contribution(d):
    errors, out = {}, {}
    try:
        out["amount"] = int(float(str(d.get("amount", "")).replace(",", "")))
        if not 1 <= out["amount"] <= 100_000_000:
            raise ValueError
    except ValueError:
        errors["amount"] = "Enter an amount in KES."
    slug = d.get("campaign_slug") or None
    if slug and not db.row("SELECT id FROM content WHERE kind='campaign' AND slug = ?", (slug,)):
        errors["campaign_slug"] = "Choose a campaign from the list."
    out["campaign_slug"] = slug
    out["kind"] = d.get("kind") if d.get("kind") in C_KINDS else "donation"
    mid = d.get("member_id")
    try:
        mid = int(mid) if mid not in (None, "", 0, "0") else None
    except (TypeError, ValueError):
        mid = None
    if mid and not db.row("SELECT id FROM members WHERE id = ?", (mid,)):
        errors["member_id"] = "Choose a member from the register."
    if out["kind"] in ("monthly", "registration") and not mid:
        errors["member_id"] = "Choose which member this payment is from."
    out["member_id"] = mid
    if out["kind"] != "donation":
        out["campaign_slug"] = None          # member payments go to the general fund, not a campaign
    out["channel"] = d.get("channel") if d.get("channel") in CHANNELS else "mpesa"
    out["status"] = d.get("status") if d.get("status") in C_STATUSES else "confirmed"
    rec = str(d.get("received_on") or date.today().isoformat())[:10]
    try:
        date.fromisoformat(rec)
        out["received_on"] = rec
    except ValueError:
        errors["received_on"] = "Use a date like 2026-11-16."
    ref = re.sub(r"\s+", "", str(d.get("reference") or "")).upper()[:40]
    out["reference"] = ref or None
    for k, n in (("donor_name", 120), ("phone", 30), ("account_ref", 60), ("note", 500)):
        out[k] = " ".join(str(d.get(k) or "").split())[:n]
    return out, errors


@bp.get("/contributions")
@staff_required()
def list_contributions():
    where, params = ["1=1"], []
    if request.args.get("campaign"):
        where.append("campaign_slug = ?"); params.append(request.args["campaign"])
    if request.args.get("status"):
        where.append("status = ?"); params.append(request.args["status"])
    if request.args.get("kind"):
        where.append("kind = ?"); params.append(request.args["kind"])
    if request.args.get("member"):
        where.append("member_id = ?"); params.append(int(request.args["member"]))
    q = request.args.get("q", "").strip().lower()
    if q:
        where.append("(LOWER(donor_name) LIKE ? OR LOWER(reference) LIKE ? OR phone LIKE ?)")
        params += [f"%{q}%"] * 3
    w = " AND ".join(where)
    p, off = page_args()
    total = db.scalar(f"SELECT COUNT(*) FROM contributions WHERE {w}", params)
    s = db.scalar(f"SELECT COALESCE(SUM(amount),0) FROM contributions WHERE {w} AND status='confirmed'", params)
    items = db.rows(f"SELECT * FROM contributions WHERE {w} ORDER BY received_on DESC, id DESC "
                    f"LIMIT {PAGE} OFFSET {off}", params)
    _attach_members(items)
    return jsonify(ok=True, items=items, total=total, sum=int(s or 0), page=p, per_page=PAGE)


def _attach_members(items):
    ids = sorted({i["member_id"] for i in items if i.get("member_id")})
    names = {}
    if ids:
        marks = ",".join("?" for _ in ids)
        names = {r["id"]: r for r in db.rows(f"SELECT id, member_no, full_name FROM members WHERE id IN ({marks})", ids)}
    for i in items:
        m = names.get(i.get("member_id"))
        i["member"] = {"id": m["id"], "member_no": m["member_no"], "name": m["full_name"]} if m else None


@bp.post("/contributions")
@staff_required()
def add_contribution():
    data, errors = _check_contribution(body())
    if errors:
        return bad("Please fix the highlighted fields.", errors=errors)
    data.update(source="manual", created_at=db.now(), created_by=me())
    try:
        cid = db.insert("contributions", data)
    except Exception as e:
        if db.is_unique_error(e):
            db.rollback()
            return bad("That transaction code is already recorded.", errors={"reference": "Already recorded."})
        raise
    db.audit(me(), "recorded contribution", data["campaign_slug"] or data["kind"], f"KES {data['amount']:,}"
             + (f" member #{data['member_id']}" if data["member_id"] else ""))
    return jsonify(ok=True, item=db.row("SELECT * FROM contributions WHERE id = ?", (cid,))), 201


@bp.put("/contributions/<int:cid>")
@staff_required()
def edit_contribution(cid):
    cur = db.row("SELECT * FROM contributions WHERE id = ?", (cid,))
    if not cur:
        return bad("Not found.", 404)
    data, errors = _check_contribution({**cur, **body()})
    if errors:
        return bad("Please fix the highlighted fields.", errors=errors)
    try:
        db.update("contributions", cid, data)
    except Exception as e:
        if db.is_unique_error(e):
            db.rollback()
            return bad("That transaction code is already recorded.", errors={"reference": "Already recorded."})
        raise
    changed = "; ".join(f"{k}: {cur.get(k) or '-'} -> {v or '-'}" for k, v in data.items() if cur.get(k) != v)
    db.audit(me(), "edited contribution", f"#{cid}", changed or "no changes")
    return jsonify(ok=True, item=db.row("SELECT * FROM contributions WHERE id = ?", (cid,)))


@bp.delete("/contributions/<int:cid>")
@staff_required("admin")
def delete_contribution(cid):
    cur = db.row("SELECT * FROM contributions WHERE id = ?", (cid,))
    if not cur:
        return bad("Not found.", 404)
    db.execute("DELETE FROM contributions WHERE id = ?", (cid,))
    db.audit(me(), "deleted contribution", f"#{cid}", f"KES {cur['amount']:,} {cur['reference'] or ''}")
    return jsonify(ok=True)


IMPORT_HEADERS = ["date", "amount", "reference", "name", "phone", "campaign", "account", "channel", "type", "member", "note"]


def _find_member(key):
    """Match a member by member number, email or phone (as written in an import file)."""
    key = (key or "").strip()
    if not key:
        return None
    from .forms import normalise_phone
    phone, err = normalise_phone(key)
    r = db.row("SELECT id FROM members WHERE UPPER(member_no) = ? OR email = ? OR (phone != '' AND phone = ?)",
               (key.upper(), key.lower(), phone if not err else "-"))
    return r["id"] if r else None


@bp.post("/contributions/import")
@staff_required()
def import_contributions():
    """Import many contributions from CSV text (template columns in IMPORT_HEADERS).
    The campaign column can be a campaign slug, or leave it empty and the account column
    (e.g. 937937#meals) is matched to the campaign with that M-Pesa account number."""
    text = str(body().get("csv", ""))
    if not text.strip():
        return bad("Paste or upload a CSV first.")
    refs = {}
    for c in load("campaign", published_only=False):
        r = (c["data"].get("mpesaRef") or "").lower()
        if r and (r not in refs or c["data"].get("status") == "live"):
            refs[r] = c["slug"]
    reader = csv.DictReader(io.StringIO(text.lstrip("﻿")))
    reader.fieldnames = [(h or "").strip().lower() for h in (reader.fieldnames or [])]
    if "amount" not in reader.fieldnames:
        return bad("The first row must be the column names, including at least: amount.")
    added, skipped, problems = 0, 0, []
    for n, r in enumerate(reader, start=2):
        account = (r.get("account") or "").strip()
        raw = {"received_on": (r.get("date") or "").strip(), "amount": r.get("amount"),
               "reference": r.get("reference"), "donor_name": r.get("name"), "phone": r.get("phone"),
               "campaign_slug": (r.get("campaign") or "").strip() or refs.get(account.lower()),
               "account_ref": account, "channel": (r.get("channel") or "mpesa").strip().lower(),
               "kind": (r.get("type") or "donation").strip().lower(), "member_id": None, "note": r.get("note")}
        if r.get("member"):
            raw["member_id"] = _find_member(r.get("member"))
            if not raw["member_id"]:
                problems.append(f"Row {n}: no member found for '{r.get('member')}'"); continue
        elif raw["kind"] in ("monthly", "registration"):
            raw["member_id"] = _find_member(r.get("phone"))
        data, errors = _check_contribution(raw)
        if errors:
            problems.append(f"Row {n}: " + "; ".join(errors.values())); continue
        if data["reference"] and db.row("SELECT id FROM contributions WHERE reference = ?", (data["reference"],)):
            skipped += 1; continue
        data.update(source="import", created_at=db.now(), created_by=me())
        db.insert("contributions", data, commit=False)
        added += 1
        if added > 5000:
            break
    db.commit()
    db.audit(me(), "imported contributions", "", f"{added} added, {skipped} already recorded")
    return jsonify(ok=True, added=added, skipped=skipped, problems=problems[:50])


@bp.get("/contributions/export")
@staff_required()
def export_contributions():
    from .exports import contributions_csv
    return contributions_csv()


# -- image uploads -------------------------------------------------------------------------
@bp.post("/uploads")
@staff_required()
def upload():
    files = request.files.getlist("file")
    if not files:
        return bad("Choose at least one image.")
    out = []
    for f in files[:20]:
        try:
            probe = Image.open(f.stream)
            fmt = probe.format
            probe.verify()                 # reject files that are not real images
            f.stream.seek(0)
            im = ImageOps.exif_transpose(Image.open(f.stream))   # fixes rotation, drops GPS/EXIF data
            im.load()
        except Exception:
            return bad(f"{f.filename or 'A file'} is not an image we can read (use JPG, PNG or WebP).")
        if fmt not in ("JPEG", "PNG", "WEBP", "MPO"):
            return bad("Use JPG, PNG or WebP images.")
        im.thumbnail((2000, 2000), Image.LANCZOS)
        has_alpha = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)
        base = slugify(os.path.splitext(f.filename or "photo")[0])[:40]
        name = f"{base}-{secrets.token_hex(4)}." + ("png" if has_alpha else "jpg")
        path = os.path.join(current_app.config["UPLOAD_DIR"], name)
        if has_alpha:
            im.save(path, optimize=True)
        else:
            im.convert("RGB").save(path, quality=85, optimize=True, progressive=True)
        size = os.path.getsize(path)
        row = {"filename": name, "original": (f.filename or "")[:200], "width": im.width,
               "height": im.height, "size": size, "created_at": db.now(), "created_by": me()}
        if current_app.config.get("UPLOADS_IN_DB"):
            with open(path, "rb") as fh:
                row["data"] = base64.b64encode(fh.read()).decode()
        db.insert("uploads", row)
        out.append({"url": f"/uploads/{name}", "width": im.width, "height": im.height})
    db.audit(me(), "uploaded images", "", f"{len(out)} file(s)")
    return jsonify(ok=True, files=out), 201


@bp.get("/uploads")
@staff_required()
def list_uploads():
    items = db.rows("SELECT id, filename, original, width, height, size, created_at, created_by FROM uploads "
                    "ORDER BY id DESC LIMIT 300")
    for i in items:
        i["url"] = f"/uploads/{i['filename']}"
    return jsonify(ok=True, items=items)


@bp.delete("/uploads/<int:uid>")
@staff_required("admin")
def delete_upload(uid):
    it = db.row("SELECT * FROM uploads WHERE id = ?", (uid,))
    if not it:
        return bad("Not found.", 404)
    try:
        os.remove(os.path.join(current_app.config["UPLOAD_DIR"], it["filename"]))
    except FileNotFoundError:
        pass
    db.execute("DELETE FROM uploads WHERE id = ?", (uid,))
    db.audit(me(), "deleted image", it["filename"])
    return jsonify(ok=True)


# -- settings ------------------------------------------------------------------------------
DEFAULT_STATS = [{"value": 4500, "suffix": "+", "prefix": "", "label": "beneficiaries supported by AEDT"},
                 {"value": 1200, "suffix": "+", "prefix": "", "label": "AEDT graduates"},
                 {"value": 5, "suffix": "", "prefix": "", "label": "Association programmes"},
                 {"value": 500, "suffix": "", "prefix": "KES ", "label": "one-time registration"}]


@bp.get("/settings")
@staff_required()
def get_settings():
    return jsonify(ok=True, stats=db.get_setting("stats", DEFAULT_STATS))


@bp.put("/settings")
@staff_required("admin")
def put_settings():
    stats = body().get("stats")
    if not isinstance(stats, list) or not 1 <= len(stats) <= 6:
        return bad("Give between 1 and 6 figures.")
    clean = []
    for s in stats:
        try:
            v = int(str(s.get("value", "")).replace(",", ""))
        except ValueError:
            return bad("Each figure needs a whole number.")
        label = " ".join(str(s.get("label", "")).split())[:80]
        if not label:
            return bad("Each figure needs a label.")
        clean.append({"value": v, "label": label, "prefix": str(s.get("prefix", ""))[:8],
                      "suffix": str(s.get("suffix", ""))[:4]})
    db.set_setting("stats", clean)
    db.audit(me(), "updated homepage figures")
    return jsonify(ok=True, stats=clean)


# -- staff accounts (admin) ----------------------------------------------------------------
@bp.get("/users")
@staff_required("admin")
def users():
    return jsonify(ok=True, items=[public_staff(s) for s in db.rows("SELECT * FROM staff ORDER BY name")])


@bp.post("/users")
@staff_required("admin")
def add_user():
    d = body()
    email = str(d.get("email", "")).strip().lower()
    name = " ".join(str(d.get("name", "")).split())[:100]
    role = d.get("role") if d.get("role") in ROLES else "editor"
    errors = {}
    if not re.match(r"^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$", email):
        errors["email"] = "Enter a valid email."
    if not name:
        errors["name"] = "Enter a name."
    if errors:
        return bad("Please fix the highlighted fields.", errors=errors)
    if db.row("SELECT id FROM staff WHERE email = ?", (email,)):
        return bad("That email already has an account.", errors={"email": "Already has an account."})
    temp = secrets.token_urlsafe(9) + "A1"
    db.insert("staff", {"email": email, "name": name, "role": role, "password_hash": hash_password(temp),
                        "must_change_password": 1, "created_at": db.now()})
    db.audit(me(), "added staff account", email, role)
    return jsonify(ok=True, temp_password=temp), 201


@bp.patch("/users/<int:uid>")
@staff_required("admin")
def edit_user(uid):
    s = db.row("SELECT * FROM staff WHERE id = ?", (uid,))
    if not s:
        return bad("Not found.", 404)
    d, changes, temp = body(), {}, None
    if "name" in d and str(d["name"]).strip():
        changes["name"] = " ".join(str(d["name"]).split())[:100]
    if "role" in d and d["role"] in ROLES:
        changes["role"] = d["role"]
    if "active" in d:
        changes["active"] = 1 if d["active"] else 0
    removing_admin = (changes.get("role", s["role"]) != "admin" or changes.get("active", s["active"]) == 0)
    if s["role"] == "admin" and s["active"] and removing_admin:
        if db.scalar("SELECT COUNT(*) FROM staff WHERE role='admin' AND active=1") <= 1:
            return bad("Keep at least one active admin.")
    if d.get("reset_password"):
        temp = secrets.token_urlsafe(9) + "A1"
        changes.update(password_hash=hash_password(temp), must_change_password=1)
    if changes:
        changes["token_version"] = s["token_version"] + 1   # signs them out everywhere
        db.update("staff", uid, changes)
        db.audit(me(), "updated staff account", s["email"],
                 ", ".join(k for k in changes if k not in ("password_hash", "token_version")))
    return jsonify(ok=True, item=public_staff(db.row("SELECT * FROM staff WHERE id = ?", (uid,))),
                   temp_password=temp)


@bp.get("/audit")
@staff_required("admin")
def audit_log():
    p, off = page_args()
    items = db.rows(f"SELECT * FROM audit ORDER BY id DESC LIMIT {PAGE} OFFSET {off}")
    total = db.scalar("SELECT COUNT(*) FROM audit")
    return jsonify(ok=True, items=items, total=total, page=p, per_page=PAGE)
