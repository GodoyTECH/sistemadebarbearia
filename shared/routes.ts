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
  individualDeductions
} from './schema';

export { 
  insertProfileSchema, 
  insertServiceSchema, 
  insertAppointmentSchema,
  insertStandardDeductionSchema,
  insertIndividualDeductionSchema
};

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
  auth: {
    me: {
      method: 'GET' as const,
      path: '/api/me' as const,
      responses: {
        200: z.object({
          user: z.any(),
          profile: z.custom<typeof profiles.$inferSelect>().nullable(),
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
          }))
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
