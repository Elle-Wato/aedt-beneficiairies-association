import csv
import io
import os
import zipfile
from datetime import date

import pytest
from PIL import Image

from aedt import create_app, db
from aedt.auth import hash_password

ADMIN = {"email": "admin@example.org", "password": "Str0ngPassword!"}


PG_URL = os.environ.get("TEST_DATABASE_URL", "")   # e.g. a Neon branch, or a local PostgreSQL


def _reset_pg():
    from aedt.db import Database
    con = Database(PG_URL, "").connect()
    for t in ("staff", "submissions", "content", "contributions", "uploads", "settings", "audit", "members"):
        con.execute(f"DROP TABLE IF EXISTS {t} CASCADE")
    con.commit(); con.close()


@pytest.fixture()
def app(tmp_path):
    if PG_URL:
        _reset_pg()
    a = create_app({"TESTING": True, "SECRET_KEY": "test-secret-for-the-aedt-test-suite-0001", "SQLITE_PATH": str(tmp_path / "t.db"),
                    "DATABASE_URL": PG_URL, "UPLOAD_DIR": str(tmp_path / "up"), "CORS_ORIGINS": ["https://site.example"]})
    with a.app_context():
        db.insert("staff", {"email": ADMIN["email"], "name": "Admin", "role": "admin",
                            "password_hash": hash_password(ADMIN["password"]), "created_at": db.now()})
        db.close_db()
    return a


@pytest.fixture()
def c(app):
    return app.test_client()


def auth(c, creds=ADMIN):
    r = c.post("/api/staff/login", json=creds)
    assert r.status_code == 200, r.get_json()
    return {"Authorization": "Bearer " + r.get_json()["token"]}


MEMBER = {"full_name": "Amina Hassan", "email": "Amina@Example.com", "phone": "0712 345 678", "county": "Garissa",
          "aedt_status": "graduate", "employment_status": "Employed", "interests": ["mentorship", "bogus"],
          "monthly_pledge": 1000, "consent": True, "honeypot": ""}


def test_member_form_saves_and_normalises(c, app):
    r = c.post("/api/members", json=MEMBER)
    assert r.status_code == 201 and r.get_json()["ok"]
    with app.app_context():
        s = db.row("SELECT * FROM submissions")
        d = db.loads(s["data"])
    assert s["email"] == "amina@example.com" and s["phone"] == "+254712345678"
    assert d["interests"] == ["mentorship"]


def test_member_form_errors_use_field_names(c):
    r = c.post("/api/members", json={**MEMBER, "email": "nope", "monthly_pledge": 20, "consent": False})
    e = r.get_json()["errors"]
    assert r.status_code == 400 and {"email", "monthly_pledge", "consent"} <= set(e)


def test_honeypot_is_silently_dropped(c, app):
    assert c.post("/api/contact", json={"name": "Bot", "email": "b@x.com", "message": "buy now please",
                                        "honeypot": "x"}).get_json()["ok"]
    with app.app_context():
        assert db.scalar("SELECT COUNT(*) FROM submissions") == 0


def test_volunteer_requires_areas_for_role(c):
    r = c.post("/api/volunteers", json={"full_name": "Ali Omar", "email": "a@x.com", "phone": "0722000000",
                                        "role": "both", "consent": True})
    assert set(r.get_json()["errors"]) >= {"mentor_areas", "volunteer_areas"}


def test_contact_returns_error_text(c):
    r = c.post("/api/contact", json={"name": "Ali Omar", "email": "a@x.com", "message": ""})
    assert r.status_code == 400 and r.get_json()["error"]


def test_placement_ok(c):
    r = c.post("/api/placements", json={"full_name": "Hodan Ali", "email": "h@x.com", "phone": "+254 700 111222",
                                        "aedt_status": "current", "institution": "UoN", "course": "BCom",
                                        "placement_type": "Attachment", "fields": ["Accounting and finance"],
                                        "cv_link": "https://drive.google.com/x", "consent": True})
    assert r.status_code == 201


