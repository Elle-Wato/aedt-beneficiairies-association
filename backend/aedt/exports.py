"""CSV downloads for analysis in Excel or Google Sheets. One tidy table per file, one row per record,
plain column names, dates as YYYY-MM-DD and lists separated by "; "."""
import csv
import io
import zipfile
from datetime import date

from flask import Blueprint, Response, g, jsonify, request

from . import db
from .auth import staff_required
from .members import all_members

bp = Blueprint("exports", __name__, url_prefix="/api/staff/export")
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

STATUS_NAMES = {"current": "Current beneficiary", "graduate": "Graduate", "former": "Former beneficiary", "other": "Other"}
KIND_NAMES = {"donation": "Donation", "monthly": "Monthly contribution", "registration": "Registration fee"}


def _cell(v):
    if isinstance(v, list):
        v = "; ".join(str(x) for x in v)
    elif isinstance(v, bool):
        v = "Yes" if v else "No"
    elif v is None:
        v = ""
    s = str(v)
    # stop spreadsheet formula tricks from form input (numbers like -500 are left alone)
    if s[:1] in ("=", "+", "-", "@") and not s.replace(".", "", 1).lstrip("+-").isdigit():
        s = "'" + s
    return s


def to_csv(header, rows):
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(header)
    for r in rows:
        w.writerow([_cell(c) for c in r])
    return "﻿" + buf.getvalue()          # BOM so Excel opens it as UTF-8


def send(name, text):
    return Response(text, mimetype="text/csv; charset=utf-8",
                    headers={"Content-Disposition": f'attachment; filename="aedt-{name}-{date.today()}.csv"'})


# -- datasets -------------------------------------------------------------------------------
def members_table():
    header = ["Member no", "Full name", "Email", "Phone", "County", "Institution", "AEDT status", "Status",
              "Joined on", "Monthly pledge (KES)", "Months due", "Expected to date (KES)", "Paid to date (KES)",
              "Balance (KES)", "Months behind", "Paid this month (KES)", "Last payment", "Registration paid",
              "Other gifts (KES)", "Notes"]
    rows = [[m["member_no"], m["full_name"], m["email"], m["phone"], m["county"], m["institution"],
             STATUS_NAMES.get(m["aedt_status"], m["aedt_status"]), m["status"], m["joined_on"], m["monthly_pledge"],
             m["months_due"], m["expected"], m["paid"], m["balance"], m["months_behind"], m["paid_this_month"],
             m["last_payment"] or "", m["registration_paid"], m["other_gifts"], m["notes"]] for m in all_members()]
    return header, rows


def monthly_table(year):
    """One row per member, one column per month of `year` with what they paid that month."""
    paid = {}
    for r in db.rows("SELECT member_id, SUBSTR(received_on, 6, 2) AS mm, COALESCE(SUM(amount),0) AS total "
                     "FROM contributions WHERE status='confirmed' AND kind='monthly' AND member_id IS NOT NULL "
                     "AND received_on LIKE ? GROUP BY member_id, SUBSTR(received_on, 6, 2)", (f"{year}%",)):
        paid.setdefault(r["member_id"], {})[int(r["mm"])] = int(r["total"])
    today = date.today()
    last_month = 12 if year < today.year else (today.month if year == today.year else 0)
    header = ["Member no", "Full name", "Phone", "Status", "Joined on", "Monthly pledge (KES)"] + \
             [f"{m} {year}" for m in MONTHS] + [f"Paid in {year}", f"Expected in {year}", f"Balance {year}"]
    rows = []
    for m in all_members():
        try:
            j = date.fromisoformat(m["joined_on"])
        except ValueError:
            continue
        if j.year > year:
            continue
        first = 1 if j.year < year else j.month
        months = max(0, last_month - first + 1)
        expected = m["monthly_pledge"] * months if m["status"] == "active" else 0
        by = paid.get(m["id"], {})
        total = sum(by.values())
        rows.append([m["member_no"], m["full_name"], m["phone"], m["status"], m["joined_on"], m["monthly_pledge"]]
                    + [by.get(i, 0) for i in range(1, 13)] + [total, expected, total - expected])
    return header, rows


