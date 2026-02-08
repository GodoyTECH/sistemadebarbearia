from pydantic import BaseModel


class ProfessionalStats(BaseModel):
    id: str
    name: str
    totalCuts: int
    totalRevenue: int
    grossCommission: int
    standardDeductions: int
    individualDeductions: int
    totalDeductions: int
    netPayable: int


class RevenueByDay(BaseModel):
    day: str
    total: int


class StatsResponse(BaseModel):
    totalCuts: int
    totalRevenue: int
    totalCommission: int
    totalDeductions: int
    netPayable: int
    pendingApprovals: int
    professionals: list[ProfessionalStats]
    revenueByDay: list[RevenueByDay]
