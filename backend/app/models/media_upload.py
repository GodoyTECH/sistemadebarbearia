from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class MediaUpload(Base):
    __tablename__ = "media_uploads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    type: Mapped[str] = mapped_column(String(16))
    shop_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("shops.id"), index=True)
    professional_id: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), index=True)
    payment_id: Mapped[int | None] = mapped_column(Integer)
    secure_url: Mapped[str] = mapped_column(Text)
    public_id: Mapped[str] = mapped_column(Text)
    asset_id: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
