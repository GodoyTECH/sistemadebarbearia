from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.schedule import ProfessionalAvailability, ScheduleBlock, AppointmentRequest
from app.schemas.schedule import (
    AvailabilityBase,
    AvailabilityCreate,
    BlockBase,
    BlockCreate,
    RequestBase,
    RequestCreate,
    RequestStatusUpdate,
)
from app.models.audit_log import AuditLog

router = APIRouter(prefix="/api/schedule", tags=["schedule"])


@router.get("/availability", response_model=list[AvailabilityBase])
def list_availability(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = (
        db.query(ProfessionalAvailability)
        .filter(ProfessionalAvailability.store_id == user.store_id)
        .filter(ProfessionalAvailability.professional_id == user.id)
        .all()
    )
    return [
        AvailabilityBase(
            id=row.id,
            professionalId=row.professional_id,
            weekday=row.weekday,
            startTime=row.start_time,
            endTime=row.end_time,
            active=row.active,
        )
        for row in rows
    ]


@router.post("/availability", response_model=AvailabilityBase, status_code=201)
def create_availability(payload: AvailabilityCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    availability = ProfessionalAvailability(
        store_id=user.store_id,
        professional_id=user.id,
        weekday=payload.weekday,
        start_time=payload.startTime,
        end_time=payload.endTime,
        active=True,
    )
    db.add(availability)
    db.add(AuditLog(actor_id=user.id, store_id=user.store_id, action="availability:create"))
    db.commit()
    db.refresh(availability)
    return AvailabilityBase(
        id=availability.id,
        professionalId=availability.professional_id,
        weekday=availability.weekday,
        startTime=availability.start_time,
        endTime=availability.end_time,
        active=availability.active,
    )


@router.get("/blocks", response_model=list[BlockBase])
def list_blocks(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    blocks = (
        db.query(ScheduleBlock)
        .filter(ScheduleBlock.store_id == user.store_id)
        .filter(ScheduleBlock.professional_id == user.id)
        .all()
    )
    return [
        BlockBase(
            id=block.id,
            professionalId=block.professional_id,
            startAt=block.start_at,
            endAt=block.end_at,
            reason=block.reason,
        )
        for block in blocks
    ]


@router.post("/blocks", response_model=BlockBase, status_code=201)
def create_block(payload: BlockCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    block = ScheduleBlock(
        store_id=user.store_id,
        professional_id=user.id,
        start_at=payload.startAt,
        end_at=payload.endAt,
        reason=payload.reason,
    )
    db.add(block)
    db.add(AuditLog(actor_id=user.id, store_id=user.store_id, action="block:create"))
    db.commit()
    db.refresh(block)
    return BlockBase(
        id=block.id,
        professionalId=block.professional_id,
        startAt=block.start_at,
        endAt=block.end_at,
        reason=block.reason,
    )


@router.get("/requests", response_model=list[RequestBase])
def list_requests(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    requests = (
        db.query(AppointmentRequest)
        .filter(AppointmentRequest.store_id == user.store_id)
        .filter(AppointmentRequest.professional_id == user.id)
        .all()
    )
    return [
        RequestBase(
            id=req.id,
            professionalId=req.professional_id,
            serviceId=req.service_id,
            customerName=req.customer_name,
            customerPhone=req.customer_phone,
            requestedAt=req.requested_at,
            status=req.status,
        )
        for req in requests
    ]


@router.post("/requests", response_model=RequestBase, status_code=201)
def create_request(payload: RequestCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if payload.professionalId and payload.professionalId != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    request_row = AppointmentRequest(
        store_id=user.store_id,
        professional_id=payload.professionalId or user.id,
        service_id=payload.serviceId,
        customer_name=payload.customerName,
        customer_phone=payload.customerPhone,
        requested_at=payload.requestedAt,
        status="requested",
    )
    db.add(request_row)
    db.add(AuditLog(actor_id=user.id, store_id=user.store_id, action="request:create"))
    db.commit()
    db.refresh(request_row)
    return RequestBase(
        id=request_row.id,
        professionalId=request_row.professional_id,
        serviceId=request_row.service_id,
        customerName=request_row.customer_name,
        customerPhone=request_row.customer_phone,
        requestedAt=request_row.requested_at,
        status=request_row.status,
    )


@router.patch("/requests/{request_id}/status", response_model=RequestBase)
def update_request_status(
    request_id: int,
    payload: RequestStatusUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    request_row = (
        db.query(AppointmentRequest)
        .filter(AppointmentRequest.id == request_id)
        .filter(AppointmentRequest.store_id == user.store_id)
        .first()
    )
    if not request_row:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    request_row.status = payload.status
    db.add(AuditLog(actor_id=user.id, store_id=user.store_id, action=f"request:{payload.status}"))
    db.commit()
    db.refresh(request_row)
    return RequestBase(
        id=request_row.id,
        professionalId=request_row.professional_id,
        serviceId=request_row.service_id,
        customerName=request_row.customer_name,
        customerPhone=request_row.customer_phone,
        requestedAt=request_row.requested_at,
        status=request_row.status,
    )
