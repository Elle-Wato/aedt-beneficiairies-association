"""Rules for the editable website content and the helpers that turn it into public JSON.

Each item is stored as one row in `content` (kind + slug + JSON data). The field lists below
decide what staff can set from the dashboard; anything else is dropped.
"""
import re
from datetime import date

from . import db

KINDS = ("campaign", "update", "event", "photo", "opportunity")

# field types: str (one line), text (paragraph), int, bool, date, url (link or /path),
#              list (list of short strings), paras (list of paragraphs), choice:<a|b>, obj:<keys>
SCHEMAS = {
    "campaign": {
        "title": "str!", "category": "str", "status": "choice:live|upcoming|completed", "kind": "choice:|student",
        "start": "date", "end": "date", "image": "url", "video": "url", "poster": "url",
        "summary": "text!", "body": "paras", "asks": "list", "cta": "pair",
        "goal": "int", "raised_offline": "int", "supporters_offline": "int",
        "unit": "obj:amount:int,one:str,many:str,per:str", "student": "obj:name:str,course:str,institution:str",
        "revolving": "bool", "mpesaRef": "str", "featured": "bool",
    },
    "update": {"title": "str!", "date": "date!", "tag": "str", "summary": "text!", "image": "url", "link": "url"},
    "event": {"title": "str!", "date": "date!", "place": "str", "note": "str", "link": "url"},
    "photo": {"src": "url!", "category": "str!", "caption": "str", "alt": "str"},
    "opportunity": {"title": "str!", "org": "str!", "type": "choice:Internship|Attachment|Graduate job|Volunteer placement",
                    "field": "str", "location": "str", "duration": "str", "deadline": "date", "summary": "text",
                    "link": "url"},
}
LIMITS = {"str": 200, "text": 2000, "paras": 3000, "list": 200, "url": 500}
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
URL_RE = re.compile(r"^(https?://[^\s<>\"']+|/[^\s<>\"']*)$")


def slugify(text):
    s = re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")
    return s[:70] or "item"


def _clean(kind, ftype, value, errors, key):
    required = ftype.endswith("!")
    ftype = ftype.rstrip("!")
    empty = value is None or value == "" or value == [] or value == {}
    if empty:
        if required:
            errors[key] = "This is required."
        return None
    if ftype in ("str", "text"):
        v = str(value).strip()
        if ftype == "str":
            v = " ".join(v.split())
        if len(v) > LIMITS[ftype]:
            errors[key] = f"Keep this under {LIMITS[ftype]} characters."
        return v or None
    if ftype == "int":
        try:
            v = int(float(str(value).replace(",", "").strip()))
        except ValueError:
            errors[key] = "Enter a whole number."
            return None
        if v < 0 or v > 1_000_000_000:
            errors[key] = "Enter an amount between 0 and 1,000,000,000."
        return v
    if ftype == "bool":
        return bool(value) and value not in ("false", "0", 0)
    if ftype == "date":
        v = str(value).strip()[:10]
        try:
            if not DATE_RE.match(v):
                raise ValueError
            date.fromisoformat(v)
        except ValueError:
            errors[key] = "Use a date like 2026-12-05."
            return None
        return v
    if ftype == "url":
        v = str(value).strip()
        if not URL_RE.match(v) or len(v) > LIMITS["url"]:
            errors[key] = "Use a full link (https://...) or a site path (/images/...)."
            return None
        return v
    if ftype in ("list", "paras"):
        items = value if isinstance(value, list) else str(value).split("\n")
        out = [" ".join(str(x).split()) if ftype == "list" else str(x).strip() for x in items]
        out = [x for x in out if x][:20]
        if any(len(x) > LIMITS[ftype] for x in out):
            errors[key] = f"Keep each line under {LIMITS[ftype]} characters."
        return out or None
    if ftype == "pair":   # [button text, link]
        if not isinstance(value, (list, tuple)) or len(value) != 2 or not all(value):
            return None
        text, link = str(value[0]).strip()[:60], str(value[1]).strip()
        if not URL_RE.match(link):
            errors[key] = "The button link must start with / or https://"
            return None
        return [text, link]
    if ftype.startswith("choice:"):
        options = ftype[7:].split("|")
        v = str(value).strip()
        if v not in options:
            errors[key] = "Choose one of: " + ", ".join(o or "(none)" for o in options)
            return None
        return v or None
    if ftype.startswith("obj:"):
        if not isinstance(value, dict):
            return None
        out = {}
        for part in ftype[4:].split(","):
            k, t = part.split(":")
            sub = _clean(kind, t, value.get(k), errors, f"{key}.{k}")
            if sub is not None:
                out[k] = sub
        return out or None
    return None