def test_staff_routes_need_login(c):
    assert c.get("/api/staff/overview").status_code == 401
    assert c.post("/api/staff/login", json={**ADMIN, "password": "wrong"}).status_code == 401


def test_inbox_flow_and_csv(c):
    c.post("/api/members", json=MEMBER)
    h = auth(c)
    items = c.get("/api/staff/submissions?type=member", headers=h).get_json()["items"]
    sid = items[0]["id"]
    assert c.patch(f"/api/staff/submissions/{sid}", json={"status": "bogus"}, headers=h).status_code == 400
    r = c.patch(f"/api/staff/submissions/{sid}", json={"status": "approved", "notes": "Called"}, headers=h)
    assert r.get_json()["item"]["status"] == "approved"
    csv = c.get("/api/staff/submissions/export?type=member", headers=h)
    assert "Amina Hassan" in csv.get_data(as_text=True)


def test_csv_formula_injection_is_neutralised(c):
    c.post("/api/contact", json={"name": "=HYPERLINK(1)", "email": "z@x.com", "message": "hello there friends"})
    out = c.get("/api/staff/submissions/export?type=contact", headers=auth(c)).get_data(as_text=True)
    assert "'=HYPERLINK" in out


def test_contributions_update_public_progress(c):
    h = auth(c)
    r = c.post("/api/staff/contributions", json={"amount": "3,000", "campaign_slug": "feed-a-student",
                                                  "reference": "sk12 abc", "donor_name": "Well-wisher"}, headers=h)
    assert r.status_code == 201 and r.get_json()["item"]["reference"] == "SK12ABC"
    dup = c.post("/api/staff/contributions", json={"amount": 10, "reference": "SK12ABC"}, headers=h)
    assert dup.status_code == 400
    camp = next(x for x in c.get("/api/public/content").get_json()["campaigns"] if x["slug"] == "feed-a-student")
    assert camp["raised"] == 3000 and camp["supporters"] == 1


def test_import_matches_account_number(c):
    h = auth(c)
    csv = "date,amount,reference,name,account\n2026-11-10,6000,QWE1,Ali,937937#meals\n" \
          "2026-11-11,500,QWE1,Dup,937937#meals\n2026-11-12,abc,QWE3,Bad,\n"
    r = c.post("/api/staff/contributions/import", json={"csv": csv}, headers=h).get_json()
    assert r["added"] == 1 and r["skipped"] == 1 and len(r["problems"]) == 1
    camp = next(x for x in c.get("/api/public/content").get_json()["campaigns"] if x["slug"] == "feed-a-student")
    assert camp["raised"] == 6000


def test_content_crud_and_validation(c):
    h = auth(c)
    bad = c.post("/api/staff/content/event", json={"data": {"title": "X", "date": "5 Dec"}}, headers=h)
    assert bad.status_code == 400 and "date" in bad.get_json()["errors"]
    r = c.post("/api/staff/content/event", json={"data": {"title": "Members' meeting", "date": "2099-01-05",
                                                          "link": "javascript:alert(1)"}}, headers=h)
    assert "link" in r.get_json()["errors"]
    r = c.post("/api/staff/content/event", json={"data": {"title": "Members' meeting", "date": "2099-01-05"}},
               headers=h)
    eid = r.get_json()["item"]["id"]
    assert any(e["title"] == "Members' meeting" for e in c.get("/api/public/content").get_json()["events"])
    c.put(f"/api/staff/content/event/{eid}", json={"published": False,
                                                   "data": {"title": "Members' meeting", "date": "2099-01-05"}},
          headers=h)
    assert not any(e["date"] == "2099-01-05" for e in c.get("/api/public/content").get_json()["events"])


