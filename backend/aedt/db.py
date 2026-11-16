"""Small database layer that works with SQLite (default) and PostgreSQL.

Set DATABASE_URL to a postgres:// URL in production to use PostgreSQL (needs `psycopg`).
Leave it empty to use a SQLite file (fine for a single server with a persistent disk).
All JSON fields are stored as TEXT so the same SQL runs on both.
"""
import json
import sqlite3
from datetime import datetime, timezone

from flask import current_app, g


def now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


SCHEMA = """
CREATE TABLE IF NOT EXISTS staff (
  id {pk}, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor', active INTEGER NOT NULL DEFAULT 1,
  token_version INTEGER NOT NULL DEFAULT 1, must_change_password INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL, last_login_at TEXT
);
CREATE TABLE IF NOT EXISTS submissions (
  id {pk}, type TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new', name TEXT, email TEXT, phone TEXT,
  data TEXT NOT NULL, notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  updated_by TEXT
);
CREATE INDEX IF NOT EXISTS ix_sub_type ON submissions (type, status);
CREATE TABLE IF NOT EXISTS content (
  id {pk}, kind TEXT NOT NULL, slug TEXT NOT NULL, title TEXT NOT NULL DEFAULT '',
  sort INTEGER NOT NULL DEFAULT 0, published INTEGER NOT NULL DEFAULT 1, data TEXT NOT NULL,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL, updated_by TEXT,
  UNIQUE (kind, slug)
);
CREATE TABLE IF NOT EXISTS contributions (
  id {pk}, campaign_slug TEXT, amount INTEGER NOT NULL, donor_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '', reference TEXT UNIQUE, channel TEXT NOT NULL DEFAULT 'mpesa',
  account_ref TEXT NOT NULL DEFAULT '', received_on TEXT NOT NULL, note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'confirmed', source TEXT NOT NULL DEFAULT 'manual',
  created_at TEXT NOT NULL, created_by TEXT, kind TEXT NOT NULL DEFAULT 'donation', member_id INTEGER
);
CREATE INDEX IF NOT EXISTS ix_contrib_campaign ON contributions (campaign_slug, status);
CREATE TABLE IF NOT EXISTS members (
  id {pk}, member_no TEXT UNIQUE, full_name TEXT NOT NULL, email TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '',
  county TEXT NOT NULL DEFAULT '', institution TEXT NOT NULL DEFAULT '', aedt_status TEXT NOT NULL DEFAULT '',
  monthly_pledge INTEGER NOT NULL DEFAULT 0, joined_on TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active',
  application_id INTEGER, notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  updated_by TEXT
);
CREATE INDEX IF NOT EXISTS ix_members_status ON members (status);
CREATE TABLE IF NOT EXISTS uploads (
  id {pk}, filename TEXT NOT NULL UNIQUE, original TEXT NOT NULL DEFAULT '', width INTEGER, height INTEGER,
  size INTEGER, created_at TEXT NOT NULL, created_by TEXT
);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS audit (
  id {pk}, staff_email TEXT, action TEXT NOT NULL, target TEXT NOT NULL DEFAULT '',
  detail TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL
);
"""


