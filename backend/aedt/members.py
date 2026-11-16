"""Members register: who has joined, what they pledged each month, what they have paid and who is behind."""
import csv
import io
import re
from datetime import date

from flask import Blueprint, g, jsonify, request

from . import db
from .auth import staff_required
from .forms import EMAIL_RE, normalise_phone

bp = Blueprint("members", __name__, url_prefix="/api/staff")
STATUSES = ("active", "paused", "left")
AEDT_STATUS = ("", "current", "graduate", "former", "other")
PAGE = 50
FIELDS = ("member_no", "full_name", "email", "phone", "county", "institution", "aedt_status", "monthly_pledge",
          "joined_on", "status", "notes")


def me():
    return g.staff["email"]


def bad(msg, code=400, errors=None):
    return jsonify(ok=False, error=msg, errors=errors or {}), code


def months_due(joined_on, today=None):
    """Months a member should have paid for, counting the month they joined and the current month."""
    today = today or date.today()
    try:
        j = date.fromisoformat(joined_on[:10])
    except (TypeError, ValueError):
        return 0
    n = (today.year - j.year) * 12 + today.month - j.month + 1
    return max(0, n)


def payment_totals(member_ids=None):
    """{member_id: {"monthly": total, "registration": total, "last": date, "this_month": total}}"""
    month = date.today().strftime("%Y-%m")
    out = {}
    for r in db.rows("SELECT member_id, kind, COALESCE(SUM(amount),0) AS total, MAX(received_on) AS last, "
                     "COALESCE(SUM(CASE WHEN received_on LIKE ? AND kind = 'monthly' THEN amount ELSE 0 END),0) AS tm "
                     "FROM contributions WHERE status = 'confirmed' AND member_id IS NOT NULL "
                     "GROUP BY member_id, kind", (month + "%",)):
        t = out.setdefault(r["member_id"], {"monthly": 0, "registration": 0, "other": 0, "last": None, "this_month": 0})
        key = r["kind"] if r["kind"] in ("monthly", "registration") else "other"
        t[key] += int(r["total"])
        t["this_month"] += int(r["tm"])
        if r["last"] and (not t["last"] or r["last"] > t["last"]):
            t["last"] = r["last"]
    return out


