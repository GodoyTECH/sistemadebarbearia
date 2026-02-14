from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ProfessionalApproval(Base):
    __tablename__ = "professional_approvals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    professional_user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)
    manager_user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(16))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
