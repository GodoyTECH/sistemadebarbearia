import { users, profiles, services, appointments, standardDeductions, individualDeductions, type User, type Profile, type Service, type Appointment, type InsertAppointment, type StandardDeduction, type IndividualDeduction } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getProfile(userId: string): Promise<Profile | undefined>;
  createProfile(profile: any): Promise<Profile>;
  getServices(): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  createService(service: any): Promise<Service>;
  getStandardDeductions(): Promise<StandardDeduction[]>;
  createStandardDeduction(deduction: any): Promise<StandardDeduction>;
  getIndividualDeductions(professionalId?: string): Promise<IndividualDeduction[]>;
  createIndividualDeduction(deduction: any): Promise<IndividualDeduction>;
  getAppointments(filters?: { startDate?: string; endDate?: string; professionalId?: string }): Promise<any[]>;
  createAppointment(appt: InsertAppointment): Promise<Appointment>;
  updateAppointmentStatus(id: number, status: string): Promise<Appointment>;
  getStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string) { const [user] = await db.select().from(users).where(eq(users.id, id)); return user; }
  async getProfile(userId: string) { const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)); return profile; }
  async createProfile(profile: any) { const [newProfile] = await db.insert(profiles).values(profile).returning(); return newProfile; }
  async getServices() { return db.select().from(services).orderBy(services.name); }
  async getService(id: number) { const [service] = await db.select().from(services).where(eq(services.id, id)); return service; }
  async createService(service: any) { const [newService] = await db.insert(services).values(service).returning(); return newService; }
  async getStandardDeductions() { return db.select().from(standardDeductions).where(eq(standardDeductions.active, true)); }
  async createStandardDeduction(deduction: any) { const [newDeduction] = await db.insert(standardDeductions).values(deduction).returning(); return newDeduction; }
  async getIndividualDeductions(professionalId?: string) { return professionalId ? db.select().from(individualDeductions).where(eq(individualDeductions.professionalId, professionalId)) : db.select().from(individualDeductions); }
  async createIndividualDeduction(deduction: any) { const [newDeduction] = await db.insert(individualDeductions).values(deduction).returning(); return newDeduction; }

  async getAppointments(filters?: { startDate?: string; endDate?: string; professionalId?: string }): Promise<any[]> {
    const query = db.select({
      id: appointments.id, professionalId: appointments.professionalId, serviceId: appointments.serviceId, date: appointments.date, customerName: appointments.customerName,
      price: appointments.price, commissionRate: appointments.commissionRate, paymentMethod: appointments.paymentMethod, proofUrl: appointments.proofUrl, status: appointments.status, possibleDuplicate: appointments.possibleDuplicate,
      serviceName: services.name, professionalName: users.firstName,
    }).from(appointments).leftJoin(services, eq(appointments.serviceId, services.id)).leftJoin(users, eq(appointments.professionalId, users.id)).orderBy(desc(appointments.date));

    const conditions = [] as any[];
    if (filters?.startDate) conditions.push(gte(appointments.date, new Date(filters.startDate)));
    if (filters?.endDate) conditions.push(lte(appointments.date, new Date(filters.endDate)));
    if (filters?.professionalId) conditions.push(eq(appointments.professionalId, filters.professionalId));
    // @ts-ignore
    return conditions.length ? query.where(and(...conditions)) : query;
  }

  async createAppointment(appt: InsertAppointment): Promise<Appointment> { const [newAppt] = await db.insert(appointments).values(appt as any).returning(); return newAppt; }
  async updateAppointmentStatus(id: number, status: string): Promise<Appointment> { const [updated] = await db.update(appointments).set({ status } as any).where(eq(appointments.id, id)).returning(); return updated; }

  async getStats() {
    const allAppointments = await db.select().from(appointments);
    const allUsers = await db.select().from(users);
    const allProfiles = await db.select().from(profiles);
    const standardDeductionsList = await this.getStandardDeductions();
    const individualDeductionsList = await db.select().from(individualDeductions);

    const professionals = allProfiles.filter((p) => p.role === "professional" && p.approvalStatus === "active").map((profile) => {
      const user = allUsers.find((u) => u.id === profile.userId);
      const appts = allAppointments.filter((a) => a.professionalId === profile.userId && a.status === "confirmed");
      const indDeds = individualDeductionsList.filter((d) => d.professionalId === profile.userId);
      const totalRevenue = appts.reduce((acc, curr) => acc + curr.price, 0);
      const grossCommission = appts.reduce((acc, curr) => acc + (curr.price * curr.commissionRate / 100), 0);
      const standardTotal = standardDeductionsList.reduce((acc, curr) => acc + curr.amount, 0);
      const individualTotal = indDeds.reduce((acc, curr) => acc + curr.amount, 0);
      const totalDeductions = standardTotal + individualTotal;
      return { id: profile.userId, name: user?.firstName || "Profissional", totalCuts: appts.length, totalRevenue, grossCommission, standardDeductions: standardTotal, individualDeductions: individualTotal, totalDeductions, netPayable: grossCommission - totalDeductions };
    });

    const totalRevenue = professionals.reduce((acc, curr) => acc + curr.totalRevenue, 0);
    const totalCommission = professionals.reduce((acc, curr) => acc + curr.grossCommission, 0);
    const totalDeductions = professionals.reduce((acc, curr) => acc + curr.totalDeductions, 0);
    const netPayable = professionals.reduce((acc, curr) => acc + curr.netPayable, 0);
    const pendingApprovals = allProfiles.filter((p) => p.role === "professional" && p.approvalStatus === "pending_approval").length;

    const revenueByDayMap = new Map<string, number>();
    allAppointments.filter((a) => a.status === "confirmed").forEach((a) => {
      const day = new Date(a.date ?? new Date()).toISOString().slice(0, 10);
      revenueByDayMap.set(day, (revenueByDayMap.get(day) || 0) + a.price);
    });

    const revenueByDay = Array.from(revenueByDayMap.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-7).map(([day, total]) => ({ day, total }));
    return { totalCuts: allAppointments.filter((a) => a.status === "confirmed").length, totalRevenue, totalCommission, totalDeductions, netPayable, pendingApprovals, professionals, revenueByDay };
  }
}

export const storage = new DatabaseStorage();
