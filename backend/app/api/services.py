from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_manager, get_current_user
from app.models.user import User
from app.models.service import Service
from app.schemas.service import ServiceBase, ServiceCreate, ServiceUpdate

router = APIRouter(prefix="/api/services", tags=["services"])


@router.get("", response_model=list[ServiceBase])
def list_services(db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    services = db.query(Service).order_by(Service.id).all()
    return [
        ServiceBase(
            id=service.id,
            name=service.name,
            type=service.type,
            price=service.price,
            commissionRate=service.commission_rate,
            active=service.active,
            description=service.description,
        )
        for service in services
    ]


@router.post("", response_model=ServiceBase, status_code=201, dependencies=[Depends(require_manager)])
def create_service(payload: ServiceCreate, db: Session = Depends(get_db)):
    service = Service(
        name=payload.name,
        type=payload.type,
        price=payload.price,
        commission_rate=payload.commissionRate,
        active=payload.active,
        description=payload.description,
    )
    db.add(service)
    db.commit()
    db.refresh(service)
    return ServiceBase(
        id=service.id,
        name=service.name,
        type=service.type,
        price=service.price,
        commissionRate=service.commission_rate,
        active=service.active,
        description=service.description,
    )


@router.patch("/{service_id}", response_model=ServiceBase, dependencies=[Depends(require_manager)])
def update_service(service_id: int, payload: ServiceUpdate, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(service, field if field != "commissionRate" else "commission_rate", value)
    db.commit()
    db.refresh(service)
    return ServiceBase(
        id=service.id,
        name=service.name,
        type=service.type,
        price=service.price,
        commissionRate=service.commission_rate,
        active=service.active,
        description=service.description,
    )


@router.delete("/{service_id}", status_code=204, dependencies=[Depends(require_manager)])
def delete_service(service_id: int, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    db.delete(service)
    db.commit()
    return None
