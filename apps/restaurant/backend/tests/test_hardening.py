"""Backend hardening tests: per-staff PIN hashes, rotate-pin, activity RBAC, owner allowlist."""
import os
import json
import uuid
import time
import subprocess
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://partner-panel-2.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


def mongo_eval(script: str) -> str:
    full = f"use('test_database');\n{script}"
    res = subprocess.run(["mongosh", "--quiet", "--eval", full], capture_output=True, text=True, timeout=25)
    return (res.stdout or "") + (res.stderr or "")


def mongo_json(script: str):
    """Run mongosh and parse a printjson result. Only reliable line is what you printjson()."""
    out = mongo_eval(script)
    # Find the first '{' line and parse
    for line in out.splitlines():
        line = line.strip()
        if line.startswith("{") or line.startswith("["):
            try:
                return json.loads(line)
            except Exception:
                pass
    return None


def seed_owner(email=None):
    """Seed a fresh owner user + session."""
    uid = f"test-owner-{uuid.uuid4().hex[:10]}"
    tok = f"test_sess_{uuid.uuid4().hex}"
    em = email or f"{uid}@test.com"
    script = f"""
    db.users.insertOne({{user_id:'{uid}', email:'{em}', name:'Test Owner', picture:null, created_at:new Date().toISOString()}});
    db.user_sessions.insertOne({{user_id:'{uid}', session_token:'{tok}', role:'owner', restaurant_id:null, expires_at:new Date(Date.now()+7*24*60*60*1000).toISOString(), created_at:new Date().toISOString()}});
    print('OK');
    """
    out = mongo_eval(script)
    assert "OK" in out, f"seed failed: {out}"
    return uid, tok, em


def cleanup(uid):
    mongo_eval(f"""
    var r = db.restaurants.findOne({{owner_user_id:'{uid}'}});
    if (r) {{
      db.team_members.deleteMany({{restaurant_id:r.restaurant_id}});
      db.activity_events.deleteMany({{restaurant_id:r.restaurant_id}});
      db.restaurants.deleteOne({{restaurant_id:r.restaurant_id}});
    }}
    db.user_sessions.deleteMany({{user_id:'{uid}'}});
    db.users.deleteOne({{user_id:'{uid}'}});
    print('CLEANED');
    """)


def _onboard(cookies):
    r = requests.post(f"{API}/onboarding",
                      json={"owner_name": "O", "restaurant_name": "TEST_R", "city": "BLR"},
                      cookies=cookies)
    assert r.status_code == 200, r.text
    return r.json()


# ─────────────────────────────────────────────────────────────
# 1. POST /api/team returns { member, pin }, DB stores pin_hash only
# ─────────────────────────────────────────────────────────────
def test_team_add_returns_pin_and_stores_hash_only():
    uid, tok, _ = seed_owner()
    try:
        cookies = {"session_token": tok}
        _onboard(cookies)
        r = requests.post(f"{API}/team", json={"name": "TEST_Emp", "role": "employee"}, cookies=cookies)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "member" in data and "pin" in data, data
        assert isinstance(data["pin"], str) and len(data["pin"]) == 4 and data["pin"].isdigit()
        member = data["member"]
        assert member["member_id"].startswith("member_")
        assert member["role"] == "employee"
        # No pin fields in sanitized member
        assert "pin" not in member and "pin_hash" not in member
        mid = member["member_id"]

        # DB check: pin_hash present, no plaintext pin field
        out = mongo_eval(f"print('DOC:' + JSON.stringify(db.team_members.findOne({{member_id:'{mid}'}}, {{_id:0}})));")
        line = next((l for l in out.splitlines() if l.startswith("DOC:")), None)
        assert line, f"no doc line: {out}"
        doc = json.loads(line[4:])
        assert doc is not None, "member doc not found"
        assert "pin_hash" in doc and doc["pin_hash"].startswith("$2")
        assert "pin" not in doc, f"plaintext pin leaked in DB: {doc}"
    finally:
        cleanup(uid)


# ─────────────────────────────────────────────────────────────
# 2. GET /api/restaurant has no employee_pin / kitchen_pin, members without pin fields
# ─────────────────────────────────────────────────────────────
def test_restaurant_response_no_pin_fields():
    uid, tok, _ = seed_owner()
    try:
        cookies = {"session_token": tok}
        _onboard(cookies)
        requests.post(f"{API}/team", json={"name": "TEST_A", "role": "employee"}, cookies=cookies)
        requests.post(f"{API}/team", json={"name": "TEST_B", "role": "kitchen"}, cookies=cookies)
        r = requests.get(f"{API}/restaurant", cookies=cookies)
        assert r.status_code == 200, r.text
        d = r.json()
        assert set(d.keys()) == {"restaurant_id", "name", "city", "code", "members"}, d.keys()
        assert "employee_pin" not in d and "kitchen_pin" not in d
        for m in d["members"]:
            assert set(m.keys()) == {"member_id", "name", "role", "created_at", "last_used_at"}
            assert "pin" not in m and "pin_hash" not in m
    finally:
        cleanup(uid)


