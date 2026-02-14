from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, get_current_profile
from app.models.appointment import Appointment
from app.models.service import Service
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
    if not profile:
        raise HTTPException(status_code=403, detail="Perfil não encontrado.")
    if profile.role == "professional" and profile.approval_status != "active":
        raise HTTPException(status_code=403, detail="Aguardando aprovação para acessar o painel.")

    query = db.query(Appointment)
    if profile.role == "professional":
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
    if not profile or profile.role != "professional" or profile.approval_status != "active":
        raise HTTPException(status_code=403, detail="Você não pode registrar atendimentos no momento.")

    service = db.query(Service).filter(Service.id == payload.serviceId).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    if payload.paymentMethod in {"pix", "card"} and not payload.proofUrl:
        raise HTTPException(status_code=422, detail="Comprovante obrigatório para pagamentos digitais")

    if payload.transactionId:
        duplicate = db.query(Appointment).filter(Appointment.transaction_id == payload.transactionId).first()
        if duplicate:
            raise HTTPException(status_code=409, detail="Transação já registrada")

    appointment = Appointment(
        professional_id=user.id,
        service_id=payload.serviceId,
        customer_name=payload.customerName,
        price=payload.price,
        commission_rate=service.commission_rate,
        payment_method=payload.paymentMethod,
        transaction_id=payload.transactionId,
        proof_url=payload.proofUrl,
        proof_hash=payload.proofHash,
        status="pending",
        possible_duplicate=False,
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return serialize_appointment(appointment)


@router.patch("/{appointment_id}/status", response_model=AppointmentBase)
def update_status(
    appointment_id: int,
    payload: AppointmentStatusUpdate,
    db: Session = Depends(get_db),
    profile=Depends(get_current_profile),
):
    if not profile or profile.role != "manager":
        raise HTTPException(status_code=403, detail="Not authorized")
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    appointment.status = payload.status
    db.commit()
    db.refresh(appointment)
    return serialize_appointment(appointment)
