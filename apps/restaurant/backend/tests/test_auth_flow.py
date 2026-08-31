"""Tests for Emergent Google Auth integration on GreenFork backend."""
import os
import time
import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://partner-panel-2.preview.emergentagent.com").rstrip("/")
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")


@pytest.fixture(scope="module")
def mongo_db():
    c = MongoClient(MONGO_URL)
    yield c[DB_NAME]
    c.close()


@pytest.fixture(scope="module")
def seeded_session(mongo_db):
    uid = f"test-user-pytest-{int(time.time())}"
    token = f"test_session_pytest_{int(time.time())}"
    mongo_db.users.insert_one({
        "user_id": uid,
        "email": f"pytest.{int(time.time())}@example.com",
        "name": "Pytest User",
        "picture": "https://via.placeholder.com/150",
    })
    mongo_db.user_sessions.insert_one({
        "user_id": uid,
        "session_token": token,
        "expires_at": (__import__("datetime").datetime.utcnow() + __import__("datetime").timedelta(days=7)),
    })
    yield {"user_id": uid, "token": token}
    mongo_db.users.delete_one({"user_id": uid})
    mongo_db.user_sessions.delete_one({"session_token": token})


# /api/auth/session
def test_session_missing_header_returns_400():
    r = requests.post(f"{BASE_URL}/api/auth/session")
    assert r.status_code == 400, r.text


# /api/auth/me unauthenticated
def test_me_no_auth_returns_401():
    r = requests.get(f"{BASE_URL}/api/auth/me")
    assert r.status_code == 401, r.text


# /api/auth/me with valid seeded token
def test_me_with_valid_token(seeded_session):
    r = requests.get(
        f"{BASE_URL}/api/auth/me",
        headers={"Authorization": f"Bearer {seeded_session['token']}"},
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert "_id" not in data
    for f in ("user_id", "email", "name", "picture"):
        assert f in data, f"missing field {f}"
    assert data["user_id"] == seeded_session["user_id"]


# /api/auth/logout deletes session
def test_logout_deletes_session(mongo_db):
    uid = f"test-user-logout-{int(time.time())}"
    token = f"test_session_logout_{int(time.time())}"
    mongo_db.users.insert_one({"user_id": uid, "email": f"lo.{int(time.time())}@e.com", "name": "L", "picture": None})
    mongo_db.user_sessions.insert_one({
        "user_id": uid,
        "session_token": token,
        "expires_at": (__import__("datetime").datetime.utcnow() + __import__("datetime").timedelta(days=7)),
    })
    try:
        # confirm active first
        r0 = requests.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert r0.status_code == 200

        r = requests.post(f"{BASE_URL}/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200, r.text

        # session deleted in Mongo
        assert mongo_db.user_sessions.find_one({"session_token": token}) is None

        # /me now 401
        r2 = requests.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert r2.status_code == 401
    finally:
        mongo_db.users.delete_one({"user_id": uid})
        mongo_db.user_sessions.delete_one({"session_token": token})
