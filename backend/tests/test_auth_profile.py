from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.base import Base
from app.api.deps import get_db


def setup_test_db():
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    testing_session_local = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    return testing_session_local


def get_client():
    testing_session_local = setup_test_db()

    def override_get_db():
        db = testing_session_local()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app)


def test_manager_professional_approval_flow():
    client = get_client()

    manager_payload = {
        "role": "manager",
        "managerName": "Gerente Luxe",
        "shopName": "Luxe Centro",
        "phone": "11999999999",
        "emailPrefix": "gerente",
        "password": "abc12345",
        "confirmPassword": "abc12345",
    }
    manager_res = client.post("/api/auth/register", json=manager_payload)
    assert manager_res.status_code == 201
    manager_data = manager_res.json()
    shop_code = manager_data["shop"]["code"]
    manager_cookies = manager_res.cookies

    prof_payload = {
        "role": "professional",
        "name": "Profissional 1",
        "phone": "11988887777",
        "emailPrefix": "pro1",
        "password": "abc12345",
        "confirmPassword": "abc12345",
        "shopCode": shop_code,
    }
    prof_res = client.post("/api/auth/register", json=prof_payload)
    assert prof_res.status_code == 201
    professional_user_id = prof_res.json()["user"]["id"]

    blocked_login = client.post("/api/auth/login", json={"email": "pro1@luxe.com", "password": "abc12345"})
    assert blocked_login.status_code == 403

    pending = client.get("/api/professionals/pending", cookies=manager_cookies)
    assert pending.status_code == 200
    assert pending.json()[0]["userId"] == professional_user_id

    decision = client.post(
        f"/api/professionals/{professional_user_id}/decision",
        json={"action": "approve"},
        cookies=manager_cookies,
    )
    assert decision.status_code == 200

    approved_login = client.post("/api/auth/login", json={"email": "pro1@luxe.com", "password": "abc12345"})
    assert approved_login.status_code == 200


def test_healthz():
    client = get_client()
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