def test_only_one_featured_campaign(c):
    h = auth(c)
    items = c.get("/api/staff/content/campaign", headers=h).get_json()["items"]
    target = next(i for i in items if i["slug"] == "formal-launch")
    c.put(f"/api/staff/content/campaign/{target['id']}", json={"data": {**target["data"], "featured": True}},
          headers=h)
    items = c.get("/api/staff/content/campaign", headers=h).get_json()["items"]
    assert [i["slug"] for i in items if i["data"].get("featured")] == ["formal-launch"]


def test_campaign_with_money_cannot_be_deleted(c):
    h = auth(c)
    c.post("/api/staff/contributions", json={"amount": 100, "campaign_slug": "start-her-studies"}, headers=h)
    cid = next(i["id"] for i in c.get("/api/staff/content/campaign", headers=h).get_json()["items"]
               if i["slug"] == "start-her-studies")
    assert c.delete(f"/api/staff/content/campaign/{cid}", headers=h).status_code == 400


def test_upload_image_and_reject_non_images(c):
    h = auth(c)
    buf = io.BytesIO()
    Image.new("RGB", (3000, 1500), "green").save(buf, "JPEG")
    buf.seek(0)
    r = c.post("/api/staff/uploads", data={"file": (buf, "Team Photo.jpg")}, headers=h,
               content_type="multipart/form-data")
    f = r.get_json()["files"][0]
    assert r.status_code == 201 and f["width"] == 2000 and f["url"].startswith("/uploads/team-photo-")
    assert c.get(f["url"]).status_code == 200
    r = c.post("/api/staff/uploads", data={"file": (io.BytesIO(b"<svg onload=x>"), "x.svg")}, headers=h,
               content_type="multipart/form-data")
    assert r.status_code == 400


def test_roles_and_staff_management(c):
    h = auth(c)
    r = c.post("/api/staff/users", json={"email": "ed@example.org", "name": "Editor", "role": "editor"}, headers=h)
    temp = r.get_json()["temp_password"]
    he = auth(c, {"email": "ed@example.org", "password": temp})
    assert c.get("/api/staff/users", headers=he).status_code == 403
    assert c.get("/api/staff/overview", headers=he).status_code == 200
    me = c.get("/api/staff/me", headers=he).get_json()["staff"]
    assert me["must_change_password"] == 1
    r = c.post("/api/staff/me/password", json={"current": temp, "new": "short"}, headers=he)
    assert r.status_code == 400
    r = c.post("/api/staff/me/password", json={"current": temp, "new": "NewPassword123"}, headers=he)
    assert r.status_code == 200
    assert c.get("/api/staff/overview", headers=he).status_code == 401   # old token signed out
    admin_id = c.get("/api/staff/me", headers=h).get_json()["staff"]["id"]
    assert c.patch(f"/api/staff/users/{admin_id}", json={"role": "editor"}, headers=h).status_code == 400


def test_deactivated_staff_lose_access(c):
    h = auth(c)
    c.post("/api/staff/users", json={"email": "x@example.org", "name": "X"}, headers=h)
    temp = c.patch("/api/staff/users/2", json={"reset_password": True}, headers=h).get_json()["temp_password"]
    hx = auth(c, {"email": "x@example.org", "password": temp})
    c.patch("/api/staff/users/2", json={"active": False}, headers=h)
    assert c.get("/api/staff/overview", headers=hx).status_code == 401


def test_cors_only_for_listed_origins(c):
    ok = c.get("/api/public/content", headers={"Origin": "https://site.example"})
    no = c.get("/api/public/content", headers={"Origin": "https://evil.example"})
    assert ok.headers.get("Access-Control-Allow-Origin") == "https://site.example"
    assert "Access-Control-Allow-Origin" not in no.headers


def test_settings_and_audit(c):
    h = auth(c)
    r = c.put("/api/staff/settings", json={"stats": [{"value": "4,600", "suffix": "+", "label": "beneficiaries"}]},
              headers=h)
    assert r.get_json()["stats"][0]["value"] == 4600
    assert c.get("/api/public/content").get_json()["stats"][0]["value"] == 4600
    acts = [a["action"] for a in c.get("/api/staff/audit", headers=h).get_json()["items"]]
    assert "updated homepage figures" in acts


