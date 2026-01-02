import { PlatformSettings } from '../modules/settings/settings.model';

export const seedPlatformSettings = async () => {
  try {
    const settingsExist = await PlatformSettings.findOne();

    if (settingsExist) {
      console.log('Platform settings already exist!');
      return;
    }

    const defaultSettings = {
      platformFee: {
        percentage: 15,
        type: 'PERCENTAGE' as const,
        enabled: true,
      },

      payout: {
        minimumAmount: 1000,
        processingDays: 7,
        maxPendingPayouts: 5,
      },

      payment: {
        currency: 'BDT',
        taxPercentage: 0,
        gateway: 'SSLCOMMERZ' as const,
      },

      general: {
        platformName: 'LocalGuide',
        supportEmail: 'support@localguide.com',
        supportPhone: '+8801791732611',
        maintenanceMode: false,
        allowNewGuideRegistrations: true,
      },

      socialLinks: {
        facebook: 'https://facebook.com/localguide',
        twitter: 'https://twitter.com/localguide',
        instagram: 'https://instagram.com/localguide',
        linkedin: 'https://linkedin.com/company/localguide',
        youtube: 'https://youtube.com/@localguide',
      },

      contacts: {
        address: 'Dhaka, Bangladesh',
        phone: '+8801791732611',
        email: 'contact@localguide.com',
        supportEmail: 'support@localguide.com',
        supportPhone: '+8801791732611',
        businessHours: 'Saturday - Thursday: 9:00 AM - 6:00 PM',
      },

      seo: {
        metaTitle: 'LocalGuide - Find Your Perfect Local Tour Guide',
        metaDescription:
          'Connect with experienced local tour guides and explore destinations like never before. Book authentic local experiences with verified guides.',
        metaKeywords:
          'local guide, tour guide, travel, tourism, local tours, travel guide, tour booking, local experiences',
      },
    };

    await PlatformSettings.create(defaultSettings);
    console.log('Platform settings seeded successfully!');
  } catch (error) {
    console.log('Error seeding platform settings:', error);
  }
};
