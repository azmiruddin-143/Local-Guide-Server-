import { Router } from 'express';
import { reviewController } from './review.controller';
import { checkAuth } from '../../middlewares/checkAuth';
import { ERole } from '../user/user.interface';


const router = Router();

// Admin routes (must be before dynamic routes)
router.get('/all', checkAuth(ERole.ADMIN), reviewController.getAllReviews);
router.delete('/admin/:id', checkAuth(ERole.ADMIN), reviewController.deleteReviewByAdmin);

// Tourist routes
router.post(
  '/',
  checkAuth(ERole.TOURIST),
  // validateRequest(createReviewZodSchema),
  reviewController.createReview
);
router.patch(
  '/:id',
  checkAuth(ERole.TOURIST),
  // validateRequest(updateReviewZodSchema),
  reviewController.updateReview
);
router.delete('/:id', checkAuth(ERole.TOURIST), reviewController.deleteReview);
router.get('/my-reviews', checkAuth(ERole.TOURIST), reviewController.getMyReviews);

// Public routes
router.get('/booking/:bookingId', reviewController.getReviewsByBooking);
router.get('/booking/:bookingId/:target', reviewController.getReviewByBookingAndTarget);
router.get('/tour/:tourId', reviewController.getReviewsByTour);
router.get('/guide/:guideId', reviewController.getReviewsByGuide);

router.get('/best/random/reviews' , reviewController.getBestRandomReviews)

export const reviewRoute = router;
