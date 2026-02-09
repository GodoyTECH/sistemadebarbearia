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
from app.models.service import Service


def setup_test_db():
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    return TestingSessionLocal


def test_duplicate_transaction_id_blocked():
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
            email="pro12@luxe.com",
            first_name="Pro",
            role="professional",
            store_id=store.id,
            hashed_password=get_password_hash("secret12"),
        )
        db.add(professional)
        db.add(Service(store_id=store.id, name="Corte", type="male", price=1000, commission_rate=50, active=True))
        db.commit()

    login = client.post("/api/auth/login", json={"email": "pro12@luxe.com", "password": "secret12", "storeNumber": "12345678"})
    assert login.status_code == 200

    payload = {
        "serviceId": 1,
        "customerName": "Cliente",
        "paymentMethod": "pix",
        "price": 1000,
        "transactionId": "tx123",
        "proofUrl": "https://example.com/proof.jpg",
    }

    response = client.post("/api/appointments", json=payload, cookies=login.cookies)
    assert response.status_code == 201

    response = client.post("/api/appointments", json=payload, cookies=login.cookies)
    assert response.status_code == 409
