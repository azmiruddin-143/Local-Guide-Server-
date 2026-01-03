import { Schema, model } from 'mongoose';
import { IPlatformSettings } from './settings.interface';

const platformSettingsSchema = new Schema<IPlatformSettings>(
  {
    platformFee: {
      percentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 15,
      },
      type: {
        type: String,
        enum: ['PERCENTAGE', 'FIXED'],
        default: 'PERCENTAGE',
      },
      enabled: {
        type: Boolean,
        default: true,
      },
    },

    payout: {
      minimumAmount: {
        type: Number,
        required: true,
        min: 0,
        default: 1000,
      },
      processingDays: {
        type: Number,
        required: true,
        min: 1,
        default: 7,
      },
      maxPendingPayouts: {
        type: Number,
        required: true,
        min: 1,
        default: 5,
      },
    },

    payment: {
      currency: {
        type: String,
        required: true,
        default: 'BDT',
      },
      taxPercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 0,
      },
      gateway: {
        type: String,
        enum: ['SSLCOMMERZ', 'STRIPE', 'BOTH'],
        default: 'SSLCOMMERZ',
      },
    },

    general: {
      platformName: {
        type: String,
        required: true,
        default: 'LocalGuide',
      },
      supportEmail: {
        type: String,
        required: true,
        default: 'support@localguide.com',
      },
      supportPhone: {
        type: String,
        required: true,
        default: '+8801700000000',
      },
      maintenanceMode: {
        type: Boolean,
        default: false,
      },
      allowNewGuideRegistrations: {
        type: Boolean,
        default: true,
      },
    },

    socialLinks: {
      facebook: {
        type: String,
        default: '',
      },
      twitter: {
        type: String,
        default: '',
      },
      instagram: {
        type: String,
        default: '',
      },
      linkedin: {
        type: String,
        default: '',
      },
      youtube: {
        type: String,
        default: '',
      },
    },

    contacts: {
      address: {
        type: String,
        required: true,
        default: 'Dhaka, Bangladesh',
      },
      phone: {
        type: String,
        required: true,
        default: '+8801700000000',
      },
      email: {
        type: String,
        required: true,
        default: 'contact@localguide.com',
      },
      supportEmail: {
        type: String,
        required: true,
        default: 'support@localguide.com',
      },
      supportPhone: {
        type: String,
        required: true,
        default: '+8801700000000',
      },
      businessHours: {
        type: String,
        default: 'Saturday - Thursday: 9:00 AM - 6:00 PM',
      },
    },

    seo: {
      metaTitle: {
        type: String,
        default: 'LocalGuide - Find Your Perfect Local Tour Guide',
      },
      metaDescription: {
        type: String,
        default: 'Connect with experienced local tour guides and explore destinations like never before.',
      },
      metaKeywords: {
        type: String,
        default: 'local guide, tour guide, travel, tourism, local tours',
      },
    },
  },
  {
    timestamps: true,
  }
);

export const PlatformSettings = model<IPlatformSettings>(
  'PlatformSettings',
  platformSettingsSchema
);
