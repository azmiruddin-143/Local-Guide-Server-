import { Router } from 'express';
import { bookingController } from './booking.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  createBookingZodSchema,
  updateBookingStatusZodSchema,
  cancelBookingZodSchema,
} from './booking.validation';
import { checkAuth } from '../../middlewares/checkAuth';
import { ERole } from '../user/user.interface';

const router = Router();

// Tourist routes
router.post(
  '/',
  checkAuth(ERole.TOURIST),
  validateRequest(createBookingZodSchema),
  bookingController.createBooking
);

router.get(
  '/tourist/:touristId',
  checkAuth(ERole.TOURIST, ERole.ADMIN),
  bookingController.getTouristBookings
);

// Guide routes
router.get(
  '/guide/:guideId',
  checkAuth(ERole.GUIDE, ERole.ADMIN),
  bookingController.getGuideBookings
);

router.patch(
  '/:id/confirm',
  checkAuth(ERole.GUIDE, ERole.ADMIN),
  bookingController.confirmBooking
);

router.patch(
  '/:id/decline',
  checkAuth(ERole.GUIDE, ERole.ADMIN),
  bookingController.declineBooking
);

// Tourist, Guide, or Admin can cancel
router.patch(
  '/:id/cancel',
  checkAuth(ERole.TOURIST, ERole.GUIDE, ERole.ADMIN),
  validateRequest(cancelBookingZodSchema),
  bookingController.cancelBooking
);

// Admin or system can complete
router.patch(
  '/:id/complete',
  checkAuth(ERole.ADMIN,ERole.GUIDE),
  bookingController.completeBooking
);

// Both tourist and guide can view
router.get(
  '/:id',
  checkAuth(ERole.TOURIST, ERole.GUIDE, ERole.ADMIN),
  bookingController.getBookingById
);

// Admin routes
router.get(
  '/admin/all-bookings',
  checkAuth(ERole.ADMIN),
  bookingController.getAllBookingsAdmin
);

export const bookingRoute = router;
