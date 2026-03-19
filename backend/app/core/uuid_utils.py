import uuid
from fastapi import HTTPException


def normalize_uuid_str(value: str, *, field_name: str = "id", status_code: int = 400, message: str | None = None) -> str:
    """Validate and normalize UUID strings to canonical text format."""
    try:
        return str(uuid.UUID(value))
    except (ValueError, TypeError, AttributeError) as exc:
        detail = message or f"{field_name} must be a valid UUID"
        raise HTTPException(status_code=status_code, detail=detail) from exc
