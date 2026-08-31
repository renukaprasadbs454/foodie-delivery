"""Backend tests for GreenFork multi-role: onboarding, restaurant, team, staff login, RBAC."""
import os
import time
import uuid
import subprocess
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://partner-panel-2.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


def mongo_eval(script: str) -> str:
    """Run a mongosh eval script inside test_database."""
    full = f"use('test_database');\n{script}"
    res = subprocess.run(["mongosh", "--quiet", "--eval", full], capture_output=True, text=True, timeout=20)
    return (res.stdout or "") + (res.stderr or "")


def seed_owner():
    """Seed a fresh owner user + session. Returns (user_id, session_token)."""
    uid = f"test-owner-{uuid.uuid4().hex[:10]}"
    tok = f"test_sess_{uuid.uuid4().hex}"
    script = f"""
    db.users.insertOne({{user_id:'{uid}', email:'{uid}@test.com', name:'Test Owner', picture:null, created_at:new Date().toISOString()}});
    db.user_sessions.insertOne({{user_id:'{uid}', session_token:'{tok}', role:'owner', restaurant_id:null, expires_at:new Date(Date.now()+7*24*60*60*1000).toISOString(), created_at:new Date().toISOString()}});
    print('OK');
    """
    out = mongo_eval(script)
    assert "OK" in out, f"Seed failed: {out}"
    return uid, tok


def cleanup(uid):
    mongo_eval(f"""
    var r = db.restaurants.findOne({{owner_user_id:'{uid}'}});
    if (r) {{ db.team_members.deleteMany({{restaurant_id:r.restaurant_id}}); db.restaurants.deleteOne({{restaurant_id:r.restaurant_id}}); }}
    db.user_sessions.deleteMany({{user_id:'{uid}'}});
    db.users.deleteOne({{user_id:'{uid}'}});
    print('CLEANED');
    """)


# ─── /api/auth/me unauthenticated ─────────────────────
def test_auth_me_no_cookie():
    r = requests.get(f"{API}/auth/me")
    assert r.status_code == 401


# ─── Onboarding flow ─────────────────────
def test_onboarding_flow_and_duplicate():
    uid, tok = seed_owner()
    try:
        cookies = {"session_token": tok}
        # First onboarding
        r = requests.post(f"{API}/onboarding", json={
            "owner_name": "Test Owner", "restaurant_name": "TEST_Bistro", "city": "Bengaluru"
        }, cookies=cookies)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is True
        assert d["restaurant_id"].startswith("rest_")
        assert d["code"].startswith("GF-")

        # Second call -> 409
        r2 = requests.post(f"{API}/onboarding", json={
            "owner_name": "X", "restaurant_name": "Y", "city": "Z"
        }, cookies=cookies)
        assert r2.status_code == 409
    finally:
        cleanup(uid)


# ─── GET /api/restaurant ─────────────────────
def test_get_restaurant_returns_full():
    uid, tok = seed_owner()
    try:
        cookies = {"session_token": tok}
        requests.post(f"{API}/onboarding", json={"owner_name":"O","restaurant_name":"TEST_R","city":"BLR"}, cookies=cookies)
        r = requests.get(f"{API}/restaurant", cookies=cookies)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ["restaurant_id","name","city","code","employee_pin","kitchen_pin","members"]:
            assert k in d
        assert d["code"].startswith("GF-")
        assert len(d["employee_pin"]) == 4
        assert len(d["kitchen_pin"]) == 4
        assert isinstance(d["members"], list)
    finally:
        cleanup(uid)


# ─── Team add / delete ─────────────────────
def test_team_add_and_delete():
    uid, tok = seed_owner()
    try:
        cookies = {"session_token": tok}
        requests.post(f"{API}/onboarding", json={"owner_name":"O","restaurant_name":"TEST_R","city":"BLR"}, cookies=cookies)
        r = requests.post(f"{API}/team", json={"name":"TEST_Cook","role":"kitchen"}, cookies=cookies)
        assert r.status_code == 200, r.text
        mid = r.json()["member_id"]
        assert mid.startswith("member_")

        # Verify present
        rr = requests.get(f"{API}/restaurant", cookies=cookies).json()
        assert any(m["member_id"] == mid for m in rr["members"])

        # Delete
        d = requests.delete(f"{API}/team/{mid}", cookies=cookies)
        assert d.status_code == 200
        rr2 = requests.get(f"{API}/restaurant", cookies=cookies).json()
        assert not any(m["member_id"] == mid for m in rr2["members"])
    finally:
        cleanup(uid)


# ─── PATCH restaurant to rotate PIN ─────────────────────
def test_patch_rotate_employee_pin():
    uid, tok = seed_owner()
    try:
        cookies = {"session_token": tok}
        requests.post(f"{API}/onboarding", json={"owner_name":"O","restaurant_name":"TEST_R","city":"BLR"}, cookies=cookies)
        r = requests.patch(f"{API}/restaurant", json={"employee_pin":"4321"}, cookies=cookies)
        assert r.status_code == 200, r.text
        got = requests.get(f"{API}/restaurant", cookies=cookies).json()
        assert got["employee_pin"] == "4321"
    finally:
        cleanup(uid)


# ─── Staff flow: lookup + login + wrong pin + /auth/me ─────────────────────
def test_staff_lookup_login_and_me():
    uid, tok = seed_owner()
    try:
        cookies = {"session_token": tok}
        requests.post(f"{API}/onboarding", json={"owner_name":"O","restaurant_name":"TEST_R","city":"BLR"}, cookies=cookies)
        rest = requests.get(f"{API}/restaurant", cookies=cookies).json()
        code = rest["code"]
        emp_pin = rest["employee_pin"]

        # Add an employee
        add = requests.post(f"{API}/team", json={"name":"TEST_Alice","role":"employee"}, cookies=cookies).json()
        member_id = add["member_id"]

        # Lookup
        lu = requests.post(f"{API}/staff/lookup", json={"code": code})
        assert lu.status_code == 200
        ld = lu.json()
        assert ld["restaurant_id"] == rest["restaurant_id"]
        assert any(m["member_id"] == member_id for m in ld["employee_members"])

        # Wrong PIN -> 401
        wrong = requests.post(f"{API}/staff/login", json={
            "code": code, "role":"employee","member_id": member_id,"pin":"0000"
        })
        assert wrong.status_code == 401

        # Correct login
        sess = requests.Session()
        ok = sess.post(f"{API}/staff/login", json={
            "code": code, "role":"employee","member_id": member_id,"pin": emp_pin
        })
        assert ok.status_code == 200, ok.text
        assert "session_token" in sess.cookies

        # /auth/me returns employee + name
        me = sess.get(f"{API}/auth/me")
        assert me.status_code == 200, me.text
        md = me.json()
        assert md["role"] == "employee"
        assert md["name"] == "TEST_Alice"
        assert md["restaurant_id"] == rest["restaurant_id"]

        # RBAC: staff cookie cannot access /api/restaurant or POST /api/team
        r1 = sess.get(f"{API}/restaurant")
        assert r1.status_code == 403
        r2 = sess.post(f"{API}/team", json={"name":"X","role":"employee"})
        assert r2.status_code == 403
    finally:
        cleanup(uid)
