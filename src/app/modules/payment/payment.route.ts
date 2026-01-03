import { Router } from 'express';
import { paymentController } from './payment.controller';
import { checkAuth } from '../../middlewares/checkAuth';
import { ERole } from '../user/user.interface';

const router = Router();

// Tourist routes
router.post(
  '/initiate',
  checkAuth(ERole.TOURIST),
  paymentController.initiatePayment
);

router.post(
  '/retry',
  checkAuth(ERole.TOURIST),
  paymentController.retryPayment
);

router.get(
  '/my-history',
  checkAuth(ERole.TOURIST),
  paymentController.getMyPaymentHistory
);

router.get(
  '/:bookingId',
  checkAuth(ERole.TOURIST, ERole.GUIDE, ERole.ADMIN),
  paymentController.getPaymentByBooking
);

// SSLCommerz callback routes (no auth required)
router.post('/success', paymentController.successPayment);
router.post('/fail', paymentController.failPayment);
router.post('/cancel', paymentController.cancelPayment);
// router.post('/validate-payment', paymentController.validatePayment); // IPN

// Admin routes
router.get(
  '/admin/all-payments',
  checkAuth(ERole.ADMIN),
  paymentController.getAllPaymentsAdmin
);

router.post(
  '/:paymentId/refund',
  checkAuth(ERole.ADMIN),
  paymentController.refundPayment
);

export const paymentRoute = router;
