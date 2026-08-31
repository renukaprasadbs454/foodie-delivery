"""
Iteration 8 — Session Management + Restaurant Logo backend tests.

Covers:
 * POST /api/restaurant/logo (auth/role/content-type/size + happy path)
 * DELETE /api/restaurant/logo
 * GET /api/logo/{restaurant_id}
 * logo_url in /api/auth/me, /api/restaurant, /api/staff/lookup
 * GET/DELETE /api/sessions and POST /api/sessions/revoke-others
"""
import io
import os
import struct
import time
import uuid
import zlib
import pytest
import requests
from datetime import datetime, timezone, timedelta
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://partner-panel-2.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")

_mongo = MongoClient(MONGO_URL)
_db = _mongo[DB_NAME]


# ─── helpers ──────────────────────────────────────────────────────────────
def _png_bytes(size_bytes: int = 0) -> bytes:
    """Build a real 10x10 PNG. If size_bytes > actual, pad with an extra IDAT-like tail
    (still a valid image bytes though not strictly a valid PNG once padded)."""
    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = chunk(b"IHDR", struct.pack(">IIBBBBB", 10, 10, 8, 2, 0, 0, 0))
    raw = b"".join(b"\x00" + b"\x00\x99\x66" * 10 for _ in range(10))
    idat = chunk(b"IDAT", zlib.compress(raw))
    iend = chunk(b"IEND", b"")
    png = sig + ihdr + idat + iend
    if size_bytes and size_bytes > len(png):
        png = png + b"\x00" * (size_bytes - len(png))
    return png


def _seed_owner():
    uid = f"test-owner-{uuid.uuid4().hex[:8]}"
    token = f"test_sess_{uuid.uuid4().hex}"
    email = f"TEST_{uid}@example.com"
    now = datetime.now(timezone.utc)
    _db.users.insert_one({
        "user_id": uid, "email": email, "name": "Test Owner",
        "picture": None, "created_at": now.isoformat(),
    })
    rest_id = f"rest_{uuid.uuid4().hex[:10]}"
    code = f"GF-{uuid.uuid4().hex[:4].upper()}"
    _db.restaurants.insert_one({
        "restaurant_id": rest_id, "owner_user_id": uid,
        "name": "TEST Cafe", "city": "TestVille",
        "code": code, "created_at": now.isoformat(),
    })
    _db.user_sessions.insert_one({
        "id": f"sess_{uuid.uuid4().hex[:12]}",
        "user_id": uid, "session_token": token, "role": "owner",
        "restaurant_id": rest_id,
        "expires_at": (now + timedelta(days=1)).isoformat(),
        "created_at": now.isoformat(), "last_seen": now.isoformat(),
        "user_agent": "pytest/owner", "ip": "127.0.0.1",
    })
    return {"user_id": uid, "session_token": token, "restaurant_id": rest_id, "code": code, "email": email}


def _cleanup(owner):
    uid = owner["user_id"]; rid = owner["restaurant_id"]
    _db.user_sessions.delete_many({"$or": [{"user_id": uid}, {"restaurant_id": rid}]})
    _db.team_members.delete_many({"restaurant_id": rid})
    _db.restaurants.delete_many({"restaurant_id": rid})
    _db.users.delete_many({"user_id": uid})
    _db.activity_events.delete_many({"restaurant_id": rid})


def _cookies(token): return {"session_token": token}


def _add_member(owner, role="employee", name="Test Emp"):
    r = requests.post(f"{API}/team",
                      json={"name": name, "role": role},
                      cookies=_cookies(owner["session_token"]), timeout=15)
    assert r.status_code == 200, r.text
    j = r.json()
    return j["member"]["member_id"], j["pin"]


def _staff_login(code, member_id, pin):
    s = requests.Session()
    r = s.post(f"{API}/staff/login",
               json={"code": code, "member_id": member_id, "pin": pin}, timeout=15)
    assert r.status_code == 200, r.text
    return s.cookies.get("session_token")


# ─── fixtures ─────────────────────────────────────────────────────────────
@pytest.fixture
def owner():
    o = _seed_owner()
    yield o
    _cleanup(o)


