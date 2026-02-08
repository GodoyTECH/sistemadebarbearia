from sqlalchemy import String, Integer, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)
    role: Mapped[str] = mapped_column(String, default="professional")
    cpf: Mapped[str | None] = mapped_column(String)
    phone: Mapped[str | None] = mapped_column(String)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    user = relationship("User")