def validate(kind, payload):
    """Return (clean_data, errors)."""
    errors, data = {}, {}
    for key, ftype in SCHEMAS[kind].items():
        v = _clean(kind, ftype, payload.get(key), errors, key)
        if v is not None:
            data[key] = v
    if kind == "campaign":
        data.setdefault("status", "live")
        unit = data.get("unit")
        if unit and not unit.get("amount"):
            errors["unit.amount"] = "Give the cost of helping one person, or clear these fields."
        if data.get("end") and data.get("start") and data["end"] < data["start"]:
            errors["end"] = "The end date is before the start date."
    return data, errors


# -- public output -------------------------------------------------------------------------
def contribution_totals():
    out = {}
    for r in db.rows("SELECT campaign_slug, COALESCE(SUM(amount),0) AS total, COUNT(*) AS n FROM contributions "
                     "WHERE status = 'confirmed' AND campaign_slug IS NOT NULL GROUP BY campaign_slug"):
        out[r["campaign_slug"]] = (int(r["total"]), int(r["n"]))
    return out


def campaign_public(item, totals):
    d = dict(item["data"])
    total, n = totals.get(item["slug"], (0, 0))
    offline, offline_n = d.pop("raised_offline", None), d.pop("supporters_offline", None)
    if d.get("goal") is not None or offline is not None or total:
        d["raised"] = (offline or 0) + total
    else:
        d["raised"] = None
    d["supporters"] = ((offline_n or 0) + n) if (offline_n or n) else None
    d["slug"] = item["slug"]
    return d


def load(kind, published_only=True):
    sql = "SELECT * FROM content WHERE kind = ?" + (" AND published = 1" if published_only else "") + \
          " ORDER BY sort, id"
    items = db.rows(sql, (kind,))
    for it in items:
        it["data"] = db.loads(it["data"], {})
    return items


def public_bundle():
    today = date.today().isoformat()
    totals = contribution_totals()
    campaigns = [campaign_public(c, totals) for c in load("campaign")]
    updates = sorted(({**u["data"], "id": u["slug"]} for u in load("update")), key=lambda x: x.get("date", ""),
                     reverse=True)
    events = sorted((e["data"] for e in load("event") if e["data"].get("date", "") >= today),
                    key=lambda x: x["date"])
    photos = [p["data"] for p in load("photo")]
    opps = [{**o["data"], "id": o["slug"]} for o in load("opportunity")
            if not o["data"].get("deadline") or o["data"]["deadline"] >= today]
    return {
        "campaigns": campaigns, "updates": updates, "events": events, "photos": photos,
        "opportunities": opps, "stats": db.get_setting("stats", None),
        "generated_at": db.now(),
    }


def staff_item(it, totals=None):
    out = {"id": it["id"], "slug": it["slug"], "published": bool(it["published"]), "sort": it["sort"],
           "updated_at": it["updated_at"], "updated_by": it["updated_by"], "data": it["data"]}
    if it["kind"] == "campaign" and totals is not None:
        pub = campaign_public(it, totals)
        out["raised"], out["supporters"] = pub["raised"], pub["supporters"]
        out["tracked"] = totals.get(it["slug"], (0, 0))[0]
    return out