def test_login_rate_limit(app):
    app.config["RATE_LIMIT_IN_TESTS"] = True
    c = app.test_client()
    codes = [c.post("/api/staff/login", json={"email": "z@z.com", "password": "x"}).status_code for _ in range(10)]
    assert codes[-1] == 429


# ---------------- members register ----------------
def _months_ago(n):
    d = date.today().replace(day=1)
    y, m = d.year, d.month - n
    while m <= 0:
        m += 12; y -= 1
    return f"{y}-{m:02d}-05"


def test_application_becomes_member_and_tracks_pledge(c):
    c.post("/api/members", json=MEMBER)
    h = auth(c)
    sid = c.get("/api/staff/submissions?type=member", headers=h).get_json()["items"][0]["id"]
    r = c.post(f"/api/staff/members/from-application/{sid}", headers=h)
    m = r.get_json()["item"]
    assert r.status_code == 201 and m["member_no"] == "AEDT-0001" and m["monthly_pledge"] == 1000
    assert c.post(f"/api/staff/members/from-application/{sid}", headers=h).status_code == 400   # no double entry
    sub = c.get("/api/staff/submissions?type=member", headers=h).get_json()["items"][0]
    assert sub["status"] == "approved"


def test_arrears_and_monthly_payments(c):
    h = auth(c)
    m = c.post("/api/staff/members", json={"full_name": "Ali Hassan", "phone": "0711000111", "monthly_pledge": 1000,
                                            "joined_on": _months_ago(2)}, headers=h).get_json()["item"]
    assert m["months_due"] == 3 and m["expected"] == 3000 and m["balance"] == -3000 and m["months_behind"] == 3
    bad = c.post("/api/staff/contributions", json={"amount": 1000, "kind": "monthly"}, headers=h)
    assert "member_id" in bad.get_json()["errors"]
    c.post("/api/staff/contributions", json={"amount": 2000, "kind": "monthly", "member_id": m["id"],
                                             "campaign_slug": "feed-a-student", "reference": "MON1"}, headers=h)
    c.post("/api/staff/contributions", json={"amount": 500, "kind": "registration", "member_id": m["id"]}, headers=h)
    d = c.get(f"/api/staff/members/{m['id']}", headers=h).get_json()
    it = d["item"]
    assert it["paid"] == 2000 and it["balance"] == -1000 and it["months_behind"] == 1 and it["registration_paid"]
    assert len(d["payments"]) == 2
    # member payments never count towards a campaign target
    camp = next(x for x in c.get("/api/public/content").get_json()["campaigns"] if x["slug"] == "feed-a-student")
    assert camp["raised"] == 0
    lst = c.get("/api/staff/members?behind=1", headers=h).get_json()
    assert lst["total"] == 1 and lst["summary"]["committed_monthly"] == 1000 and lst["summary"]["collected_this_month"] == 2000


def test_member_duplicates_and_change_log(c):
    h = auth(c)
    m = c.post("/api/staff/members", json={"full_name": "Hodan Ali", "email": "hodan@x.com", "monthly_pledge": 500},
               headers=h).get_json()["item"]
    dup = c.post("/api/staff/members", json={"full_name": "Hodan A.", "email": "HODAN@x.com"}, headers=h)
    assert dup.status_code == 400 and "email" in dup.get_json()["errors"]
    c.put(f"/api/staff/members/{m['id']}", json={"monthly_pledge": 1500}, headers=h)
    log = c.get("/api/staff/audit", headers=h).get_json()["items"]
    assert any("monthly_pledge: 500 -> 1500" in a["detail"] for a in log)


