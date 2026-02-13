import { pgTable, text, serial, integer, boolean, timestamp, varchar, pgEnum, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";
import { relations } from "drizzle-orm";

export * from "./models/auth";

export const roleEnum = pgEnum("role", ["manager", "professional"]);
export const serviceTypeEnum = pgEnum("service_type", ["male", "female", "general", "promo"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "card", "pix"]);
export const appointmentStatusEnum = pgEnum("appointment_status", ["pending", "confirmed", "rejected"]);
export const professionalApprovalStatusEnum = pgEnum("professional_approval_status", ["pending_approval", "active", "rejected"]);
export const uploadTypeEnum = pgEnum("upload_type", ["profile", "receipt"]);

export const shops = pgTable("shops", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: varchar("code", { length: 12 }).notNull(),
  managerUserId: varchar("manager_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [uniqueIndex("shops_code_unique").on(t.code)]);

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  shopId: integer("shop_id").references(() => shops.id),
  role: roleEnum("role").default("professional").notNull(),
  phone: text("phone"),
  isVerified: boolean("is_verified").default(false).notNull(),
  approvalStatus: professionalApprovalStatusEnum("approval_status").default("active").notNull(),
  approvedByUserId: varchar("approved_by_user_id").references(() => users.id),
  approvalAt: timestamp("approval_at"),
  rejectionAt: timestamp("rejection_at"),
  availability: boolean("availability").default(true).notNull(),
}, (t) => [
  uniqueIndex("profiles_user_id_unique").on(t.userId),
  index("profiles_shop_id_idx").on(t.shopId),
]);

export const professionalApprovals = pgTable("professional_approvals", {
  id: serial("id").primaryKey(),
  professionalUserId: varchar("professional_user_id").notNull().references(() => users.id),
  managerUserId: varchar("manager_user_id").notNull().references(() => users.id),
  action: varchar("action", { length: 16 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [index("professional_approvals_professional_idx").on(t.professionalUserId)]);

export const mediaUploads = pgTable("media_uploads", {
  id: serial("id").primaryKey(),
  type: uploadTypeEnum("type").notNull(),
  shopId: integer("shop_id").references(() => shops.id),
  professionalUserId: varchar("professional_user_id").references(() => users.id),
  appointmentId: integer("appointment_id"),
  secureUrl: text("secure_url").notNull(),
  publicId: text("public_id").notNull(),
  assetId: text("asset_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
  shop: one(shops, { fields: [profiles.shopId], references: [shops.id] }),
}));

export const shopsRelations = relations(shops, ({ one }) => ({
  manager: one(users, { fields: [shops.managerUserId], references: [users.id] }),
}));

export const individualDeductionsRelations = relations(individualDeductions, ({ one }) => ({
  professional: one(users, { fields: [individualDeductions.professionalId], references: [users.id] }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  professional: one(users, { fields: [appointments.professionalId], references: [users.id] }),
  service: one(services, { fields: [appointments.serviceId], references: [services.id] }),
}));

export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, userId: true, approvalStatus: true, approvedByUserId: true, approvalAt: true, rejectionAt: true });
export const insertServiceSchema = createInsertSchema(services).omit({ id: true });
export const insertStandardDeductionSchema = createInsertSchema(standardDeductions).omit({ id: true });
export const insertIndividualDeductionSchema = createInsertSchema(individualDeductions).omit({ id: true, date: true });
export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true, professionalId: true, date: true, status: true, commissionRate: true, possibleDuplicate: true });

export type Profile = typeof profiles.$inferSelect;
export type Shop = typeof shops.$inferSelect;
export type Service = typeof services.$inferSelect;
export type StandardDeduction = typeof standardDeductions.$inferSelect;
export type IndividualDeduction = typeof individualDeductions.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
