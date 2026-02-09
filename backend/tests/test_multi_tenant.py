from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.base import Base
from app.api.deps import get_db
from app.core.security import get_password_hash
from app.models.user import User
from app.models.store import Store
from app.models.service import Service


def setup_test_db():
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    return TestingSessionLocal


def login(client: TestClient, email: str, password: str):
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return response.cookies


def test_store_isolation_for_services():
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
        store1 = Store(store_number="12345678", store_name="Loja 1")
        store2 = Store(store_number="87654321", store_name="Loja 2")
        db.add_all([store1, store2])
        db.flush()
        manager1 = User(
            email="manager1@luxe.com",
            first_name="Manager",
            role="manager",
            store_id=store1.id,
            hashed_password=get_password_hash("secret1"),
        )
        manager2 = User(
            email="manager2@luxe.com",
            first_name="Manager",
            role="manager",
            store_id=store2.id,
            hashed_password=get_password_hash("secret2"),
        )
        db.add_all([manager1, manager2])
        db.add(Service(store_id=store2.id, name="Corte 2", type="male", price=2000, commission_rate=50, active=True))
        db.commit()

    cookies = login(client, "manager1@luxe.com", "secret1")
    response = client.post(
        "/api/services",
        json={"name": "Corte 1", "type": "male", "price": 1000, "commissionRate": 50, "active": True},
        cookies=cookies,
    )
    assert response.status_code == 201

    response = client.get("/api/services", cookies=cookies)
    assert response.status_code == 200
    services = response.json()
    assert len(services) == 1
    assert services[0]["name"] == "Corte 1"
