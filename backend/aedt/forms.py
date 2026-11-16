"""Checks for the four public forms. Choices must match the lists in the React pages."""
import re

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$")

AEDT_STATUS = {"current", "graduate", "former", "other"}
EMPLOYMENT = {"Student", "Employed", "Self-employed", "Seeking work"}
INTERESTS = {"mentorship", "training", "volunteering", "fundraising"}
ROLES = {"mentor", "volunteer", "both"}
IS_MEMBER = {"yes", "applying", "no"}
MENTOR_AREAS = {"Career guidance", "Study skills and exams", "Leadership and personal growth",
                "Business and entrepreneurship", "Digital skills and technology",
                "University and scholarship applications"}
VOLUNTEER_AREAS = {"Tree planting and clean-ups", "Children's home visits", "Mosque and community clean-ups",
                   "Fundraising", "Event organising", "Photography and social media"}
AVAILABILITY = {"A few hours a month", "Weekends", "Weekday evenings", "Flexible"}
PLACEMENT_TYPES = {"Internship", "Attachment", "Graduate job", "Either"}
YEARS = {"First year", "Second year", "Third year", "Fourth year", "Fifth year or above", "Graduated"}
DURATIONS = {"Up to 1 month", "2 to 3 months", "4 to 6 months", "More than 6 months"}
FIELDS = {"Accounting and finance", "Business and management", "Education and teaching", "Engineering",
          "Health and nursing", "ICT and computer science", "Law", "Media and communications",
          "Procurement and supply chain", "Social work and community development", "Agriculture and environment",
          "Other"}

# which submission statuses staff can pick, per form
STATUSES = {
    "member": ["new", "contacted", "approved", "paid", "rejected"],
    "volunteer": ["new", "contacted", "active", "inactive"],
    "contact": ["new", "replied", "closed"],
    "placement": ["new", "reviewing", "referred", "placed", "closed"],
}
LABELS = {"member": "Membership application", "volunteer": "Mentor / volunteer sign-up",
          "contact": "Contact message", "placement": "Internship / attachment application"}


def normalise_phone(v):
    """Return (phone in +254... form, error or None)."""
    v = " ".join(str(v or "").split())
    if not v:
        return "", None
    digits = re.sub(r"\D", "", v)
    if not (9 <= len(digits) <= 15 and re.fullmatch(r"[+\d\s()-]+", v)):
        return v, "Enter a valid phone number, e.g. 0712 345 678."
    if digits.startswith("0") and len(digits) == 10:
        digits = "254" + digits[1:]
    elif len(digits) == 9 and digits[0] in "17":
        digits = "254" + digits
    return "+" + digits, None


class Form:
    def __init__(self, raw):
        self.raw = raw if isinstance(raw, dict) else {}
        self.errors, self.data = {}, {}

    def text(self, key, required=False, max_len=200, label="This"):
        v = " ".join(str(self.raw.get(key) or "").split()) if max_len <= 300 else str(self.raw.get(key) or "").strip()
        if required and not v:
            self.errors[key] = f"{label} is required."
        elif len(v) > max_len:
            self.errors[key] = f"Keep this under {max_len} characters."
        self.data[key] = v
        return v

    def name(self, key="full_name"):
        v = self.text(key, True, 120, "Your name")
        if v and len(v) < 3:
            self.errors[key] = "Enter your full name."

    def email(self, key="email"):
        v = self.text(key, True, 160, "Email").lower()
        self.data[key] = v
        if v and not EMAIL_RE.match(v):
            self.errors[key] = "Enter a valid email address."

    def phone(self, key="phone"):
        v = self.text(key, True, 30, "Phone")
        if v:
            self.data[key], err = normalise_phone(v)
            if err:
                self.errors[key] = err

    def choice(self, key, options, required=False, label="Please choose an option"):
        v = str(self.raw.get(key) or "").strip()
        if not v:
            if required:
                self.errors[key] = f"{label}."
        elif v not in options:
            self.errors[key] = "Choose one of the options."
        self.data[key] = v

    def many(self, key, options, required=False, label="Choose at least one"):
        v = self.raw.get(key) or []
        v = [str(x) for x in v] if isinstance(v, list) else []
        v = [x for x in dict.fromkeys(v) if x in options]
        if required and not v:
            self.errors[key] = f"{label}."
        self.data[key] = v

    def consent(self):
        if self.raw.get("consent") is not True:
            self.errors["consent"] = "Please tick the box to agree."
        self.data["consent"] = self.raw.get("consent") is True

    @property
    def spam(self):
        return bool(str(self.raw.get("honeypot") or "").strip())


def check_member(raw):
    f = Form(raw)
    f.name(); f.email(); f.phone()
    f.text("county", max_len=80); f.text("institution", max_len=150); f.text("course", max_len=150)
    f.text("graduation_year", max_len=10); f.text("industry", max_len=120)
    f.choice("aedt_status", AEDT_STATUS, True, "Tell us your AEDT status")
    f.choice("employment_status", EMPLOYMENT)
    f.many("interests", INTERESTS)
    try:
        pledge = int(raw.get("monthly_pledge") or 0)
    except (TypeError, ValueError):
        pledge = 0
    if pledge < 100:
        f.errors["monthly_pledge"] = "Choose a monthly contribution of at least KES 100."
    elif pledge > 1_000_000:
        f.errors["monthly_pledge"] = "Enter a smaller amount."
    f.data["monthly_pledge"] = pledge
    f.consent()
    return f


def check_volunteer(raw):
    f = Form(raw)
    f.name(); f.email(); f.phone()
    f.choice("role", ROLES, True, "Choose mentor, volunteer or both")
    f.choice("is_member", IS_MEMBER)
    for k, n in (("location", 100), ("profession", 120), ("organisation", 120)):
        f.text(k, max_len=n)
    f.many("mentor_areas", MENTOR_AREAS, f.data["role"] in ("mentor", "both"), "Choose at least one mentoring area")
    f.many("volunteer_areas", VOLUNTEER_AREAS, f.data["role"] in ("volunteer", "both"),
           "Choose at least one volunteering area")
    f.choice("availability", AVAILABILITY)
    f.text("experience", max_len=1500)
    f.consent()
    return f


def check_contact(raw):
    f = Form(raw)
    f.name("name"); f.email()
    f.text("subject", max_len=150)
    msg = f.text("message", True, 4000, "A message")
    if msg and len(msg) < 10:
        f.errors["message"] = "Please write a little more so we can help."
    return f


def check_placement(raw):
    f = Form(raw)
    f.name(); f.email(); f.phone()
    f.choice("aedt_status", AEDT_STATUS, True, "Tell us your AEDT status")
    f.text("institution", True, 150, "Your institution")
    f.text("course", True, 150, "Your course")
    f.choice("year_of_study", YEARS)
    f.choice("placement_type", PLACEMENT_TYPES, True, "Choose the type of placement")
    f.many("fields", FIELDS, True, "Choose at least one field")
    f.text("location", max_len=100); f.text("start_month", max_len=20)
    f.choice("duration", DURATIONS)
    cv = f.text("cv_link", max_len=500)
    if cv and not re.match(r"^https://\S+$", cv):
        f.errors["cv_link"] = "Use a link that starts with https:// (Google Drive, Dropbox or OneDrive)."
    f.text("message", max_len=2000)
    f.text("opportunity", max_len=100)
    f.consent()
    return f


CHECKS = {"member": check_member, "volunteer": check_volunteer, "contact": check_contact,
          "placement": check_placement}
