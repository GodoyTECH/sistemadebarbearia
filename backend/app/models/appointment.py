from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    store_id: Mapped[str | None] = mapped_column(String, ForeignKey("stores.id"))
    professional_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)
    service_id: Mapped[int] = mapped_column(Integer, ForeignKey("services.id"))
    date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    customer_name: Mapped[str] = mapped_column(String)
    price: Mapped[int] = mapped_column(Integer)
    commission_rate: Mapped[int] = mapped_column(Integer)
    payment_method: Mapped[str] = mapped_column(String)
    transaction_id: Mapped[str | None] = mapped_column(String, unique=True)
    proof_url: Mapped[str | None] = mapped_column(Text)
    proof_hash: Mapped[str | None] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="pending")
    possible_duplicate: Mapped[bool] = mapped_column(Boolean, default=False)

    professional = relationship("User")
    service = relationship("Service")
    store = relationship("Store")