def test_member_import_and_payment_import_by_member(c):
    h = auth(c)
    r = c.post("/api/staff/members/import", json={"csv": "Name,Phone,Monthly pledge,Joined on,Member no\n"
               "Amina Yusuf,0722 111 222,1000,2026-01-10,AEDT-0100\nAmina Again,0722111222,500,,\nX,,,,\n"},
               headers=h).get_json()
    assert r["added"] == 1 and r["skipped"] == 1 and len(r["problems"]) == 1
    r = c.post("/api/staff/contributions/import", json={"csv": "date,amount,reference,type,member\n"
               "2026-02-03,1000,FEB1,monthly,AEDT-0100\n2026-03-03,1000,MAR1,monthly,+254722111222\n"
               "2026-03-04,1000,MAR2,monthly,nobody\n"}, headers=h).get_json()
    assert r["added"] == 2 and len(r["problems"]) == 1


def _csv(resp):
    text = resp.get_data(as_text=True).lstrip("\ufeff")
    return list(csv.reader(io.StringIO(text)))


def test_exports(c):
    h = auth(c)
    c.post("/api/volunteers", json={"full_name": "Mentor One", "email": "m1@x.com", "phone": "0700000001", "role": "mentor",
                                    "mentor_areas": ["Career guidance"], "consent": True})
    c.post("/api/volunteers", json={"full_name": "Helper Two", "email": "v2@x.com", "phone": "0700000002", "role": "both",
                                    "mentor_areas": ["Career guidance"], "volunteer_areas": ["Fundraising"], "consent": True})
    m = c.post("/api/staff/members", json={"full_name": "Ali Hassan", "monthly_pledge": 1000,
                                            "joined_on": f"{date.today().year}-01-01"}, headers=h).get_json()["item"]
    c.post("/api/staff/contributions", json={"amount": 1000, "kind": "monthly", "member_id": m["id"],
                                             "received_on": f"{date.today().year}-01-15"}, headers=h)
    mentors = _csv(c.get("/api/staff/export/mentors", headers=h))
    vols = _csv(c.get("/api/staff/export/volunteers", headers=h))
    assert len(mentors) == 3 and len(vols) == 2 and "Career guidance" in mentors[1]
    reg = _csv(c.get("/api/staff/export/members", headers=h))
    assert reg[0][9] == "Monthly pledge (KES)" and reg[1][1] == "Ali Hassan" and reg[1][12] == "1000"
    mon = _csv(c.get(f"/api/staff/export/monthly?year={date.today().year}", headers=h))
    assert mon[1][6] == "1000"                     # paid in January
    cat = c.get("/api/staff/export/", headers=h).get_json()["items"]
    assert {i["key"] for i in cat} >= {"members", "monthly", "mentors", "volunteers", "internships", "changelog"}
    z = zipfile.ZipFile(io.BytesIO(c.get("/api/staff/export/all", headers=h).data))
    assert "aedt-members.csv" in z.namelist() and "aedt-changelog.csv" in z.namelist()


def test_editors_cannot_download_change_log(c):
    h = auth(c)
    temp = c.post("/api/staff/users", json={"email": "ed2@example.org", "name": "Ed"}, headers=h).get_json()["temp_password"]
    he = auth(c, {"email": "ed2@example.org", "password": temp})
    assert c.get("/api/staff/export/changelog", headers=he).status_code == 403
    z = zipfile.ZipFile(io.BytesIO(c.get("/api/staff/export/all", headers=he).data))
    assert "aedt-changelog.csv" not in z.namelist()


def test_uploads_survive_a_wiped_disk(app, tmp_path):
    app.config["UPLOADS_IN_DB"] = True
    c = app.test_client(); h = auth(c)
    buf = io.BytesIO(); Image.new("RGB", (800, 600), "red").save(buf, "JPEG"); buf.seek(0)
    url = c.post("/api/staff/uploads", data={"file": (buf, "event.jpg")}, headers=h,
                 content_type="multipart/form-data").get_json()["files"][0]["url"]
    os.remove(os.path.join(app.config["UPLOAD_DIR"], url.split("/")[-1]))     # simulate a redeploy
    r = c.get(url)
    assert r.status_code == 200 and r.data[:2] == b"\xff\xd8"
