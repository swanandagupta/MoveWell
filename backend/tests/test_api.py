import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.seed import seed_database

# Ensure database is seeded
seed_database()
client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "healthy"}

def test_list_exercises():
    res = client.get("/api/v1/exercises")
    assert res.status_code == 200
    exercises = res.json()
    assert len(exercises) >= 4
    codes = [e["code"] for e in exercises]
    assert "squat" in codes
    assert "shoulder_abduction" in codes
    assert "bicep_curl" in codes
    assert "sit_to_stand" in codes

def test_synthetic_evaluation_endpoint():
    res = client.post("/api/v1/exercises/evaluate-synthetic/squat?reps=2&simulate_errors=false")
    assert res.status_code == 200
    data = res.json()
    assert data["exercise"] == "squat"
    assert data["valid_reps"] == 2
    assert data["accuracy_pct"] == 100.0

def test_login_and_me():
    res = client.post("/api/v1/auth/login", json={
        "email": "alex.patient@movewell.health",
        "password": "movewell123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    token = data["access_token"]

    # Test me endpoint
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    user = me_res.json()
    assert user["email"] == "alex.patient@movewell.health"
    assert user["role"] == "patient"

def test_demo_login():
    res = client.post("/api/v1/auth/demo-login?role=physiotherapist")
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["role"] == "physiotherapist"
