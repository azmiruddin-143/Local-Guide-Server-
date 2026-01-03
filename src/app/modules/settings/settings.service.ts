import { PlatformSettings } from './settings.model';
import { IPlatformSettings } from './settings.interface';
import AppError from '../../errorHelpers/AppError';
import { StatusCodes as httpStatus } from 'http-status-codes';

// Get platform settings (always returns one document)
const getPlatformSettings = async (): Promise<IPlatformSettings> => {
  let settings = await PlatformSettings.findOne();

  // If no settings exist, create default settings
  if (!settings) {
    settings = await PlatformSettings.create({});
  }

  return settings;
};

// Update platform settings (admin only)
const updatePlatformSettings = async (
  payload: Partial<IPlatformSettings>
): Promise<IPlatformSettings> => {
  console.log('Received payload in service:', JSON.stringify(payload, null, 2));
  
  let settings = await PlatformSettings.findOne();

  if (!settings) {
    // Create if doesn't exist
    console.log('Creating new settings');
    settings = await PlatformSettings.create(payload);
  } else {
    console.log('Updating existing settings');
    
    // Update existing settings using deep merge
    if (payload.platformFee) {
      console.log('Updating platformFee:', payload.platformFee);
      settings.platformFee = { ...settings.platformFee, ...payload.platformFee };
    }
    if (payload.payout) {
      console.log('Updating payout:', payload.payout);
      settings.payout = { ...settings.payout, ...payload.payout };
    }
    if (payload.payment) {
      console.log('Updating payment:', payload.payment);
      settings.payment = { ...settings.payment, ...payload.payment };
    }
    if (payload.general) {
      console.log('Updating general:', payload.general);
      settings.general = { ...settings.general, ...payload.general };
    }
    if (payload.socialLinks) {
      console.log('Updating socialLinks:', payload.socialLinks);
      settings.socialLinks = { ...settings.socialLinks, ...payload.socialLinks };
    }
    if (payload.contacts) {
      console.log('Updating contacts:', payload.contacts);
      settings.contacts = { ...settings.contacts, ...payload.contacts };
    }
    if (payload.seo) {
      console.log('Updating seo:', payload.seo);
      settings.seo = { ...settings.seo, ...payload.seo };
    }

    await settings.save();
    console.log('Settings saved successfully');
  }

  return settings;
};

// Calculate platform fee based on amount
const calculatePlatformFee = async (amount: number): Promise<number> => {
  const settings = await getPlatformSettings();

  // If platform fee is disabled, return 0
  if (!settings.platformFee.enabled) {
    return 0;
  }

  // Calculate based on type
  if (settings.platformFee.type === 'PERCENTAGE') {
    return (amount * settings.platformFee.percentage) / 100;
  }

  // For FIXED type (future implementation)
  return settings.platformFee.percentage; // Use percentage field as fixed amount
};

export const settingsService = {
  getPlatformSettings,
  updatePlatformSettings,
  calculatePlatformFee,
};




