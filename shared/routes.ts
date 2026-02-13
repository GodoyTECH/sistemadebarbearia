import { z } from 'zod';
import { 
  insertProfileSchema, 
  insertServiceSchema, 
  insertAppointmentSchema, 
  insertStandardDeductionSchema,
  insertIndividualDeductionSchema,
  profiles, 
  services, 
  appointments,
  standardDeductions,
  individualDeductions,
  shops,
} from './schema';

export { 
  insertProfileSchema, 
  insertServiceSchema, 
  insertAppointmentSchema,
  insertStandardDeductionSchema,
  insertIndividualDeductionSchema
};

export type { Profile, Service, Appointment, InsertAppointment } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  health: {
    check: {
      method: 'GET' as const,
      path: '/api/health' as const,
      responses: {
        200: z.object({ status: z.literal('ok') }),
      },
    },
  },
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: z.object({
        email: z.string().email(),
        password: z.string().min(6),
        keepConnected: z.boolean().optional(),
      }),
      responses: {
        200: z.any(),
        401: errorSchemas.unauthorized,
      },
    },
    register: {
      method: 'POST' as const,
      path: '/api/auth/register' as const,
      input: z.discriminatedUnion("role", [
        z.object({
          role: z.literal("manager"),
          managerName: z.string().min(2),
          shopName: z.string().min(2),
          emailPrefix: z.string().min(3),
          phone: z.string().min(10),
          password: z.string().min(8).regex(/^[A-Za-z0-9]+$/),
          confirmPassword: z.string().min(8),
        }),
        z.object({
          role: z.literal("professional"),
        }),
      ]),
      responses: {
        201: z.any(),
        409: errorSchemas.validation,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
      responses: {
        200: z.object({ ok: z.boolean() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/me' as const,
      responses: {
        200: z.object({
          user: z.any(),
          profile: z.custom<typeof profiles.$inferSelect>().nullable(),
          shop: z.custom<typeof shops.$inferSelect>().nullable(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
    updateProfile: {
      method: 'POST' as const,
      path: '/api/profile' as const,
      input: insertProfileSchema,
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    }
  },
  services: {
    list: {
      method: 'GET' as const,
      path: '/api/services' as const,
      responses: {
        200: z.array(z.custom<typeof services.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/services' as const,
      input: insertServiceSchema,
      responses: {
        201: z.custom<typeof services.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/services/:id' as const,
      input: insertServiceSchema.partial(),
      responses: {
        200: z.custom<typeof services.$inferSelect>(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/services/:id' as const,
      responses: {
        204: z.any(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    }
  },
  deductions: {
    standard: {
      list: {
        method: 'GET' as const,
        path: '/api/deductions/standard' as const,
        responses: {
          200: z.array(z.custom<typeof standardDeductions.$inferSelect>()),
        },
      },
      create: {
        method: 'POST' as const,
        path: '/api/deductions/standard' as const,
        input: insertStandardDeductionSchema,
        responses: {
          201: z.custom<typeof standardDeductions.$inferSelect>(),
        },
      }
    },
    individual: {
      list: {
        method: 'GET' as const,
        path: '/api/deductions/individual' as const,
        input: z.object({ professionalId: z.string() }).optional(),
        responses: {
          200: z.array(z.custom<typeof individualDeductions.$inferSelect>()),
        },
      },
      create: {
        method: 'POST' as const,
        path: '/api/deductions/individual' as const,
        input: insertIndividualDeductionSchema,
        responses: {
          201: z.custom<typeof individualDeductions.$inferSelect>(),
        },
      }
    }
  },
  appointments: {
    list: {
      method: 'GET' as const,
      path: '/api/appointments' as const,
      input: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        professionalId: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof appointments.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/appointments' as const,
      input: insertAppointmentSchema,
      responses: {
        201: z.custom<typeof appointments.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/appointments/:id/status' as const,
      input: z.object({ status: z.string(), reason: z.string().optional() }),
      responses: {
        200: z.custom<typeof appointments.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    }
  },
  stats: {
    get: {
      method: 'GET' as const,
      path: '/api/stats' as const,
      responses: {
        200: z.object({
          totalCuts: z.number(),
          totalRevenue: z.number(),
          totalCommission: z.number(),
          totalDeductions: z.number(),
          netPayable: z.number(),
          pendingApprovals: z.number(),
          professionals: z.array(z.object({
            id: z.string(),
            name: z.string(),
            totalCuts: z.number(),
            totalRevenue: z.number(),
            grossCommission: z.number(),
            standardDeductions: z.number(),
            individualDeductions: z.number(),
            totalDeductions: z.number(),
            netPayable: z.number(),
          })),
          revenueByDay: z.array(z.object({
            day: z.string(),
            total: z.number(),
          })),
        }),
        401: errorSchemas.unauthorized,
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
