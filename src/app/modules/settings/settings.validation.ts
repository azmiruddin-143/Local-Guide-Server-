import { z } from 'zod';

const updatePlatformSettingsSchema = z
  .object({
    platformFee: z
      .object({
        percentage: z.number().min(0).max(100).optional(),
        type: z.enum(['PERCENTAGE', 'FIXED']).optional(),
        enabled: z.boolean().optional(),
      })
      .partial()
      .optional(),

    payout: z
      .object({
        minimumAmount: z.number().min(0).optional(),
        processingDays: z.number().min(1).optional(),
        maxPendingPayouts: z.number().min(1).optional(),
      })
      .partial()
      .optional(),

    payment: z
      .object({
        currency: z.string().optional(),
        taxPercentage: z.number().min(0).max(100).optional(),
        gateway: z.enum(['SSLCOMMERZ', 'STRIPE', 'BOTH']).optional(),
      })
      .partial()
      .optional(),

    general: z
      .object({
        platformName: z.string().optional(),
        supportEmail: z.string().email().optional(),
        supportPhone: z.string().optional(),
        maintenanceMode: z.boolean().optional(),
        allowNewGuideRegistrations: z.boolean().optional(),
      })
      .partial()
      .optional(),

    socialLinks: z
      .object({
        facebook: z.string().optional(),
        twitter: z.string().optional(),
        instagram: z.string().optional(),
        linkedin: z.string().optional(),
        youtube: z.string().optional(),
      })
      .partial()
      .optional(),

    contacts: z
      .object({
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        supportEmail: z.string().email().optional(),
        supportPhone: z.string().optional(),
        businessHours: z.string().optional(),
      })
      .partial()
      .optional(),

    seo: z
      .object({
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        metaKeywords: z.string().optional(),
      })
      .partial()
      .optional(),
  })
  .partial();

export const settingsValidation = {
  updatePlatformSettingsSchema,
};