SUBMISSION_COLUMNS = {
    "applications": ("member", [("full_name", "Full name"), ("email", "Email"), ("phone", "Phone"), ("county", "County"),
                     ("institution", "Institution"), ("course", "Course"), ("graduation_year", "Graduation year"),
                     ("aedt_status", "AEDT status"), ("employment_status", "Employment"), ("industry", "Industry"),
                     ("interests", "Interests"), ("monthly_pledge", "Monthly pledge (KES)")]),
    "mentors": ("volunteer", [("full_name", "Full name"), ("email", "Email"), ("phone", "Phone"), ("role", "Signed up as"),
                ("is_member", "Member?"), ("location", "Location"), ("profession", "Profession"),
                ("organisation", "Organisation"), ("mentor_areas", "Mentoring areas"), ("availability", "Availability"),
                ("experience", "Experience")]),
    "volunteers": ("volunteer", [("full_name", "Full name"), ("email", "Email"), ("phone", "Phone"), ("role", "Signed up as"),
                   ("is_member", "Member?"), ("location", "Location"), ("profession", "Profession"),
                   ("organisation", "Organisation"), ("volunteer_areas", "Volunteering areas"),
                   ("availability", "Availability"), ("experience", "Experience")]),
    "internships": ("placement", [("full_name", "Full name"), ("email", "Email"), ("phone", "Phone"),
                    ("aedt_status", "AEDT status"), ("institution", "Institution"), ("course", "Course"),
                    ("year_of_study", "Year of study"), ("placement_type", "Placement type"), ("fields", "Fields"),
                    ("location", "Preferred location"), ("start_month", "Can start"), ("duration", "Duration"),
                    ("cv_link", "CV link"), ("opportunity", "Applied for listing"), ("message", "Message")]),
    "messages": ("contact", [("name", "Name"), ("email", "Email"), ("subject", "Subject"), ("message", "Message")]),
}
ROLE_FILTER = {"mentors": ("mentor", "both"), "volunteers": ("volunteer", "both")}


def submissions_table(name):
    kind, cols = SUBMISSION_COLUMNS[name]
    header = ["Ref", "Received"] + [label for _, label in cols] + ["Status", "Repeat submission", "Staff notes",
                                                                    "Last updated by"]
    members = {r["application_id"]: r["member_no"] for r in db.rows("SELECT application_id, member_no FROM members "
                                                                    "WHERE application_id IS NOT NULL")}
    if kind == "member":
        header.insert(header.index("Status") + 1, "Member no")
    rows = []
    for s in db.rows("SELECT * FROM submissions WHERE type = ? ORDER BY id", (kind,)):
        d = db.loads(s["data"], {})
        if name in ROLE_FILTER and d.get("role") not in ROLE_FILTER[name]:
            continue
        vals = []
        for key, _ in cols:
            v = d.get(key, "")
            if key == "aedt_status":
                v = STATUS_NAMES.get(v, v)
            vals.append(v)
        row = [s["id"], s["created_at"][:10]] + vals + [s["status"]]
        if kind == "member":
            row.append(members.get(s["id"], ""))
        rows.append(row + [bool(d.get("_repeat")), s["notes"], s["updated_by"] or ""])
    return header, rows


