from datetime import datetime, timedelta
from collections import defaultdict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_manager, get_current_user
from app.models.user import User
from app.models.appointment import Appointment
from app.schemas.stats import StatsResponse, ProfessionalStats, RevenueByDay

router = APIRouter(prefix="/api/stats", tags=["stats"], dependencies=[Depends(require_manager)])


@router.get("", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    appointments = db.query(Appointment).filter(Appointment.store_id == user.store_id).all()

    total_cuts = len(appointments)
    total_revenue = sum(a.price for a in appointments if a.status == "confirmed")
    total_commission = sum(int(a.price * a.commission_rate / 100) for a in appointments if a.status == "confirmed")
    pending_approvals = sum(1 for a in appointments if a.status == "pending")

    professionals: dict[str, ProfessionalStats] = {}
    for appt in appointments:
        user_obj = db.query(User).filter(User.id == appt.professional_id).first()
        name = user_obj.first_name if user_obj else "Profissional"
        prof = professionals.get(appt.professional_id)
        if not prof:
            prof = ProfessionalStats(
                id=appt.professional_id,
                name=name,
                totalCuts=0,
                totalRevenue=0,
                grossCommission=0,
                standardDeductions=0,
                individualDeductions=0,
                totalDeductions=0,
                netPayable=0,
            )
            professionals[appt.professional_id] = prof
        prof.totalCuts += 1
        if appt.status == "confirmed":
            prof.totalRevenue += appt.price
            prof.grossCommission += int(appt.price * appt.commission_rate / 100)

    for prof in professionals.values():
        prof.totalDeductions = prof.standardDeductions + prof.individualDeductions
        prof.netPayable = prof.grossCommission - prof.totalDeductions

    revenue_by_day: list[RevenueByDay] = []
    today = datetime.utcnow().date()
    daily_map = defaultdict(int)
    for appt in appointments:
        if appt.status != "confirmed":
            continue
        day_key = appt.date.date()
        daily_map[day_key] += appt.price

    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        revenue_by_day.append(RevenueByDay(day=day.strftime("%d/%m"), total=daily_map.get(day, 0)))

    total_deductions = 0
    net_payable = total_commission - total_deductions

    return StatsResponse(
        totalCuts=total_cuts,
        totalRevenue=total_revenue,
        totalCommission=total_commission,
        totalDeductions=total_deductions,
        netPayable=net_payable,
        pendingApprovals=pending_approvals,
        professionals=list(professionals.values()),
        revenueByDay=revenue_by_day,
    )
