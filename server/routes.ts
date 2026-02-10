import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, isAuthenticated } from "./replit_integrations/auth";
import { registerAuthRoutes } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { db } from "./db";
import { profiles, salons, users } from "@shared/schema";
import { and, eq } from "drizzle-orm";
import crypto from "crypto";

const DAY_IN_MS = 1000 * 60 * 60 * 24;

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(key, "hex"), Buffer.from(derivedKey, "hex"));
}

async function generateStoreNumber() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const storeNumber = crypto.randomInt(100000, 999999).toString();
    const existing = await db.select({ id: salons.id }).from(salons).where(eq(salons.storeNumber, storeNumber));
    if (existing.length === 0) {
      return storeNumber;
    }
  }
  return crypto.randomInt(100000, 999999).toString();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);
  registerObjectStorageRoutes(app);

  // === API Routes ===
  app.get(api.health.check.path, (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post(api.auth.register.path, async (req: any, res) => {
    const input = api.auth.register.input.parse(req.body);
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email));
    if (existing.length > 0) {
      return res.status(409).json({ message: "E-mail já cadastrado", field: "email" });
    }

    let storeId: number | null = null;
    let storeNumber: string | null = null;
    if (input.role === "manager") {
      if (!input.storeName) {
        return res.status(400).json({ message: "Informe o nome do salão", field: "storeName" });
      }
      storeNumber = await generateStoreNumber();
    } else {
      if (!input.storeNumber) {
        return res.status(400).json({ message: "Informe o número do salão", field: "storeNumber" });
      }
      const [store] = await db.select().from(salons).where(eq(salons.storeNumber, input.storeNumber));
      if (!store) {
        return res.status(400).json({ message: "Número do salão inválido", field: "storeNumber" });
      }
      storeId = store.id;
    }

    const [firstName, ...rest] = input.name.trim().split(/\s+/);
    const lastName = rest.join(" ") || null;
    const passwordHash = hashPassword(input.password);

    const [user] = await db
      .insert(users)
      .values({
        email: input.email,
        firstName,
        lastName,
        passwordHash,
      })
      .returning();

    if (input.role === "manager") {
      const [newSalon] = await db
        .insert(salons)
        .values({
          storeNumber: storeNumber!,
          storeName: input.storeName!,
          managerUserId: user.id,
        })
        .returning();
      storeId = newSalon.id;
    }

    const [profile] = await db
      .insert(profiles)
      .values({
        userId: user.id,
        storeId: storeId!,
        phone: input.phone,
        role: input.role,
      })
      .returning();

    req.session.userId = user.id;
    req.session.cookie.maxAge = DAY_IN_MS * 7;
    const store = await db.select().from(salons).where(eq(salons.id, storeId!));
    res.status(201).json({ user, profile, store: store[0] });
  });

  app.post(api.auth.login.path, async (req: any, res) => {
    const input = api.auth.login.input.parse(req.body);
    const [user] = await db.select().from(users).where(eq(users.email, input.email));

    if (!user?.passwordHash || !verifyPassword(input.password, user.passwordHash)) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.id));
    if (profile?.role === "professional") {
      if (!input.storeNumber) {
        return res.status(400).json({ message: "Informe o número do salão", field: "storeNumber" });
      }
      const [store] = await db.select().from(salons).where(eq(salons.id, profile.storeId));
      if (!store || store.storeNumber !== input.storeNumber) {
        return res.status(401).json({ message: "Número do salão inválido" });
      }
    }

    req.session.userId = user.id;
    req.session.cookie.maxAge = input.keepConnected ? DAY_IN_MS * 7 : DAY_IN_MS;
    res.json({ ok: true });
  });

  app.post(api.auth.logout.path, (req: any, res) => {
    if (req.session) {
      req.session.destroy(() => {
        res.json({ ok: true });
      });
      return;
    }
    res.json({ ok: true });
  });

  app.get(api.auth.me.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    const profile = await storage.getProfile(userId);
    const store = profile ? await db.select().from(salons).where(eq(salons.id, profile.storeId)) : [];
    res.json({ user, profile, store: store[0] ?? null });
  });

  app.post(api.auth.updateProfile.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const existingProfile = await storage.getProfile(userId);
    if (!existingProfile) {
      return res.status(400).json({ message: "Perfil não encontrado" });
    }
    const input = api.auth.updateProfile.input.parse(req.body);
    const profile = await storage.createProfile({ ...input, userId, storeId: existingProfile.storeId }).catch(() => null);
    if (!profile) {
      return res.status(500).json({ message: "Failed to update profile" });
    }
    res.json(profile);
  });

  // Services
  app.get(api.services.list.path, isAuthenticated, async (req, res) => {
    const userId = (req as any).user?.claims?.sub;
    const profile = await storage.getProfile(userId);
    const srvs = await storage.getServices(profile?.storeId);
    res.json(srvs);
  });

  app.post(api.services.create.path, isAuthenticated, async (req, res) => {
    const input = api.services.create.input.parse(req.body);
    const userId = (req as any).user?.claims?.sub;
    const profile = await storage.getProfile(userId);
    if (!profile) return res.status(400).json({ message: "Perfil não encontrado" });
    const srv = await storage.createService({ ...input, storeId: profile.storeId });
    res.status(201).json(srv);
  });

  // Deductions
  app.get(api.deductions.standard.list.path, isAuthenticated, async (req, res) => {
    const userId = (req as any).user?.claims?.sub;
    const profile = await storage.getProfile(userId);
    const deds = await storage.getStandardDeductions(profile?.storeId);
    res.json(deds);
  });

  app.post(api.deductions.standard.create.path, isAuthenticated, async (req, res) => {
    const input = api.deductions.standard.create.input.parse(req.body);
    const userId = (req as any).user?.claims?.sub;
    const profile = await storage.getProfile(userId);
    if (!profile) return res.status(400).json({ message: "Perfil não encontrado" });
    const ded = await storage.createStandardDeduction({ ...input, storeId: profile.storeId });
    res.status(201).json(ded);
  });

  app.get(api.deductions.individual.list.path, isAuthenticated, async (req, res) => {
    const profId = req.query.professionalId as string | undefined;
    const userId = (req as any).user?.claims?.sub;
    const profile = await storage.getProfile(userId);
    const deds = await storage.getIndividualDeductions(profile?.storeId, profId);
    res.json(deds);
  });

  app.post(api.deductions.individual.create.path, isAuthenticated, async (req, res) => {
    const input = api.deductions.individual.create.input.parse(req.body);
    const userId = (req as any).user?.claims?.sub;
    const profile = await storage.getProfile(userId);
    if (!profile) return res.status(400).json({ message: "Perfil não encontrado" });
    const ded = await storage.createIndividualDeduction({ ...input, storeId: profile.storeId });
    res.status(201).json(ded);
  });

  // Appointments
  app.get(api.appointments.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    let filters: any = { storeId: profile?.storeId };
    if (req.query.startDate) filters.startDate = req.query.startDate;
    if (req.query.endDate) filters.endDate = req.query.endDate;
    if (profile?.role === 'professional') {
      filters.professionalId = userId;
    } else if (req.query.professionalId) {
      filters.professionalId = req.query.professionalId;
    }
    const appts = await storage.getAppointments(filters);
    res.json(appts);
  });

  app.post(api.appointments.create.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    if (!profile) return res.status(400).json({ message: "Perfil não encontrado" });
    const input = api.appointments.create.input.parse(req.body);
    const service = await storage.getService(input.serviceId, profile.storeId);
    if (!service) return res.status(404).json({ message: "Service not found" });

    const appt = await storage.createAppointment({
      ...input,
      professionalId: userId,
      storeId: profile.storeId,
      price: service.price,
      commissionRate: service.commissionRate,
      status: 'pending'
    });
    res.status(201).json(appt);
  });

  // Stats
  app.get(api.stats.get.path, isAuthenticated, async (req, res) => {
    const userId = (req as any).user?.claims?.sub;
    const profile = await storage.getProfile(userId);
    const stats = await storage.getStats(profile?.storeId);
    res.json(stats);
  });

  return httpServer;
}
