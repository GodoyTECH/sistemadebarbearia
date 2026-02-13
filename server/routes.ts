import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth, isAuthenticated } from "./auth";
import { db } from "./db";
import { mediaUploads, professionalApprovals, profiles, shops, users, services } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
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

function ensureLuxeEmail(emailOrPrefix: string) {
  if (emailOrPrefix.includes("@")) return emailOrPrefix.toLowerCase();
  return `${emailOrPrefix.toLowerCase()}@luxe.com`;
}

function validatePassword(password: string) {
  return /^[A-Za-z0-9]{8,}$/.test(password);
}

async function generateUniqueShopCode() {
  for (let i = 0; i < 10; i += 1) {
    const code = `LX-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const existing = await db.select({ id: shops.id }).from(shops).where(eq(shops.code, code));
    if (existing.length === 0) return code;
  }
  throw new Error("Falha ao gerar código único da loja.");
}

async function uploadToCloudinary(dataBase64: string, folder: string) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) throw new Error("Cloudinary não configurado.");

  const timestamp = Math.floor(Date.now() / 1000);
  const signatureBase = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(signatureBase).digest("hex");

  const body = new URLSearchParams({ file: dataBase64, folder, timestamp: String(timestamp), api_key: apiKey, signature });
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body });
  if (!response.ok) throw new Error("Falha no upload para Cloudinary.");
  return response.json() as Promise<{ secure_url: string; public_id: string; asset_id: string }>;
}

async function requireProfile(req: any, res: any) {
  const profile = await storage.getProfile(req.authUserId);
  if (!profile) {
    res.status(403).json({ message: "Perfil não encontrado." });
    return null;
  }
  return profile;
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  setupAuth(app);

  app.get(api.health.check.path, (_req, res) => res.json({ status: "ok" }));

  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    const user = await storage.getUser(req.authUserId);
    res.json(user);
  });

  app.post(api.auth.register.path, async (req: any, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      if (input.password !== input.confirmPassword) return res.status(400).json({ message: "A confirmação de senha deve ser igual à senha.", field: "confirmPassword" });
      if (!validatePassword(input.password)) return res.status(400).json({ message: "Senha inválida. Use no mínimo 8 caracteres com apenas letras e números.", field: "password" });

      if (input.role === "manager") {
        const email = ensureLuxeEmail(input.emailPrefix);
        if (!email.endsWith("@luxe.com")) return res.status(400).json({ message: "Use um e-mail com domínio @luxe.com.", field: "email" });

        const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
        if (existing.length > 0) return res.status(409).json({ message: "E-mail já cadastrado.", field: "email" });

        const [firstName, ...rest] = input.managerName.trim().split(/\s+/);
        const [user] = await db.insert(users).values({ email, firstName, lastName: rest.join(" ") || null, passwordHash: hashPassword(input.password) }).returning();

        const [shop] = await db.insert(shops).values({ name: input.shopName.trim(), code: await generateUniqueShopCode(), managerUserId: user.id }).returning();

        const [profile] = await db.insert(profiles).values({ userId: user.id, phone: input.phone, role: "manager", shopId: shop.id, approvalStatus: "active", approvalAt: new Date() }).returning();

        req.session.userId = user.id;
        req.session.cookie.maxAge = DAY_IN_MS * 7;
        return res.status(201).json({ user, profile, shop });
      }

      const email = ensureLuxeEmail(input.emailPrefix);
      if (!email.endsWith("@luxe.com")) return res.status(400).json({ message: "Use um e-mail com domínio @luxe.com.", field: "email" });
      const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
      if (existing.length > 0) return res.status(409).json({ message: "E-mail já cadastrado.", field: "email" });

      const [shop] = await db.select().from(shops).where(eq(shops.code, input.shopCode.trim().toUpperCase()));
      if (!shop) return res.status(404).json({ message: "ID da loja não encontrado.", field: "shopCode" });

      const [firstName, ...rest] = input.name.trim().split(/\s+/);
      const [user] = await db.insert(users).values({ email, firstName, lastName: rest.join(" ") || null, passwordHash: hashPassword(input.password) }).returning();
      const [profile] = await db.insert(profiles).values({ userId: user.id, shopId: shop.id, phone: input.phone, role: "professional", approvalStatus: "pending_approval" }).returning();

      return res.status(201).json({ user, profile, shop, message: "Cadastro recebido. Aguarde aprovação do gerente." });
    } catch {
      return res.status(400).json({ message: "Não foi possível concluir o cadastro." });
    }
  });

  app.post(api.auth.login.path, async (req: any, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      const [user] = await db.select().from(users).where(eq(users.email, input.email.toLowerCase()));
      if (!user?.passwordHash || !verifyPassword(input.password, user.passwordHash)) return res.status(401).json({ message: "E-mail ou senha inválidos." });

      const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.id));
      if (profile?.role === "professional") {
        if (profile.approvalStatus === "pending_approval") return res.status(403).json({ message: "Seu cadastro ainda está pendente de aprovação pelo gerente." });
        if (profile.approvalStatus === "rejected") return res.status(403).json({ message: "Seu cadastro foi recusado pelo gerente da loja." });
      }

      req.session.userId = user.id;
      req.session.cookie.maxAge = input.keepConnected ? DAY_IN_MS * 7 : DAY_IN_MS;
      return res.json({ ok: true, userId: user.id });
    } catch {
      return res.status(400).json({ message: "Não foi possível fazer login." });
    }
  });

  app.post(api.auth.logout.path, (req: any, res) => req.session ? req.session.destroy(() => res.json({ ok: true })) : res.json({ ok: true }));

  app.get(api.auth.me.path, isAuthenticated, async (req: any, res) => {
    const user = await storage.getUser(req.authUserId);
    const profile = await storage.getProfile(req.authUserId);
    const [shop] = profile?.shopId ? await db.select().from(shops).where(eq(shops.id, profile.shopId)) : [null];
    res.json({ user, profile, shop: shop ?? null });
  });

  app.get(api.approvals.pending.path, isAuthenticated, async (req: any, res) => {
    const profile = await requireProfile(req, res); if (!profile) return;
    if (profile.role !== "manager" || !profile.shopId) return res.status(403).json({ message: "Acesso permitido apenas ao gerente." });

    const rows = await db.select({
      userId: users.id, name: sql<string>`concat(${users.firstName}, ' ', coalesce(${users.lastName}, ''))`, email: users.email, phone: profiles.phone, createdAt: users.createdAt,
    }).from(profiles).innerJoin(users, eq(users.id, profiles.userId)).where(and(eq(profiles.shopId, profile.shopId), eq(profiles.role, "professional"), eq(profiles.approvalStatus, "pending_approval"))).orderBy(desc(users.createdAt));
    res.json(rows);
  });

  app.post("/api/professionals/:professionalUserId/decision", isAuthenticated, async (req: any, res) => {
    const managerProfile = await requireProfile(req, res); if (!managerProfile) return;
    if (managerProfile.role !== "manager" || !managerProfile.shopId) return res.status(403).json({ message: "Apenas gerente pode aprovar profissionais." });

    const parsed = api.approvals.decide.input.parse(req.body);
    const targetUserId = req.params.professionalUserId;
    const [professional] = await db.select().from(profiles).where(and(eq(profiles.userId, targetUserId), eq(profiles.shopId, managerProfile.shopId), eq(profiles.role, "professional")));
    if (!professional) return res.status(404).json({ message: "Profissional não encontrado para esta loja." });

    const patch = parsed.action === "approve"
      ? { approvalStatus: "active" as const, approvedByUserId: req.authUserId, approvalAt: new Date(), rejectionAt: null }
      : { approvalStatus: "rejected" as const, approvedByUserId: req.authUserId, rejectionAt: new Date(), approvalAt: null };

    const [updated] = await db.update(profiles).set(patch).where(eq(profiles.userId, targetUserId)).returning();
    await db.insert(professionalApprovals).values({ professionalUserId: targetUserId, managerUserId: req.authUserId, action: parsed.action });
    res.json({ profile: updated, message: parsed.action === "approve" ? "Profissional aprovado com sucesso." : "Profissional recusado." });
  });

  app.patch("/api/professional/availability", isAuthenticated, async (req: any, res) => {
    const profile = await requireProfile(req, res); if (!profile) return;
    if (profile.role !== "professional") return res.status(403).json({ message: "Apenas profissional pode alterar disponibilidade." });
    const availability = Boolean(req.body?.availability);
    const [updated] = await db.update(profiles).set({ availability }).where(eq(profiles.userId, req.authUserId)).returning();
    res.json(updated);
  });

  app.post("/api/uploads", isAuthenticated, async (req: any, res) => {
    try {
      const profile = await requireProfile(req, res); if (!profile) return;
      const { type, dataBase64, appointmentId } = req.body as { type: "profile" | "receipt"; dataBase64: string; appointmentId?: number };
      if (!type || !dataBase64) return res.status(400).json({ message: "Dados de upload inválidos." });
      const shopId = profile.shopId;
      if (!shopId) return res.status(400).json({ message: "Perfil sem loja vinculada." });
      const folder = type === "profile" ? `salons/${shopId}/professionals/${req.authUserId}/profile` : `salons/${shopId}/payments/${req.authUserId}/receipts`;
      const cloudinary = await uploadToCloudinary(dataBase64, folder);
      await db.insert(mediaUploads).values({ type, shopId, professionalUserId: req.authUserId, appointmentId: appointmentId ?? null, secureUrl: cloudinary.secure_url, publicId: cloudinary.public_id, assetId: cloudinary.asset_id });
      if (type === "profile") await db.update(users).set({ profileImageUrl: cloudinary.secure_url, updatedAt: new Date() }).where(eq(users.id, req.authUserId));
      res.status(201).json({ secure_url: cloudinary.secure_url, public_id: cloudinary.public_id, asset_id: cloudinary.asset_id });
    } catch {
      res.status(500).json({ message: "Não foi possível realizar o upload agora." });
    }
  });

  app.get(api.services.list.path, isAuthenticated, async (_req, res) => res.json(await storage.getServices()));
  app.post(api.services.create.path, isAuthenticated, async (req, res) => res.status(201).json(await storage.createService(api.services.create.input.parse(req.body))));

  app.patch("/api/services/:id", isAuthenticated, async (req, res) => {
    const id = Number(req.params.id);
    const [updated] = await db.update(services).set(api.services.update.input.parse(req.body) as any).where(eq(services.id, id)).returning();
    if (!updated) return res.status(404).json({ message: "Serviço não encontrado." });
    res.json(updated);
  });

  app.delete("/api/services/:id", isAuthenticated, async (req, res) => {
    const id = Number(req.params.id);
    const rows = await db.delete(services).where(eq(services.id, id)).returning();
    if (!rows.length) return res.status(404).json({ message: "Serviço não encontrado." });
    res.status(204).send();
  });

  app.get(api.deductions.standard.list.path, isAuthenticated, async (_req, res) => res.json(await storage.getStandardDeductions()));
  app.post(api.deductions.standard.create.path, isAuthenticated, async (req, res) => res.status(201).json(await storage.createStandardDeduction(api.deductions.standard.create.input.parse(req.body))));
  app.get(api.deductions.individual.list.path, isAuthenticated, async (req, res) => res.json(await storage.getIndividualDeductions(req.query.professionalId as string | undefined)));
  app.post(api.deductions.individual.create.path, isAuthenticated, async (req, res) => res.status(201).json(await storage.createIndividualDeduction(api.deductions.individual.create.input.parse(req.body))));

  app.get(api.appointments.list.path, isAuthenticated, async (req: any, res) => {
    const profile = await storage.getProfile(req.authUserId);
    if (!profile) return res.status(403).json({ message: "Perfil não encontrado." });
    if (profile.role === "professional" && profile.approvalStatus !== "active") return res.status(403).json({ message: "Aguardando aprovação para acessar o painel." });
    const filters: any = { ...(req.query.startDate ? { startDate: req.query.startDate } : {}), ...(req.query.endDate ? { endDate: req.query.endDate } : {}) };
    if (profile.role === "professional") filters.professionalId = req.authUserId; else if (req.query.professionalId) filters.professionalId = req.query.professionalId;
    res.json(await storage.getAppointments(filters));
  });

  app.post(api.appointments.create.path, isAuthenticated, async (req: any, res) => {
    const profile = await storage.getProfile(req.authUserId);
    if (!profile || profile.role !== "professional" || profile.approvalStatus !== "active") return res.status(403).json({ message: "Você não pode registrar atendimentos no momento." });
    const input = api.appointments.create.input.parse(req.body);
    const service = await storage.getService(input.serviceId);
    if (!service) return res.status(404).json({ message: "Serviço não encontrado." });
    res.status(201).json(await storage.createAppointment({ ...input, professionalId: req.authUserId, price: service.price, commissionRate: service.commissionRate, status: "pending" } as any));
  });

  app.get(api.stats.get.path, isAuthenticated, async (_req, res) => res.json(await storage.getStats()));

  return httpServer;
}