# ─────────────────────────────────────────────────────────────
# 3. staff/lookup + staff/login: right pin succeeds, wrong pin 401
# ─────────────────────────────────────────────────────────────
def test_staff_login_correct_and_wrong_pin():
    uid, tok, _ = seed_owner()
    try:
        cookies = {"session_token": tok}
        ob = _onboard(cookies)
        add = requests.post(f"{API}/team", json={"name": "TEST_Alice", "role": "employee"}, cookies=cookies).json()
        pin = add["pin"]; member_id = add["member"]["member_id"]; code = ob["code"]

        # lookup shows the member
        lu = requests.post(f"{API}/staff/lookup", json={"code": code})
        assert lu.status_code == 200
        assert any(m["member_id"] == member_id for m in lu.json()["employee_members"])

        # wrong pin
        wrong = requests.post(f"{API}/staff/login", json={"code": code, "member_id": member_id, "pin": "0000"})
        assert wrong.status_code == 401

        # right pin
        s = requests.Session()
        ok = s.post(f"{API}/staff/login", json={"code": code, "member_id": member_id, "pin": pin})
        assert ok.status_code == 200, ok.text
        assert "session_token" in s.cookies
        me = s.get(f"{API}/auth/me")
        assert me.status_code == 200
        assert me.json()["role"] == "employee"
    finally:
        cleanup(uid)


# ─────────────────────────────────────────────────────────────
# 4. rotate-pin: new pin works, old pin fails, sessions of that member invalidated,
#    but other member's session survives
# ─────────────────────────────────────────────────────────────
def test_rotate_pin_isolation():
    uid, tok, _ = seed_owner()
    try:
        cookies = {"session_token": tok}
        ob = _onboard(cookies); code = ob["code"]
        a = requests.post(f"{API}/team", json={"name": "TEST_A", "role": "employee"}, cookies=cookies).json()
        b = requests.post(f"{API}/team", json={"name": "TEST_B", "role": "employee"}, cookies=cookies).json()
        a_id, a_pin = a["member"]["member_id"], a["pin"]
        b_id, b_pin = b["member"]["member_id"], b["pin"]

        # Login both A and B
        sA = requests.Session()
        rA = sA.post(f"{API}/staff/login", json={"code": code, "member_id": a_id, "pin": a_pin})
        assert rA.status_code == 200
        sB = requests.Session()
        rB = sB.post(f"{API}/staff/login", json={"code": code, "member_id": b_id, "pin": b_pin})
        assert rB.status_code == 200

        # Rotate A's PIN
        rot = requests.post(f"{API}/team/{a_id}/rotate-pin", cookies=cookies)
        assert rot.status_code == 200, rot.text
        data = rot.json()
        assert data["member_id"] == a_id
        new_pin = data["pin"]
        assert isinstance(new_pin, str) and len(new_pin) == 4
        assert new_pin != a_pin  # very likely different; if equal, still valid but reroll — accept equal

        # A's old session token is invalidated
        me_a = sA.get(f"{API}/auth/me")
        assert me_a.status_code == 401

        # B's session still works
        me_b = sB.get(f"{API}/auth/me")
        assert me_b.status_code == 200, me_b.text
        assert me_b.json()["user_id"] == b_id

        # Old PIN doesn't work; new PIN does
        old = requests.post(f"{API}/staff/login", json={"code": code, "member_id": a_id, "pin": a_pin})
        assert old.status_code == 401
        new = requests.post(f"{API}/staff/login", json={"code": code, "member_id": a_id, "pin": new_pin})
        assert new.status_code == 200

        # B can still sign in with unchanged PIN
        b2 = requests.post(f"{API}/staff/login", json={"code": code, "member_id": b_id, "pin": b_pin})
        assert b2.status_code == 200
    finally:
        cleanup(uid)


