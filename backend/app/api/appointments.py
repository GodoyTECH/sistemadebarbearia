from datetime import datetime, timedelta
import hashlib
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, get_current_profile, require_manager
from app.models.appointment import Appointment
from app.models.service import Service
from app.models.audit_log import AuditLog
from app.schemas.appointment import AppointmentBase, AppointmentCreate, AppointmentStatusUpdate
from app.models.user import User

router = APIRouter(prefix="/api/appointments", tags=["appointments"])


def serialize_appointment(appointment: Appointment) -> AppointmentBase:
    return AppointmentBase(
        id=appointment.id,
        professionalId=appointment.professional_id,
        serviceId=appointment.service_id,
        date=appointment.date,
        customerName=appointment.customer_name,
        price=appointment.price,
        commissionRate=appointment.commission_rate,
        paymentMethod=appointment.payment_method,
        transactionId=appointment.transaction_id,
        proofUrl=appointment.proof_url,
        status=appointment.status,
        possibleDuplicate=appointment.possible_duplicate,
    )


@router.get("", response_model=list[AppointmentBase])
def list_appointments(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    profile=Depends(get_current_profile),
    start_date: str | None = Query(None, alias="startDate"),
    end_date: str | None = Query(None, alias="endDate"),
    professional_id: str | None = Query(None, alias="professionalId"),
):
    query = db.query(Appointment).filter(Appointment.store_id == user.store_id)
    role = profile.role if profile else user.role
    if role == "professional":
        query = query.filter(Appointment.professional_id == user.id)
    elif professional_id:
        query = query.filter(Appointment.professional_id == professional_id)

    if start_date:
        query = query.filter(Appointment.date >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Appointment.date <= datetime.fromisoformat(end_date))
    appointments = query.order_by(Appointment.date.desc()).all()
    return [serialize_appointment(appointment) for appointment in appointments]


@router.post("", response_model=AppointmentBase, status_code=201)
def create_appointment(
    payload: AppointmentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    profile=Depends(get_current_profile),
):
    role = profile.role if profile else user.role
    if role not in {"professional", "manager"}:
        raise HTTPException(status_code=403, detail="Not authorized")
    service = db.query(Service).filter(Service.id == payload.serviceId).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    if service.store_id != user.store_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if payload.paymentMethod in {"pix", "card"}:
        if not payload.proofUrl:
            raise HTTPException(status_code=422, detail="Comprovante obrigatório para pagamentos digitais")
        if payload.transactionId:
            duplicate = db.query(Appointment).filter(Appointment.transaction_id == payload.transactionId).first()
            if duplicate:
                raise HTTPException(status_code=409, detail="Transação duplicada")

    possible_duplicate = False
    duplicate_window = datetime.utcnow() - timedelta(hours=2)
    dup_match = (
        db.query(Appointment)
        .filter(Appointment.store_id == user.store_id)
        .filter(Appointment.professional_id == user.id)
        .filter(Appointment.price == service.price)
        .filter(Appointment.date >= duplicate_window)
        .first()
    )
    if dup_match:
        possible_duplicate = True

    transaction_id = payload.transactionId or None
    proof_url = payload.proofUrl if payload.paymentMethod in {"pix", "card"} else None

    proof_hash = hashlib.sha256((payload.proofUrl or "").encode("utf-8")).hexdigest() if proof_url else None
    if proof_hash:
        proof_match = (
            db.query(Appointment)
            .filter(Appointment.store_id == user.store_id)
            .filter(Appointment.proof_hash == proof_hash)
            .first()
        )
        if proof_match:
            possible_duplicate = True
    appointment = Appointment(
        store_id=user.store_id,
        professional_id=user.id,
        service_id=payload.serviceId,
        customer_name=payload.customerName,
        price=service.price,
        commission_rate=service.commission_rate,
        payment_method=payload.paymentMethod,
        transaction_id=transaction_id,
        proof_url=proof_url,
        proof_hash=proof_hash,
        status="pending",
        possible_duplicate=possible_duplicate,
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return serialize_appointment(appointment)


@router.patch("/{appointment_id}/status", response_model=AppointmentBase, dependencies=[Depends(require_manager)])
def update_status(
    appointment_id: int,
    payload: AppointmentStatusUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id, Appointment.store_id == user.store_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appointment.status = payload.status
    log = AuditLog(
        actor_id=user.id,
        store_id=user.store_id,
        appointment_id=appointment.id,
        action=f"status:{payload.status}",
        metadata=payload.reason,
    )
    db.add(log)
    db.commit()
    db.refresh(appointment)
    return serialize_appointment(appointment)