def with_stats(m, totals):
    t = totals.get(m["id"], {"monthly": 0, "registration": 0, "other": 0, "last": None, "this_month": 0})
    due = months_due(m["joined_on"])
    expected = m["monthly_pledge"] * due
    m = dict(m)
    m.update(months_due=due, expected=expected, paid=t["monthly"], balance=t["monthly"] - expected,
             paid_this_month=t["this_month"], registration_paid=t["registration"] > 0,
             registration_amount=t["registration"], other_gifts=t["other"], last_payment=t["last"])
    m["months_behind"] = (-m["balance"] // m["monthly_pledge"]) if m["balance"] < 0 and m["monthly_pledge"] else 0
    return m


def all_members():
    totals = payment_totals()
    return [with_stats(m, totals) for m in db.rows("SELECT * FROM members ORDER BY full_name")]


def summary(items):
    active = [m for m in items if m["status"] == "active"]
    month = date.today().strftime("%Y-%m")
    collected = db.scalar("SELECT COALESCE(SUM(amount),0) FROM contributions WHERE status='confirmed' "
                          "AND kind='monthly' AND received_on LIKE ?", (month + "%",))
    committed = sum(m["monthly_pledge"] for m in active)
    return {"total": len(items), "active": len(active), "committed_monthly": committed,
            "collected_this_month": int(collected or 0),
            "paid_this_month_count": sum(1 for m in active if m["paid_this_month"] > 0),
            "behind": sum(1 for m in active if m["months_behind"] > 0),
            "arrears": sum(-m["balance"] for m in active if m["balance"] < 0),
            "registration_unpaid": sum(1 for m in active if not m["registration_paid"])}


def clean(d, current=None):
    errors, out = {}, {}
    name = " ".join(str(d.get("full_name") or "").split())[:120]
    if len(name) < 3:
        errors["full_name"] = "Enter the member's full name."
    out["full_name"] = name
    email = str(d.get("email") or "").strip().lower()[:160]
    if email and not EMAIL_RE.match(email):
        errors["email"] = "Enter a valid email or leave it empty."
    out["email"] = email
    phone, err = normalise_phone(d.get("phone"))
    if err:
        errors["phone"] = err
    out["phone"] = phone
    for k, n in (("county", 80), ("institution", 150)):
        out[k] = " ".join(str(d.get(k) or "").split())[:n]
    out["aedt_status"] = d.get("aedt_status") if d.get("aedt_status") in AEDT_STATUS else ""
    try:
        pledge = int(float(str(d.get("monthly_pledge") or 0).replace(",", "")))
        if not 0 <= pledge <= 10_000_000:
            raise ValueError
        out["monthly_pledge"] = pledge
    except ValueError:
        errors["monthly_pledge"] = "Enter the monthly amount in KES (0 if none)."
    joined = str(d.get("joined_on") or date.today().isoformat())[:10]
    try:
        date.fromisoformat(joined)
        out["joined_on"] = joined
    except ValueError:
        errors["joined_on"] = "Use a date like 2026-11-16."
    out["status"] = d.get("status") if d.get("status") in STATUSES else "active"
    out["notes"] = str(d.get("notes") or "")[:2000]
    no = re.sub(r"\s+", "", str(d.get("member_no") or "")).upper()[:30]
    if no:
        clash = db.row("SELECT id FROM members WHERE member_no = ?", (no,))
        if clash and (not current or clash["id"] != current["id"]):
            errors["member_no"] = "Another member already has this number."
        out["member_no"] = no
    return out, errors


def _create(data, application_id=None):
    t = db.now()
    data = {**data, "application_id": application_id, "created_at": t, "updated_at": t, "updated_by": me()}
    no = data.pop("member_no", None)
    mid = db.insert("members", data, commit=False)
    db.update("members", mid, {"member_no": no or f"AEDT-{mid:04d}"}, commit=False)
    db.commit()
    return mid


def _duplicate(data, exclude=None):
    for k in ("email", "phone"):
        if data.get(k):
            r = db.row(f"SELECT id, full_name, member_no FROM members WHERE {k} = ?" + (" AND id != ?" if exclude else ""),
                       (data[k], exclude) if exclude else (data[k],))
            if r:
                return r, k
    return None, None


@bp.get("/members")
@staff_required()
def list_members():
    items = all_members()
    summ = summary(items)
    q = request.args.get("q", "").strip().lower()
    st = request.args.get("status", "")
    if st:
        items = [m for m in items if m["status"] == st]
    if request.args.get("behind"):
        items = [m for m in items if m["months_behind"] > 0 and m["status"] == "active"]
    if request.args.get("unpaid_reg"):
        items = [m for m in items if not m["registration_paid"] and m["status"] == "active"]
    if q:
        items = [m for m in items if q in m["full_name"].lower() or q in m["email"] or q in m["phone"]
                 or q in (m["member_no"] or "").lower()]
    sort = request.args.get("sort", "name")
    if sort == "behind":
        items.sort(key=lambda m: m["balance"])
    elif sort == "pledge":
        items.sort(key=lambda m: -m["monthly_pledge"])
    elif sort == "joined":
        items.sort(key=lambda m: m["joined_on"], reverse=True)
    try:
        p = max(1, int(request.args.get("page", 1)))
    except ValueError:
        p = 1
    return jsonify(ok=True, items=items[(p - 1) * PAGE:p * PAGE], total=len(items), page=p, per_page=PAGE,
                   summary=summ)


@bp.get("/members/lookup")
@staff_required()
def lookup():
    q = request.args.get("q", "").strip().lower()
    like = f"%{q}%"
    items = db.rows("SELECT id, member_no, full_name, phone, monthly_pledge, status FROM members "
                    "WHERE LOWER(full_name) LIKE ? OR LOWER(member_no) LIKE ? OR phone LIKE ? OR email LIKE ? "
                    "ORDER BY full_name LIMIT 12", (like, like, like, like))
    return jsonify(ok=True, items=items)


@bp.get("/members/<int:mid>")
@staff_required()
def get_member(mid):
    m = db.row("SELECT * FROM members WHERE id = ?", (mid,))
    if not m:
        return bad("Not found.", 404)
    pays = db.rows("SELECT * FROM contributions WHERE member_id = ? ORDER BY received_on DESC, id DESC", (mid,))
    return jsonify(ok=True, item=with_stats(m, payment_totals()), payments=pays)


@bp.post("/members")
@staff_required()
def add_member():
    data, errors = clean(request.get_json(silent=True) or {})
    if errors:
        return bad("Please fix the highlighted fields.", errors=errors)
    dup, k = _duplicate(data)
    if dup:
        return bad(f"{dup['full_name']} ({dup['member_no']}) already has this {k}.", errors={k: "Already in the register."})
    mid = _create(data)
    db.audit(me(), "added member", data["full_name"], f"KES {data['monthly_pledge']:,}/month")
    return jsonify(ok=True, item=with_stats(db.row("SELECT * FROM members WHERE id = ?", (mid,)), payment_totals())), 201


@bp.put("/members/<int:mid>")
@staff_required()
def edit_member(mid):
    cur = db.row("SELECT * FROM members WHERE id = ?", (mid,))
    if not cur:
        return bad("Not found.", 404)
    data, errors = clean({**cur, **(request.get_json(silent=True) or {})}, current=cur)
    if errors:
        return bad("Please fix the highlighted fields.", errors=errors)
    dup, k = _duplicate(data, exclude=mid)
    if dup:
        return bad(f"{dup['full_name']} ({dup['member_no']}) already has this {k}.", errors={k: "Already in the register."})
    changes = {k: v for k, v in data.items() if cur.get(k) != v}
    if changes:
        db.update("members", mid, {**changes, "updated_at": db.now(), "updated_by": me()})
        # change log keeps old -> new values (notes are summarised)
        detail = "; ".join(f"{k}: {cur.get(k) or '-'} -> {v or '-'}" if k != "notes" else "notes edited"
                           for k, v in changes.items())
        db.audit(me(), "updated member", f"{cur['member_no']} {cur['full_name']}", detail)
    return jsonify(ok=True, item=with_stats(db.row("SELECT * FROM members WHERE id = ?", (mid,)), payment_totals()))


@bp.delete("/members/<int:mid>")
@staff_required("admin")
def delete_member(mid):
    cur = db.row("SELECT * FROM members WHERE id = ?", (mid,))
    if not cur:
        return bad("Not found.", 404)
    if db.scalar("SELECT COUNT(*) FROM contributions WHERE member_id = ?", (mid,)):
        return bad("This member has recorded payments. Set their status to 'left' instead.")
    db.execute("DELETE FROM members WHERE id = ?", (mid,))
    db.audit(me(), "deleted member", f"{cur['member_no']} {cur['full_name']}")
    return jsonify(ok=True)


@bp.post("/members/from-application/<int:sid>")
@staff_required()
def from_application(sid):
    sub = db.row("SELECT * FROM submissions WHERE id = ? AND type = 'member'", (sid,))
    if not sub:
        return bad("Membership application not found.", 404)
    existing = db.row("SELECT id, member_no FROM members WHERE application_id = ?", (sid,))
    if existing:
        return bad(f"Already in the register as {existing['member_no']}.")
    d = db.loads(sub["data"], {})
    data, errors = clean({"full_name": d.get("full_name"), "email": d.get("email"), "phone": d.get("phone"),
                          "county": d.get("county"), "institution": d.get("institution"),
                          "aedt_status": d.get("aedt_status"), "monthly_pledge": d.get("monthly_pledge"),
                          "joined_on": date.today().isoformat()})
    if errors:
        return bad("Some details in the application need fixing first: " + "; ".join(errors.values()))
    dup, k = _duplicate(data)
    if dup:
        return bad(f"{dup['full_name']} ({dup['member_no']}) is already in the register with this {k}.")
    mid = _create(data, application_id=sid)
    if sub["status"] in ("new", "contacted"):
        db.update("submissions", sid, {"status": "approved", "updated_at": db.now(), "updated_by": me()})
    m = db.row("SELECT * FROM members WHERE id = ?", (mid,))
    db.audit(me(), "approved member", f"{m['member_no']} {m['full_name']}", f"from application #{sid}")
    return jsonify(ok=True, item=with_stats(m, payment_totals())), 201


@bp.post("/members/import")
@staff_required()
def import_members():
    """CSV with a header row. Columns (any order): name, email, phone, monthly_pledge, joined_on, member_no,
    county, institution, aedt_status, status, notes. Rows whose email or phone is already registered are skipped."""
    text = str((request.get_json(silent=True) or {}).get("csv", ""))
    if not text.strip():
        return bad("Paste or upload a CSV first.")
    reader = csv.DictReader(io.StringIO(text.lstrip("﻿")))
    reader.fieldnames = [(h or "").strip().lower().replace(" ", "_") for h in (reader.fieldnames or [])]
    if not ({"name", "full_name"} & set(reader.fieldnames)):
        return bad("The first row must be the column names, including at least: name.")
    added, skipped, problems = 0, 0, []
    for n, r in enumerate(reader, start=2):
        r = {k: (v or "").strip() for k, v in r.items() if k}
        r["full_name"] = r.get("full_name") or r.get("name", "")
        r["monthly_pledge"] = r.get("monthly_pledge") or r.get("pledge") or 0
        r["joined_on"] = r.get("joined_on") or r.get("joined") or None
        data, errors = clean(r)
        if errors:
            problems.append(f"Row {n}: " + "; ".join(errors.values())); continue
        if _duplicate(data)[0]:
            skipped += 1; continue
        _create(data)
        added += 1
        if added >= 5000:
            break
    db.audit(me(), "imported members", "", f"{added} added, {skipped} already registered")
    return jsonify(ok=True, added=added, skipped=skipped, problems=problems[:50])
