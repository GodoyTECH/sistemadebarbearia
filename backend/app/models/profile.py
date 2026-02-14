from sqlalchemy import String, Integer, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), unique=True, index=True)
    shop_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("shops.id"), index=True)
    role: Mapped[str] = mapped_column(String, default="professional")
    cpf: Mapped[str | None] = mapped_column(String)
    phone: Mapped[str | None] = mapped_column(String)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    approval_status: Mapped[str] = mapped_column(String, default="active")
    approved_by_user_id: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"))
    approval_at: Mapped[DateTime | None] = mapped_column(DateTime)
    rejection_at: Mapped[DateTime | None] = mapped_column(DateTime)
    availability: Mapped[bool] = mapped_column(Boolean, default=True)

    user = relationship("User", foreign_keys=[user_id])
    shop = relationship("Shop", foreign_keys=[shop_id])
