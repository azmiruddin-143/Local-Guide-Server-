export interface IPlatformSettings {
  platformFee: {
    percentage: number; // Commission percentage (e.g., 15 means 15%)
    type: 'PERCENTAGE' | 'FIXED'; // Future: support fixed fee
    enabled: boolean;
  };

  // Payout Configuration
  payout: {
    minimumAmount: number; // Minimum payout amount in BDT
    processingDays: number; // Expected processing time in days
    maxPendingPayouts: number; // Max pending payouts per guide
  };

  // Payment Configuration
  payment: {
    currency: string; // Default currency (BDT)
    taxPercentage: number; // VAT/Tax percentage
    gateway: 'SSLCOMMERZ' | 'STRIPE' | 'BOTH';
  };

  // General Platform Settings
  general: {
    platformName: string;
    supportEmail: string;
    supportPhone: string;
    maintenanceMode: boolean;
    allowNewGuideRegistrations: boolean;
  };

  socialLinks: {
    facebook: string;
    twitter: string;
    instagram: string;
    linkedin: string;
    youtube: string;
  };
  contacts: {
    address: string;
    phone: string;
    email: string;
    supportEmail: string;
    supportPhone: string;
    businessHours: string;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
  };

  createdAt?: Date;
  updatedAt?: Date;
}

