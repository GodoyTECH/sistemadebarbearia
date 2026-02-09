from datetime import datetime, time
from sqlalchemy import String, Integer, DateTime, ForeignKey, Boolean, Time
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ProfessionalAvailability(Base):
    __tablename__ = "professional_availability"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    store_id: Mapped[str | None] = mapped_column(String, ForeignKey("stores.id"))
    professional_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    weekday: Mapped[int] = mapped_column(Integer)  # 0=Monday
    start_time: Mapped[time] = mapped_column(Time)
    end_time: Mapped[time] = mapped_column(Time)
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class ScheduleBlock(Base):
    __tablename__ = "schedule_blocks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    store_id: Mapped[str | None] = mapped_column(String, ForeignKey("stores.id"))
    professional_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    start_at: Mapped[datetime] = mapped_column(DateTime)
    end_at: Mapped[datetime] = mapped_column(DateTime)
    reason: Mapped[str | None] = mapped_column(String)


class AppointmentRequest(Base):
    __tablename__ = "appointment_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    store_id: Mapped[str | None] = mapped_column(String, ForeignKey("stores.id"))
    professional_id: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"))
    service_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("services.id"))
    customer_name: Mapped[str] = mapped_column(String)
    customer_phone: Mapped[str] = mapped_column(String)
    requested_at: Mapped[datetime] = mapped_column(DateTime)
    status: Mapped[str] = mapped_column(String, default="requested")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
