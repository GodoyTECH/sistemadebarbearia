import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, isAuthenticated } from "./replit_integrations/auth";
import { registerAuthRoutes } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

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

  app.get(api.auth.me.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    const profile = await storage.getProfile(userId);
    res.json({ user, profile });
  });

  app.post(api.auth.updateProfile.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const input = api.auth.updateProfile.input.parse(req.body);
      const profile = await storage.createProfile({ ...input, userId });
      res.json(profile);
    } catch (err) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Services
  app.get(api.services.list.path, isAuthenticated, async (req, res) => {
    const srvs = await storage.getServices();
    res.json(srvs);
  });

  app.post(api.services.create.path, isAuthenticated, async (req, res) => {
    const input = api.services.create.input.parse(req.body);
    const srv = await storage.createService(input);
    res.status(201).json(srv);
  });

  // Deductions
  app.get(api.deductions.standard.list.path, isAuthenticated, async (req, res) => {
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

  // Appointments
  app.get(api.appointments.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    let filters: any = {};
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
    const input = api.appointments.create.input.parse(req.body);
    const service = await storage.getService(input.serviceId);
    if (!service) return res.status(404).json({ message: "Service not found" });

    const appt = await storage.createAppointment({
      ...input,
      professionalId: userId,
      price: service.price,
      commissionRate: service.commissionRate,
      status: 'pending'
    });
    res.status(201).json(appt);
  });

  // Stats
  app.get(api.stats.get.path, isAuthenticated, async (req, res) => {
    const stats = await storage.getStats();
    res.json(stats);
  });

  return httpServer;
}