class Database:
    def __init__(self, url, sqlite_path):
        self.pg = bool(url) and url.startswith(("postgres://", "postgresql://"))
        self.url = url.replace("postgres://", "postgresql://", 1) if self.pg else url
        self.sqlite_path = sqlite_path

    # -- connections -------------------------------------------------------
    def connect(self):
        if self.pg:
            import psycopg  # installed via requirements.txt when using PostgreSQL
            from psycopg.rows import dict_row
            # prepare_threshold=None keeps it working with Neon's pooled (-pooler) connection strings
            return psycopg.connect(self.url, row_factory=dict_row, prepare_threshold=None, connect_timeout=15)
        con = sqlite3.connect(self.sqlite_path, timeout=15)
        con.row_factory = sqlite3.Row
        con.execute("PRAGMA foreign_keys = ON")
        con.execute("PRAGMA journal_mode = WAL")
        return con

    def init_schema(self):
        pk = "BIGSERIAL PRIMARY KEY" if self.pg else "INTEGER PRIMARY KEY AUTOINCREMENT"
        con = self.connect()
        try:
            for stmt in SCHEMA.format(pk=pk).split(";"):
                if stmt.strip():
                    con.execute(stmt)
            con.commit()
            self._migrate(con)
        finally:
            con.close()

    # columns added after the first release; existing databases get them automatically
    MIGRATIONS = [("contributions", "kind", "TEXT NOT NULL DEFAULT 'donation'"),
                  ("contributions", "member_id", "INTEGER"),
                  ("uploads", "data", "TEXT")]          # base64 copy of the image when UPLOADS_IN_DB is on

    def _columns(self, con, table):
        if self.pg:
            cur = con.execute("SELECT column_name FROM information_schema.columns WHERE table_name = %s", (table,))
            return {r["column_name"] for r in cur.fetchall()}
        return {r[1] for r in con.execute(f"PRAGMA table_info({table})").fetchall()}

    def _migrate(self, con):
        for table, col, ddl in self.MIGRATIONS:
            if col not in self._columns(con, table):
                con.execute(f"ALTER TABLE {table} ADD COLUMN {col} {ddl}")
        con.execute("CREATE INDEX IF NOT EXISTS ix_contrib_member ON contributions (member_id, kind)")
        con.commit()

    def _sql(self, sql):
        return sql.replace("?", "%s") if self.pg else sql


def get_db():
    if "dbcon" not in g:
        g.dbcon = current_app.extensions["aedt_db"].connect()
    return g.dbcon


def close_db(_exc=None):
    con = g.pop("dbcon", None)
    if con is not None:
        con.close()


def _dbobj():
    return current_app.extensions["aedt_db"]


def rows(sql, params=()):
    cur = get_db().execute(_dbobj()._sql(sql), params)
    return [dict(r) for r in cur.fetchall()]


def row(sql, params=()):
    r = rows(sql, params)
    return r[0] if r else None


def scalar(sql, params=()):
    r = row(sql, params)
    return list(r.values())[0] if r else None


def execute(sql, params=(), commit=True):
    con = get_db()
    cur = con.execute(_dbobj()._sql(sql), params)
    if commit:
        con.commit()
    return cur


def insert(table, data, commit=True):
    cols = ", ".join(data)
    marks = ", ".join("?" for _ in data)
    sql = f"INSERT INTO {table} ({cols}) VALUES ({marks})"
    db = _dbobj()
    con = get_db()
    if db.pg:
        cur = con.execute(db._sql(sql + " RETURNING id"), tuple(data.values()))
        new_id = cur.fetchone()["id"]
    else:
        cur = con.execute(sql, tuple(data.values()))
        new_id = cur.lastrowid
    if commit:
        con.commit()
    return new_id


def update(table, id_, data, commit=True):
    sets = ", ".join(f"{k} = ?" for k in data)
    execute(f"UPDATE {table} SET {sets} WHERE id = ?", (*data.values(), id_), commit=commit)


def commit():
    get_db().commit()


def rollback():
    get_db().rollback()


def is_unique_error(exc):
    return "unique" in str(exc).lower() or "duplicate" in str(exc).lower()


def dumps(obj):
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"))


def loads(text, default=None):
    try:
        return json.loads(text) if text else default
    except (TypeError, ValueError):
        return default


# -- settings --------------------------------------------------------------
def get_setting(key, default=None):
    r = row("SELECT value FROM settings WHERE key = ?", (key,))
    return loads(r["value"], default) if r else default


def set_setting(key, value):
    db = _dbobj()
    if db.pg:
        execute("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
                (key, dumps(value)))
    else:
        execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (key, dumps(value)))


def audit(staff_email, action, target="", detail=""):
    insert("audit", {"staff_email": staff_email, "action": action, "target": str(target)[:200],
                     "detail": str(detail)[:1000], "created_at": now()})