# ─────────────────────────────────────────────────────────────
# 5. Activity: POST as owner + staff; GET RBAC (staff only own, owner all)
# ─────────────────────────────────────────────────────────────
def test_activity_post_and_rbac():
    uid, tok, _ = seed_owner()
    try:
        owner_cookies = {"session_token": tok}
        ob = _onboard(owner_cookies); code = ob["code"]
        emp = requests.post(f"{API}/team", json={"name": "TEST_Emp", "role": "employee"}, cookies=owner_cookies).json()
        emp_id, emp_pin = emp["member"]["member_id"], emp["pin"]

        sE = requests.Session()
        sE.post(f"{API}/staff/login", json={"code": code, "member_id": emp_id, "pin": emp_pin}).raise_for_status()

        # Owner posts activity
        rO = requests.post(f"{API}/activity",
                           json={"action": "accepted_order", "order_id": "#GF-9001", "order_customer": "OwnerCust"},
                           cookies=owner_cookies)
        assert rO.status_code == 200, rO.text
        oev = rO.json()
        assert oev["actor_role"] == "owner"
        assert oev["restaurant_id"] == ob["restaurant_id"]
        assert oev["order_id"] == "#GF-9001"

        # Staff posts activity
        rE = sE.post(f"{API}/activity",
                     json={"action": "started_prep", "order_id": "#GF-9002", "order_customer": "EmpCust"})
        assert rE.status_code == 200, rE.text
        eev = rE.json()
        assert eev["actor_role"] == "employee"
        assert eev["actor_name"] == "TEST_Emp"
        assert eev["actor_user_id"] == emp_id

        # DB verification: 2 events for this restaurant
        out = mongo_eval(f"print('CNT:' + db.activity_events.countDocuments({{restaurant_id:'{ob['restaurant_id']}'}}));")
        line = next((l for l in out.splitlines() if l.startswith("CNT:")), None)
        assert line, f"no count line: {out}"
        assert int(line[4:]) >= 2

        # Owner GET returns both events
        gO = requests.get(f"{API}/activity", cookies=owner_cookies)
        assert gO.status_code == 200
        owner_events = gO.json()["events"]
        ids = {e["order_id"] for e in owner_events}
        assert "#GF-9001" in ids and "#GF-9002" in ids

        # Staff GET returns only own event
        gE = sE.get(f"{API}/activity")
        assert gE.status_code == 200
        emp_events = gE.json()["events"]
        assert all(e["actor_user_id"] == emp_id for e in emp_events), emp_events
        assert any(e["order_id"] == "#GF-9002" for e in emp_events)
        assert not any(e["order_id"] == "#GF-9001" for e in emp_events)
    finally:
        cleanup(uid)


# ─────────────────────────────────────────────────────────────
# 6. Activity: missing restaurant_id on session → 400
# (Owner without onboarding has restaurant_id=null on session)
# ─────────────────────────────────────────────────────────────
def test_activity_missing_restaurant_400():
    uid, tok, _ = seed_owner()
    try:
        cookies = {"session_token": tok}
        r = requests.post(f"{API}/activity",
                          json={"action": "accepted_order", "order_id": "#X"},
                          cookies=cookies)
        assert r.status_code == 400, r.text
    finally:
        cleanup(uid)


# ─────────────────────────────────────────────────────────────
# 7. Allowlist: with OWNER_ALLOWED_EMAILS set, non-listed → 403, listed → 200
# We modify backend/.env, restart, test, restore.
# ─────────────────────────────────────────────────────────────
ENV_PATH = "/app/backend/.env"


def _write_env(extra_line: str | None):
    """Rewrite backend/.env keeping existing keys; append/replace OWNER_ALLOWED_EMAILS."""
    with open(ENV_PATH) as f:
        lines = [l for l in f.read().splitlines() if not l.startswith("OWNER_ALLOWED_EMAILS")]
    if extra_line is not None:
        lines.append(extra_line)
    with open(ENV_PATH, "w") as f:
        f.write("\n".join(lines) + "\n")
    subprocess.run(["sudo", "supervisorctl", "restart", "backend"], capture_output=True, text=True, timeout=30)
    # Wait for backend to come up
    for _ in range(30):
        try:
            r = requests.get(f"{API}/", timeout=2)
            if r.status_code == 200:
                return
        except Exception:
            pass
        time.sleep(1)


def test_owner_allowlist_blocks_and_allows():
    # Seed two owners
    uid_bad, tok_bad, _ = seed_owner(email="blocked_owner@example.com")
    uid_ok, tok_ok, _ = seed_owner(email="allowed_owner@example.com")
    try:
        _write_env('OWNER_ALLOWED_EMAILS="allowed_owner@example.com"')
        # Non-listed → 403
        r_bad = requests.post(f"{API}/onboarding",
                              json={"owner_name": "B", "restaurant_name": "TEST_Bad", "city": "X"},
                              cookies={"session_token": tok_bad})
        assert r_bad.status_code == 403, r_bad.text
        # Listed → 200
        r_ok = requests.post(f"{API}/onboarding",
                             json={"owner_name": "G", "restaurant_name": "TEST_Good", "city": "Y"},
                             cookies={"session_token": tok_ok})
        assert r_ok.status_code == 200, r_ok.text
    finally:
        # Restore .env (remove OWNER_ALLOWED_EMAILS) and restart
        _write_env(None)
        cleanup(uid_bad); cleanup(uid_ok)
