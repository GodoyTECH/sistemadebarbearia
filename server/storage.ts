import { users, profiles, services, appointments, standardDeductions, individualDeductions, type User, type Profile, type Service, type Appointment, type InsertAppointment, type StandardDeduction, type IndividualDeduction } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getProfile(userId: string): Promise<Profile | undefined>;
  createProfile(profile: any): Promise<Profile>;
  getServices(storeId?: number): Promise<Service[]>;
  getService(id: number, storeId?: number): Promise<Service | undefined>;
  createService(service: any): Promise<Service>;
  
  // Deductions
  getStandardDeductions(storeId?: number): Promise<StandardDeduction[]>;
  createStandardDeduction(deduction: any): Promise<StandardDeduction>;
  getIndividualDeductions(storeId?: number, professionalId?: string): Promise<IndividualDeduction[]>;
  createIndividualDeduction(deduction: any): Promise<IndividualDeduction>;

  // Appointments
  getAppointments(filters?: { storeId?: number; startDate?: string; endDate?: string; professionalId?: string }): Promise<any[]>;
  createAppointment(appt: InsertAppointment): Promise<Appointment>;
  updateAppointmentStatus(id: number, status: string): Promise<Appointment>;

  // Stats
  getStats(storeId?: number): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }

  async createProfile(profile: any): Promise<Profile> {
    const [newProfile] = await db.insert(profiles).values(profile).returning();
    return newProfile;
  }

  async getServices(storeId?: number): Promise<Service[]> {
    let query = db.select().from(services).orderBy(services.name);
    if (storeId) {
      return await query.where(eq(services.storeId, storeId));
    }
    return await query;
  }

  async getService(id: number, storeId?: number): Promise<Service | undefined> {
    const conditions = [eq(services.id, id)];
    if (storeId) conditions.push(eq(services.storeId, storeId));
    const [service] = await db.select().from(services).where(and(...conditions));
    return service;
  }

  async createService(service: any): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }

  async getStandardDeductions(storeId?: number): Promise<StandardDeduction[]> {
    const conditions = [eq(standardDeductions.active, true)];
    if (storeId) conditions.push(eq(standardDeductions.storeId, storeId));
    return await db.select().from(standardDeductions).where(and(...conditions));
  }

  async createStandardDeduction(deduction: any): Promise<StandardDeduction> {
    const [newDeduction] = await db.insert(standardDeductions).values(deduction).returning();
    return newDeduction;
  }

  async getIndividualDeductions(storeId?: number, professionalId?: string): Promise<IndividualDeduction[]> {
    const conditions = [];
    if (storeId) conditions.push(eq(individualDeductions.storeId, storeId));
    if (professionalId) conditions.push(eq(individualDeductions.professionalId, professionalId));
    if (conditions.length > 0) {
      return await db.select().from(individualDeductions).where(and(...conditions));
    }
    return await db.select().from(individualDeductions);
  }

  async createIndividualDeduction(deduction: any): Promise<IndividualDeduction> {
    const [newDeduction] = await db.insert(individualDeductions).values(deduction).returning();
    return newDeduction;
  }

  async getAppointments(filters?: { storeId?: number; startDate?: string; endDate?: string; professionalId?: string }): Promise<any[]> {
    let query = db.select({
      id: appointments.id,
      professionalId: appointments.professionalId,
      serviceId: appointments.serviceId,
      date: appointments.date,
      price: appointments.price,
      commissionRate: appointments.commissionRate,
      paymentMethod: appointments.paymentMethod,
      proofUrl: appointments.proofUrl,
      status: appointments.status,
      serviceName: services.name,
      professionalName: users.firstName,
    })
    .from(appointments)
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .leftJoin(users, eq(appointments.professionalId, users.id))
    .orderBy(desc(appointments.date));

    const conditions = [];
    if (filters?.storeId) conditions.push(eq(appointments.storeId, filters.storeId));
    if (filters?.startDate) conditions.push(gte(appointments.date, new Date(filters.startDate)));
    if (filters?.endDate) conditions.push(lte(appointments.date, new Date(filters.endDate)));
    if (filters?.professionalId) conditions.push(eq(appointments.professionalId, filters.professionalId));

    if (conditions.length > 0) {
      // @ts-ignore
      return await query.where(and(...conditions));
    }
    return await query;
  }

  async createAppointment(appt: InsertAppointment): Promise<Appointment> {
    const [newAppt] = await db.insert(appointments).values(appt).returning();
    return newAppt;
  }

  async updateAppointmentStatus(id: number, status: string): Promise<Appointment> {
    // @ts-ignore
    const [updated] = await db.update(appointments).set({ status }).where(eq(appointments.id, id)).returning();
    return updated;
  }

  async getStats(storeId?: number): Promise<any> {
    const appointmentConditions = storeId ? eq(appointments.storeId, storeId) : undefined;
    const profileConditions = storeId ? eq(profiles.storeId, storeId) : undefined;
    const allAppointments = appointmentConditions
      ? await db.select().from(appointments).where(appointmentConditions)
      : await db.select().from(appointments);
    const allUsers = await db.select().from(users);
    const allProfiles = profileConditions
      ? await db.select().from(profiles).where(profileConditions)
      : await db.select().from(profiles);
    const standardDeductionsList = await this.getStandardDeductions(storeId);
    const individualDeductionsList = storeId
      ? await db.select().from(individualDeductions).where(eq(individualDeductions.storeId, storeId))
      : await db.select().from(individualDeductions);

    const professionals = allProfiles
      .filter(p => p.role === 'professional')
      .map(profile => {
        const user = allUsers.find(u => u.id === profile.userId);
        const appts = allAppointments.filter(a => a.professionalId === profile.userId && a.status === 'confirmed');
        const indDeds = individualDeductionsList.filter(d => d.professionalId === profile.userId);

        const totalRevenue = appts.reduce((acc, curr) => acc + curr.price, 0);
        const grossCommission = appts.reduce((acc, curr) => acc + (curr.price * curr.commissionRate / 100), 0);
        const standardTotal = standardDeductionsList.reduce((acc, curr) => acc + curr.amount, 0);
        const individualTotal = indDeds.reduce((acc, curr) => acc + curr.amount, 0);
        const totalDeductions = standardTotal + individualTotal;
        const netPayable = grossCommission - totalDeductions;

        return {
          id: profile.userId,
          name: user?.firstName || 'Profissional',
          totalCuts: appts.length,
          totalRevenue,
          grossCommission,
          standardDeductions: standardTotal,
          individualDeductions: individualTotal,
          totalDeductions,
          netPayable
        };
      });

    const totalRevenue = professionals.reduce((acc, curr) => acc + curr.totalRevenue, 0);
    const totalCommission = professionals.reduce((acc, curr) => acc + curr.grossCommission, 0);
    const totalDeductions = professionals.reduce((acc, curr) => acc + curr.totalDeductions, 0);
    const netPayable = professionals.reduce((acc, curr) => acc + curr.netPayable, 0);

    return {
      totalCuts: allAppointments.filter(a => a.status === 'confirmed').length,
      totalRevenue,
      totalCommission,
      totalDeductions,
      netPayable,
      professionals
    };
  }
}

export const storage = new DatabaseStorage();
