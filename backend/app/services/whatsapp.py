from dataclasses import dataclass
from app.core.config import settings


@dataclass
class WhatsAppMessage:
    phone: str
    content: str


class WhatsAppService:
    def __init__(self, enabled: bool = False) -> None:
        self.enabled = enabled

    def send_message(self, message: WhatsAppMessage) -> None:
        if not self.enabled:
            return
        # Placeholder for provider integration (Meta/Twilio)
        raise NotImplementedError("WhatsApp provider not configured")


def get_whatsapp_service() -> WhatsAppService:
    return WhatsAppService(enabled=settings.whatsapp_enabled)