def contributions_table(year=None):
    camps = {r["slug"]: r["title"] for r in db.rows("SELECT slug, title FROM content WHERE kind = 'campaign'")}
    mem = {r["id"]: r for r in db.rows("SELECT id, member_no, full_name FROM members")}
    where, params = "", ()
    if year:
        where, params = "WHERE received_on LIKE ?", (f"{year}%",)
    header = ["Ref", "Date", "Month", "Amount (KES)", "Type", "Member no", "Member name", "Giver name", "Campaign",
              "Channel", "Transaction code", "Account used", "Status", "Note", "Recorded by", "Recorded at"]
    rows = []
    for c in db.rows(f"SELECT * FROM contributions {where} ORDER BY received_on, id", params):
        m = mem.get(c["member_id"]) or {}
        rows.append([c["id"], c["received_on"], c["received_on"][:7], c["amount"], KIND_NAMES.get(c["kind"], c["kind"]),
                     m.get("member_no", ""), m.get("full_name", ""), c["donor_name"],
                     camps.get(c["campaign_slug"], c["campaign_slug"] or ("" if c["kind"] != "donation" else "General fund")),
                     c["channel"], c["reference"] or "", c["account_ref"], c["status"], c["note"],
                     c["created_by"] or c["source"], c["created_at"]])
    return header, rows


def changelog_table():
    header = ["When (UTC)", "Staff", "Action", "Item", "Details"]
    return header, [[a["created_at"], a["staff_email"], a["action"], a["target"], a["detail"]]
                    for a in db.rows("SELECT * FROM audit ORDER BY id")]


def _year():
    try:
        y = int(request.args.get("year", date.today().year))
        return y if 2000 <= y <= 2100 else date.today().year
    except ValueError:
        return date.today().year


DATASETS = {
    "members": ("Members register", lambda: members_table()),
    "monthly": ("Monthly contributions by member", lambda: monthly_table(_year())),
    "applications": ("Membership applications", lambda: submissions_table("applications")),
    "mentors": ("Mentors", lambda: submissions_table("mentors")),
    "volunteers": ("Volunteers", lambda: submissions_table("volunteers")),
    "internships": ("Internship and attachment applications", lambda: submissions_table("internships")),
    "messages": ("Contact messages", lambda: submissions_table("messages")),
    "contributions": ("All contributions", lambda: contributions_table(request.args.get("year") and _year())),
    "changelog": ("Change log", lambda: changelog_table()),
}
ADMIN_ONLY = {"changelog"}


def contributions_csv():
    return send("contributions", to_csv(*contributions_table()))


@bp.get("/")
@staff_required()
def catalogue():
    out = []
    for key, (label, fn) in DATASETS.items():
        if key in ADMIN_ONLY and g.staff["role"] != "admin":
            continue
        _, rows = fn()
        out.append({"key": key, "label": label, "rows": len(rows)})
    return jsonify(ok=True, items=out, year=_year())


@bp.get("/<name>")
@staff_required()
def one(name):
    if name == "all":
        return everything()
    if name not in DATASETS:
        return jsonify(ok=False, error="Unknown download."), 404
    if name in ADMIN_ONLY and g.staff["role"] != "admin":
        return jsonify(ok=False, error="Only admins can download the change log."), 403
    db.audit(g.staff["email"], "downloaded data", name)
    suffix = f"-{_year()}" if name == "monthly" else ""
    return send(name + suffix, to_csv(*DATASETS[name][1]()))


def everything():
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        for key, (label, fn) in DATASETS.items():
            if key in ADMIN_ONLY and g.staff["role"] != "admin":
                continue
            name = f"{key}-{_year()}" if key == "monthly" else key
            z.writestr(f"aedt-{name}.csv", to_csv(*fn()))
        z.writestr("README.txt", "AEDT Beneficiaries Association data export, " + date.today().isoformat() +
                   ".\nOpen the CSV files in Excel or Google Sheets. Amounts are in KES.\n"
                   "Contains personal data: store it securely and delete copies you no longer need.\n")
    db.audit(g.staff["email"], "downloaded data", "all files")
    return Response(buf.getvalue(), mimetype="application/zip",
                    headers={"Content-Disposition": f'attachment; filename="aedt-data-{date.today()}.zip"'})
