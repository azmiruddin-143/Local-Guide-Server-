import { Router } from 'express';
import { payoutController } from './payout.controller';
import { checkAuth } from '../../middlewares/checkAuth';
import { ERole } from '../user/user.interface';

const router = Router();

// Guide routes
router.post('/', checkAuth(ERole.GUIDE), payoutController.requestPayout);

router.get(
  '/guide/:guideId',
  checkAuth(ERole.GUIDE, ERole.ADMIN),
  payoutController.getGuidePayouts
);

router.get('/wallet/balance', checkAuth(ERole.GUIDE), payoutController.getWalletBalance);

router.patch('/:id/cancel', checkAuth(ERole.GUIDE), payoutController.cancelPayout);

// Admin routes
router.get('/admin/all', checkAuth(ERole.ADMIN), payoutController.getAllPayouts);
router.patch('/:id/process', checkAuth(ERole.ADMIN), payoutController.processPayout);
router.patch('/:id/fail', checkAuth(ERole.ADMIN), payoutController.failPayout);

export const payoutRoute = router;
