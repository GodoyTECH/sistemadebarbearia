import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth, isAuthenticated } from "./auth";
import { db } from "./db";
import { profiles, stores, users } from "@shared/schema";
import { eq } from "drizzle-orm";
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

function generateStoreCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

async function generateUniqueStoreCode() {
  for (let i = 0; i < 10; i++) {
    const candidate = generateStoreCode();
    const existing = await db.select({ id: stores.id }).from(stores).where(eq(stores.storeCode, candidate));
    if (existing.length === 0) return candidate;
  }

  throw new Error("Não foi possível gerar o ID da loja.");
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  setupAuth(app);

  app.get(api.health.check.path, (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post(api.auth.register.path, async (req: any, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);

      if (input.role === "manager") {
        if (!input.storeName) {
          return res.status(400).json({ message: "Informe o nome da loja para continuar." });
        }

        if (!input.email.endsWith("@luxic.com")) {
          return res.status(400).json({ message: "Use um e-mail com domínio @luxic.com." });
        }

        if (input.password.length < 8 || !/^[A-Za-z0-9]+$/.test(input.password)) {
          return res.status(400).json({ message: "A senha deve ter ao menos 8 caracteres e usar apenas letras e números." });
        }
      }

      const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email));
      if (existing.length > 0) {
        return res.status(409).json({ message: "E-mail já cadastrado.", field: "email" });
      }

      const [firstName, ...rest] = input.name.trim().split(/\s+/);
      const lastName = rest.join(" ") || null;
      const passwordHash = hashPassword(input.password);

      const result = await db.transaction(async (tx) => {
        const [user] = await tx
          .insert(users)
          .values({
            email: input.email,
            firstName,
            lastName,
            passwordHash,
          })
          .returning();

        const [profile] = await tx
          .insert(profiles)
          .values({
            userId: user.id,
            phone: input.phone,
            role: input.role,
          })
          .returning();

        let store = null;

        if (input.role === "manager" && input.storeName) {
          const storeCode = await generateUniqueStoreCode();

          [store] = await tx
            .insert(stores)
            .values({
              name: input.storeName,
              storeCode,
              managerId: user.id,
            })
            .returning();

          await tx.update(profiles).set({ storeId: store.id }).where(eq(profiles.id, profile.id));
          profile.storeId = store.id;
        }

        return { user, profile, store };
      });

      req.session.userId = result.user.id;
      req.session.cookie.maxAge = DAY_IN_MS * 7;
      res.status(201).json(result);
    } catch (_err) {
      res.status(400).json({ message: "Não foi possível concluir o cadastro." });
    }
  });

  app.post(api.auth.login.path, async (req: any, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      const [user] = await db.select().from(users).where(eq(users.email, input.email));

      if (!user?.passwordHash || !verifyPassword(input.password, user.passwordHash)) {
        return res.status(401).json({ message: "E-mail ou senha inválidos." });
      }

      req.session.userId = user.id;
      req.session.cookie.maxAge = input.keepConnected ? DAY_IN_MS * 7 : DAY_IN_MS;
      res.json({ ok: true });
    } catch (_err) {
      res.status(400).json({ message: "Não foi possível fazer login." });
    }
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

  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    const user = await storage.getUser(req.authUserId);
    res.json(user);
  });

  app.get(api.auth.me.path, isAuthenticated, async (req: any, res) => {
    const userId = req.authUserId;
    const user = await storage.getUser(userId);
    const profile = await storage.getProfile(userId);

    const store = profile?.storeId
      ? (await db.select().from(stores).where(eq(stores.id, profile.storeId)))[0] ?? null
      : null;

    res.json({ user, profile, store });
  });

  app.post(api.auth.updateProfile.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const input = api.auth.updateProfile.input.parse(req.body);
      const profile = await storage.createProfile({ ...input, userId });
      res.json(profile);
    } catch (_err) {
      res.status(500).json({ message: "Não foi possível atualizar o perfil." });
    }
  });

  app.post("/api/uploads/request-url", (_req, res) => {
    res.status(501).json({ message: "Upload de imagem será disponibilizado em breve." });
  });

  app.get(api.services.list.path, isAuthenticated, async (_req, res) => {
    const srvs = await storage.getServices();
    res.json(srvs);
  });

  app.post(api.services.create.path, isAuthenticated, async (req, res) => {
    const input = api.services.create.input.parse(req.body);
    const srv = await storage.createService(input);
    res.status(201).json(srv);
  });

  app.get(api.deductions.standard.list.path, isAuthenticated, async (_req, res) => {
    const deds = await storage.getStandardDeductions();
    res.json(deds);
  });

  app.post(api.deductions.standard.create.path, isAuthenticated, async (req, res) => {
    const input = api.deductions.standard.create.input.parse(req.body);
    const ded = await storage.createStandardDeduction(input);
    res.status(201).json(ded);
  });

  app.get(api.deductions.individual.list.path, isAuthenticated, async (req, res) => {
    const profId = req.query.professionalId as string | undefined;
    const deds = await storage.getIndividualDeductions(profId);
    res.json(deds);
  });

  app.post(api.deductions.individual.create.path, isAuthenticated, async (req, res) => {
    const input = api.deductions.individual.create.input.parse(req.body);
    const ded = await storage.createIndividualDeduction(input);
    res.status(201).json(ded);
  });

  app.get(api.appointments.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.authUserId;
    const profile = await storage.getProfile(userId);

    const filters: any = {};
    if (req.query.startDate) filters.startDate = req.query.startDate;
    if (req.query.endDate) filters.endDate = req.query.endDate;

    if (profile?.role === "professional") {
      filters.professionalId = userId;
    } else if (req.query.professionalId) {
      filters.professionalId = req.query.professionalId;
    }

    const appts = await storage.getAppointments(filters);
    res.json(appts);
  });

  app.post(api.appointments.create.path, isAuthenticated, async (req: any, res) => {
    const userId = req.authUserId;
    const input = api.appointments.create.input.parse(req.body);

    const service = await storage.getService(input.serviceId);
    if (!service) return res.status(404).json({ message: "Serviço não encontrado." });

    const appt = await storage.createAppointment({
      ...input,
      professionalId: userId,
      price: service.price,
      commissionRate: service.commissionRate,
      status: "pending",
    });

    res.status(201).json(appt);
  });

  app.get(api.stats.get.path, isAuthenticated, async (_req, res) => {
    const stats = await storage.getStats();
    res.json(stats);
  });

  return httpServer;
}
