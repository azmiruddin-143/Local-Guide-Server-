import express from 'express';
import { settingsController } from './settings.controller';
import { checkAuth } from '../../middlewares/checkAuth';
import { ERole } from '../user/user.interface';
import { validateRequest } from '../../middlewares/validateRequest';
import { settingsValidation } from './settings.validation';

const router = express.Router();

// Get platform settings (public - no auth required)
router.get('/', settingsController.getPlatformSettings);

// Update platform settings (admin only)
router.patch(
  '/',
  checkAuth(ERole.ADMIN),
  validateRequest(settingsValidation.updatePlatformSettingsSchema),
  settingsController.updatePlatformSettings
);

export const settingsRoutes = router;
