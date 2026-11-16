"""TEST-ONLY stand-in for psycopg 3, built on the system libpq with ctypes.

The real app uses `psycopg` from PyPI. This shim implements only the small part of its API that
aedt/db.py uses, so the test-suite can run against a real PostgreSQL server without internet access.
"""
import ctypes
import re
from decimal import Decimal

_lib = ctypes.CDLL("libpq.so.5")
_lib.PQconnectdb.restype = ctypes.c_void_p; _lib.PQconnectdb.argtypes = [ctypes.c_char_p]
_lib.PQstatus.argtypes = [ctypes.c_void_p]
_lib.PQerrorMessage.restype = ctypes.c_char_p; _lib.PQerrorMessage.argtypes = [ctypes.c_void_p]
_lib.PQfinish.argtypes = [ctypes.c_void_p]
_lib.PQexecParams.restype = ctypes.c_void_p
_lib.PQexecParams.argtypes = [ctypes.c_void_p, ctypes.c_char_p, ctypes.c_int, ctypes.c_void_p,
                              ctypes.POINTER(ctypes.c_char_p), ctypes.c_void_p, ctypes.c_void_p, ctypes.c_int]
for fn, res in (("PQresultStatus", ctypes.c_int), ("PQntuples", ctypes.c_int), ("PQnfields", ctypes.c_int)):
    getattr(_lib, fn).restype = res; getattr(_lib, fn).argtypes = [ctypes.c_void_p]
_lib.PQresultErrorMessage.restype = ctypes.c_char_p; _lib.PQresultErrorMessage.argtypes = [ctypes.c_void_p]
_lib.PQfname.restype = ctypes.c_char_p; _lib.PQfname.argtypes = [ctypes.c_void_p, ctypes.c_int]
_lib.PQftype.restype = ctypes.c_uint; _lib.PQftype.argtypes = [ctypes.c_void_p, ctypes.c_int]
_lib.PQgetvalue.restype = ctypes.c_char_p; _lib.PQgetvalue.argtypes = [ctypes.c_void_p, ctypes.c_int, ctypes.c_int]
_lib.PQgetisnull.argtypes = [ctypes.c_void_p, ctypes.c_int, ctypes.c_int]
_lib.PQcmdTuples.restype = ctypes.c_char_p; _lib.PQcmdTuples.argtypes = [ctypes.c_void_p]
_lib.PQclear.argtypes = [ctypes.c_void_p]

PGRES_COMMAND_OK, PGRES_TUPLES_OK = 1, 2
_INT = {20, 21, 23}
_DEC = {1700}


class Error(Exception):
    pass


def _convert(sql):
    n = 0
    def rep(m):
        nonlocal n
        n += 1
        return f"${n}"
    return re.sub(r"%s", rep, sql.replace("%%", "\x00")).replace("\x00", "%")


def _txt(v):
    if v is None:
        return None
    if isinstance(v, bool):
        return b"t" if v else b"f"
    return str(v).encode()


class Cursor:
    def __init__(self, rows, rowcount):
        self._rows, self.rowcount = rows, rowcount
    def fetchall(self):
        r, self._rows = self._rows, []
        return r
    def fetchone(self):
        return self._rows.pop(0) if self._rows else None


class Connection:
    def __init__(self, conninfo):
        self._c = _lib.PQconnectdb(conninfo.encode())
        if _lib.PQstatus(self._c) != 0:
            raise Error(_lib.PQerrorMessage(self._c).decode())
        self._in_tx = False

    def _run(self, sql, params=()):
        vals = [_txt(p) for p in params]
        arr = (ctypes.c_char_p * max(1, len(vals)))(*vals) if vals else None
        res = _lib.PQexecParams(self._c, sql.encode(), len(vals), None, arr, None, None, 0)
        try:
            st = _lib.PQresultStatus(res)
            if st not in (PGRES_COMMAND_OK, PGRES_TUPLES_OK):
                raise Error((_lib.PQresultErrorMessage(res) or b"error").decode())
            rows = []
            if st == PGRES_TUPLES_OK:
                nf = _lib.PQnfields(res)
                names = [_lib.PQfname(res, i).decode() for i in range(nf)]
                types = [_lib.PQftype(res, i) for i in range(nf)]
                for r in range(_lib.PQntuples(res)):
                    row = {}
                    for i in range(nf):
                        if _lib.PQgetisnull(res, r, i):
                            v = None
                        else:
                            s = _lib.PQgetvalue(res, r, i).decode()
                            v = int(s) if types[i] in _INT else Decimal(s) if types[i] in _DEC else \
                                (s == "t") if types[i] == 16 else s
                        row[names[i]] = v
                    rows.append(row)
            ct = _lib.PQcmdTuples(res)
            return Cursor(rows, int(ct) if ct else -1)
        finally:
            _lib.PQclear(res)

    def execute(self, sql, params=()):
        if not self._in_tx:
            self._run("BEGIN"); self._in_tx = True
        return self._run(_convert(sql), params)

    def commit(self):
        if self._in_tx:
            self._run("COMMIT"); self._in_tx = False

    def rollback(self):
        if self._in_tx:
            self._run("ROLLBACK"); self._in_tx = False

    def close(self):
        if self._c:
            try:
                self.rollback()
            except Error:
                pass
            _lib.PQfinish(self._c); self._c = None


def connect(conninfo, row_factory=None, **kwargs):
    return Connection(conninfo)
