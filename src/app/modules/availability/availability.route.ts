import { Router } from 'express';
import { availabilityController } from './availability.controller';
import { checkAuth } from '../../middlewares/checkAuth';
import { ERole } from '../user/user.interface';

const router = Router();

// Guide routes (authenticated)
router.get('/my', checkAuth(ERole.GUIDE), availabilityController.getMyAvailability);
router.post('/', checkAuth(ERole.GUIDE), availabilityController.createAvailability);

router.patch('/:id', checkAuth(ERole.GUIDE), availabilityController.updateAvailability);

router.delete('/:id', checkAuth(ERole.GUIDE), availabilityController.deleteAvailability);

// Public routes (must come after specific routes)
router.get('/guide/:guideId/check', availabilityController.checkAvailability);
router.get('/guide/:guideId/debug', availabilityController.debugAvailability);
router.get('/guide/:guideId', availabilityController.getGuideAvailability);

export const availabilityRoute = router;
