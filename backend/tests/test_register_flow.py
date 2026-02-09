from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.base import Base
from app.api.deps import get_db


def setup_test_db():
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    return TestingSessionLocal


def test_manager_register_creates_store():
    TestingSessionLocal = setup_test_db()

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    response = client.post(
        "/api/auth/register",
        json={
            "firstName": "Ana",
            "lastName": "Silva",
            "email": "ana12@luxe.com",
            "password": "senha12",
            "phone": "11999999999",
            "role": "manager",
            "storeName": "Luxe Centro",
        },
    )

    assert response.status_code == 201
    assert response.json()["role"] == "manager"


def test_professional_register_requires_store_number():
    TestingSessionLocal = setup_test_db()

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    response = client.post(
        "/api/auth/register",
        json={
            "firstName": "Joao",
            "email": "joao22@luxe.com",
            "password": "senha22",
            "phone": "11999999999",
            "role": "professional",
        },
    )

    assert response.status_code == 422


def test_professional_login_rejects_wrong_store_number():
    TestingSessionLocal = setup_test_db()

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    manager = client.post(
        "/api/auth/register",
        json={
            "firstName": "Ana",
            "lastName": "Silva",
            "email": "ana34@luxe.com",
            "password": "senha34",
            "phone": "11999999999",
            "role": "manager",
            "storeName": "Luxe Centro",
        },
    )
    assert manager.status_code == 201

    me = client.get("/api/me", cookies=manager.cookies)
    assert me.status_code == 200
    store_number = me.json()["store"]["storeNumber"]

    response = client.post(
        "/api/auth/register",
        json={
            "firstName": "Lia",
            "email": "lia45@luxe.com",
            "password": "senha45",
            "phone": "11999999999",
            "role": "professional",
            "storeNumber": store_number,
        },
    )
    assert response.status_code == 201

    login = client.post(
        "/api/auth/login",
        json={"email": "lia45@luxe.com", "password": "senha45", "storeNumber": "00000000"},
    )
    assert login.status_code == 403
