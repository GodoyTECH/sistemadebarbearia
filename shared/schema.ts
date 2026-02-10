import { pgTable, text, serial, integer, boolean, timestamp, numeric, varchar, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";
import { relations } from "drizzle-orm";

// Export auth models so they are picked up by Drizzle
export * from "./models/auth";

// Enums
export const roleEnum = pgEnum("role", ["manager", "professional"]);
export const serviceTypeEnum = pgEnum("service_type", ["male", "female", "general", "promo"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "card", "pix"]);
export const appointmentStatusEnum = pgEnum("appointment_status", ["pending", "confirmed", "rejected"]);

export const salons = pgTable("salons", {
  id: serial("id").primaryKey(),
  storeNumber: varchar("store_number", { length: 10 }).notNull().unique(),
  storeName: text("store_name").notNull(),
  managerUserId: varchar("manager_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Profiles table (extends auth users)
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  storeId: integer("store_id").notNull().references(() => salons.id),
  role: roleEnum("role").default("professional").notNull(),
  cpf: text("cpf"),
  phone: text("phone"),
  isVerified: boolean("is_verified").default(false).notNull(),
});

// Services (Types of cuts/promotions)
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => salons.id),
  name: text("name").notNull(),
  type: serviceTypeEnum("type").notNull(),
  price: integer("price").notNull(), // in cents
  commissionRate: integer("commission_rate").notNull(), // percentage (e.g. 30 for 30%)
  active: boolean("active").default(true).notNull(),
  description: text("description"),
});

// Global/Standard Deductions (Descontos Padrão)
export const standardDeductions = pgTable("standard_deductions", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => salons.id),
  name: text("name").notNull(),
  amount: integer("amount").notNull(), // in cents
  active: boolean("active").default(true).notNull(),
});

// Individual Deductions (Descontos Únicos/Vales)
export const individualDeductions = pgTable("individual_deductions", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => salons.id),
  professionalId: varchar("professional_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  amount: integer("amount").notNull(), // in cents
  date: timestamp("date").defaultNow().notNull(),
  reason: text("reason"),
});

// Appointments/Cuts
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => salons.id),
  professionalId: varchar("professional_id").notNull().references(() => users.id),
  serviceId: integer("service_id").notNull().references(() => services.id),
  date: timestamp("date").defaultNow().notNull(),
  customerName: text("customer_name").notNull(),
  price: integer("price").notNull(), // Snapshot of price at time of service
  commissionRate: integer("commission_rate").notNull(), // Snapshot
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  transactionId: text("transaction_id"),
  proofUrl: text("proof_url"), // For pix/card
  status: appointmentStatusEnum("status").default("pending").notNull(),
  possibleDuplicate: boolean("possible_duplicate").default(false).notNull(),
});

// Relations
export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const individualDeductionsRelations = relations(individualDeductions, ({ one }) => ({
  professional: one(users, {
    fields: [individualDeductions.professionalId],
    references: [users.id],
  }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  professional: one(users, {
    fields: [appointments.professionalId],
    references: [users.id],
  }),
  service: one(services, {
    fields: [appointments.serviceId],
    references: [services.id],
  }),
}));

// Schemas
export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, userId: true, storeId: true });
export const insertServiceSchema = createInsertSchema(services).omit({ id: true, storeId: true });
export const insertStandardDeductionSchema = createInsertSchema(standardDeductions).omit({ id: true, storeId: true });
export const insertIndividualDeductionSchema = createInsertSchema(individualDeductions).omit({ id: true, storeId: true, date: true });
export const insertAppointmentSchema = createInsertSchema(appointments).omit({ 
  id: true, 
  storeId: true,
  professionalId: true, 
  date: true,
  status: true,
  commissionRate: true,
  possibleDuplicate: true
});

// Types
export type Profile = typeof profiles.$inferSelect;
export type Service = typeof services.$inferSelect;
export type StandardDeduction = typeof standardDeductions.$inferSelect;
export type IndividualDeduction = typeof individualDeductions.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
