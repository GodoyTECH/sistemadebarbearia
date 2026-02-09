from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.base import Base
from app.api.deps import get_db
from app.core.security import get_password_hash
from app.models.user import User
from app.models.store import Store


def setup_test_db():
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    return TestingSessionLocal


def test_create_availability():
    TestingSessionLocal = setup_test_db()

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    with TestingSessionLocal() as db:
        store = Store(store_number="12345678", store_name="Loja 1")
        db.add(store)
        db.flush()
        professional = User(
            email="pro33@luxe.com",
            first_name="Pro",
            role="professional",
            store_id=store.id,
            hashed_password=get_password_hash("secret33"),
        )
        db.add(professional)
        db.commit()

    login = client.post("/api/auth/login", json={"email": "pro33@luxe.com", "password": "secret33", "storeNumber": "12345678"})
    assert login.status_code == 200

    response = client.post(
        "/api/schedule/availability",
        json={"weekday": 1, "startTime": "09:00:00", "endTime": "18:00:00"},
        cookies=login.cookies,
    )
    assert response.status_code == 201


def test_update_request_status():
    TestingSessionLocal = setup_test_db()

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    with TestingSessionLocal() as db:
        store = Store(store_number="87654321", store_name="Loja 2")
        db.add(store)
        db.flush()
        professional = User(
            email="pro77@luxe.com",
            first_name="Pro",
            role="professional",
            store_id=store.id,
            hashed_password=get_password_hash("secret77"),
        )
        db.add(professional)
        db.commit()

    login = client.post("/api/auth/login", json={"email": "pro77@luxe.com", "password": "secret77", "storeNumber": "87654321"})
    assert login.status_code == 200

    create_request = client.post(
        "/api/schedule/requests",
        json={
            "serviceId": 1,
            "customerName": "Cliente",
            "customerPhone": "11999999999",
            "requestedAt": datetime.utcnow().isoformat(),
        },
        cookies=login.cookies,
    )
    assert create_request.status_code == 201
    request_id = create_request.json()["id"]

    update = client.patch(
        f"/api/schedule/requests/{request_id}/status",
        json={"status": "confirmed"},
        cookies=login.cookies,
    )
    assert update.status_code == 200
    assert update.json()["status"] == "confirmed"
