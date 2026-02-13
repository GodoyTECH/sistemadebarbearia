import { pgTable, text, serial, integer, boolean, timestamp, varchar, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";
import { relations } from "drizzle-orm";

export * from "./models/auth";

export const roleEnum = pgEnum("role", ["manager", "professional"]);
export const serviceTypeEnum = pgEnum("service_type", ["male", "female", "general", "promo"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "card", "pix"]);
export const appointmentStatusEnum = pgEnum("appointment_status", ["pending", "confirmed", "rejected"]);

export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  storeCode: varchar("store_code", { length: 12 }).notNull().unique(),
  managerId: varchar("manager_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  storeId: integer("store_id").references(() => stores.id),
  role: roleEnum("role").default("professional").notNull(),
  cpf: text("cpf"),
  phone: text("phone"),
  isVerified: boolean("is_verified").default(false).notNull(),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: serviceTypeEnum("type").notNull(),
  price: integer("price").notNull(),
  commissionRate: integer("commission_rate").notNull(),
  active: boolean("active").default(true).notNull(),
  description: text("description"),
});

export const standardDeductions = pgTable("standard_deductions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  amount: integer("amount").notNull(),
  active: boolean("active").default(true).notNull(),
});

export const individualDeductions = pgTable("individual_deductions", {
  id: serial("id").primaryKey(),
  professionalId: varchar("professional_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  amount: integer("amount").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  reason: text("reason"),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  professionalId: varchar("professional_id").notNull().references(() => users.id),
  serviceId: integer("service_id").notNull().references(() => services.id),
  date: timestamp("date").defaultNow().notNull(),
  customerName: text("customer_name").notNull(),
  price: integer("price").notNull(),
  commissionRate: integer("commission_rate").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  transactionId: text("transaction_id"),
  proofUrl: text("proof_url"),
  status: appointmentStatusEnum("status").default("pending").notNull(),
  possibleDuplicate: boolean("possible_duplicate").default(false).notNull(),
});

export const storesRelations = relations(stores, ({ one, many }) => ({
  manager: one(users, {
    fields: [stores.managerId],
    references: [users.id],
  }),
  profiles: many(profiles),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
  store: one(stores, {
    fields: [profiles.storeId],
    references: [stores.id],
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

export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, userId: true, storeId: true });
export const insertServiceSchema = createInsertSchema(services).omit({ id: true });
export const insertStandardDeductionSchema = createInsertSchema(standardDeductions).omit({ id: true });
export const insertIndividualDeductionSchema = createInsertSchema(individualDeductions).omit({ id: true, date: true });
export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  professionalId: true,
  date: true,
  status: true,
  commissionRate: true,
  possibleDuplicate: true,
});

export type Store = typeof stores.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Service = typeof services.$inferSelect;
export type StandardDeduction = typeof standardDeductions.$inferSelect;
export type IndividualDeduction = typeof individualDeductions.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
