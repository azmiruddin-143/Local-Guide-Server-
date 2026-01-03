import { Router } from 'express';
import { subscribeControllers } from './subscribe.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { subscribeValidations } from './subscribe.validation';
import { checkAuth } from '../../middlewares/checkAuth';
import { ERole } from '../user/user.interface';

const router = Router();

// Public routes
router.post(
  '/subscribe',
  validateRequest(subscribeValidations.subscribeSchema),
  subscribeControllers.subscribeNewsletter
);

router.post(
  '/unsubscribe',
  validateRequest(subscribeValidations.unsubscribeSchema),
  subscribeControllers.unsubscribeNewsletter
);

// Admin only routes
router.get(
  '/all',
  checkAuth(ERole.ADMIN),
  subscribeControllers.getAllSubscribers
);

router.get(
  '/stats',
  checkAuth(ERole.ADMIN),
  subscribeControllers.getSubscriberStats
);

export const subscribeRoutes = router;
