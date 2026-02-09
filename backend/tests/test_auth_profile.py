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
    return engine, TestingSessionLocal


def test_login_and_profile_flow():
    _, TestingSessionLocal = setup_test_db()

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
        user = User(
            email="manager@example.com",
            first_name="Manager",
            role="manager",
            store_id=store.id,
            hashed_password=get_password_hash("secret"),
        )
        db.add(user)
        db.commit()

    response = client.post("/api/auth/login", json={"email": "manager@example.com", "password": "secret"})
    assert response.status_code == 200
    assert response.cookies.get("access_token")

    response = client.post(
        "/api/profile",
        json={"role": "manager", "cpf": "12345678901", "phone": "11999999999"},
        cookies=response.cookies,
    )
    assert response.status_code == 200

    response = client.get("/api/me", cookies=response.cookies)
    assert response.status_code == 200
    data = response.json()
    assert data["profile"]["role"] == "manager"