# ─── Logo tests ───────────────────────────────────────────────────────────
class TestLogoUpload:
    def test_upload_no_auth_returns_401(self):
        r = requests.post(f"{API}/restaurant/logo",
                          files={"file": ("logo.png", _png_bytes(), "image/png")}, timeout=15)
        assert r.status_code == 401

    def test_upload_as_staff_returns_403(self, owner):
        mid, pin = _add_member(owner)
        staff_token = _staff_login(owner["code"], mid, pin)
        r = requests.post(f"{API}/restaurant/logo",
                          files={"file": ("logo.png", _png_bytes(), "image/png")},
                          cookies=_cookies(staff_token), timeout=15)
        assert r.status_code == 403

    def test_upload_wrong_content_type_returns_415(self, owner):
        r = requests.post(f"{API}/restaurant/logo",
                          files={"file": ("logo.txt", b"hi there", "text/plain")},
                          cookies=_cookies(owner["session_token"]), timeout=15)
        assert r.status_code == 415

    def test_upload_oversize_returns_413(self, owner):
        big = _png_bytes(3 * 1024 * 1024 + 128)  # ~3MB
        r = requests.post(f"{API}/restaurant/logo",
                          files={"file": ("big.png", big, "image/png")},
                          cookies=_cookies(owner["session_token"]), timeout=60)
        assert r.status_code == 413

    def test_upload_happy_path_and_serve(self, owner):
        png = _png_bytes()
        r = requests.post(f"{API}/restaurant/logo",
                          files={"file": ("logo.png", png, "image/png")},
                          cookies=_cookies(owner["session_token"]), timeout=60)
        if r.status_code == 503:
            pytest.skip(f"Object storage unavailable: {r.text}")
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["ok"] is True
        assert j["logo_url"].startswith(f"/api/logo/{owner['restaurant_id']}?v=")

        # /api/restaurant carries logo_url
        rr = requests.get(f"{API}/restaurant", cookies=_cookies(owner["session_token"]), timeout=15)
        assert rr.status_code == 200
        assert rr.json().get("logo_url", "").startswith(f"/api/logo/{owner['restaurant_id']}")

        # /api/auth/me carries logo_url
        me = requests.get(f"{API}/auth/me", cookies=_cookies(owner["session_token"]), timeout=15)
        assert me.status_code == 200
        assert me.json().get("logo_url", "").startswith(f"/api/logo/{owner['restaurant_id']}")

        # Public serve returns bytes with matching content-type
        served = requests.get(f"{API}/logo/{owner['restaurant_id']}", timeout=30)
        assert served.status_code == 200
        assert served.headers.get("content-type", "").startswith("image/png")
        assert served.content == png

        # /api/staff/lookup includes logo_url
        sl = requests.post(f"{API}/staff/lookup", json={"code": owner["code"]}, timeout=15)
        assert sl.status_code == 200
        assert sl.json().get("logo_url", "").startswith(f"/api/logo/{owner['restaurant_id']}")

    def test_delete_logo_clears_state(self, owner):
        # upload first
        png = _png_bytes()
        up = requests.post(f"{API}/restaurant/logo",
                           files={"file": ("logo.png", png, "image/png")},
                           cookies=_cookies(owner["session_token"]), timeout=60)
        if up.status_code == 503:
            pytest.skip("storage unavailable")
        assert up.status_code == 200

        d = requests.delete(f"{API}/restaurant/logo",
                            cookies=_cookies(owner["session_token"]), timeout=15)
        assert d.status_code == 200
        assert d.json().get("ok") is True

        served = requests.get(f"{API}/logo/{owner['restaurant_id']}", timeout=15)
        assert served.status_code == 404

        me = requests.get(f"{API}/auth/me", cookies=_cookies(owner["session_token"]), timeout=15)
        assert me.status_code == 200
        assert me.json().get("logo_url") is None


# ─── Sessions tests ───────────────────────────────────────────────────────
class TestSessions:
    def test_list_sessions_owner_current_flag(self, owner):
        r = requests.get(f"{API}/sessions", cookies=_cookies(owner["session_token"]), timeout=15)
        assert r.status_code == 200
        sessions = r.json()["sessions"]
        assert len(sessions) >= 1
        mine = [s for s in sessions if s["is_current"]]
        assert len(mine) == 1
        s = mine[0]
        for k in ("id", "role", "actor_name", "device", "created_at", "last_seen"):
            assert k in s

    def test_list_sessions_forbidden_for_staff(self, owner):
        mid, pin = _add_member(owner)
        staff_token = _staff_login(owner["code"], mid, pin)
        r = requests.get(f"{API}/sessions", cookies=_cookies(staff_token), timeout=15)
        assert r.status_code == 403

    def test_list_shows_new_staff_session(self, owner):
        mid, pin = _add_member(owner)
        _staff_login(owner["code"], mid, pin)
        r = requests.get(f"{API}/sessions", cookies=_cookies(owner["session_token"]), timeout=15)
        assert r.status_code == 200
        sessions = r.json()["sessions"]
        staff = [s for s in sessions if s["role"] in ("employee", "kitchen") and not s["is_current"]]
        assert len(staff) >= 1

    def test_revoke_staff_session(self, owner):
        mid, pin = _add_member(owner)
        staff_token = _staff_login(owner["code"], mid, pin)
        # find staff session id
        r = requests.get(f"{API}/sessions", cookies=_cookies(owner["session_token"]), timeout=15)
        staff_sess = next(s for s in r.json()["sessions"] if s["role"] == "employee" and not s["is_current"])
        d = requests.delete(f"{API}/sessions/{staff_sess['id']}",
                            cookies=_cookies(owner["session_token"]), timeout=15)
        assert d.status_code == 200
        # staff cookie now invalid
        me = requests.get(f"{API}/auth/me", cookies=_cookies(staff_token), timeout=15)
        assert me.status_code == 401

    def test_revoke_own_session_returns_400(self, owner):
        r = requests.get(f"{API}/sessions", cookies=_cookies(owner["session_token"]), timeout=15)
        my_id = next(s["id"] for s in r.json()["sessions"] if s["is_current"])
        d = requests.delete(f"{API}/sessions/{my_id}",
                            cookies=_cookies(owner["session_token"]), timeout=15)
        assert d.status_code == 400

    def test_revoke_others(self, owner):
        mid, pin = _add_member(owner)
        _staff_login(owner["code"], mid, pin)
        mid2, pin2 = _add_member(owner, role="kitchen", name="Test Kitchen")
        _staff_login(owner["code"], mid2, pin2)
        r = requests.post(f"{API}/sessions/revoke-others",
                         cookies=_cookies(owner["session_token"]), timeout=15)
        assert r.status_code == 200
        assert r.json().get("revoked", 0) >= 2
        # owner session still works
        me = requests.get(f"{API}/auth/me", cookies=_cookies(owner["session_token"]), timeout=15)
        assert me.status_code == 200
