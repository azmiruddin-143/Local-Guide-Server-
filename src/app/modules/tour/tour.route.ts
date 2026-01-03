import { Router } from 'express';
import { tourController } from './tour.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { createTourZodSchema, updateTourZodSchema } from './tour.validation';
import { checkAuth } from '../../middlewares/checkAuth';
import { ERole } from '../user/user.interface';
import { multerUpload } from '../../config/multer.config';

const router = Router();

// Guide authenticated routes (must come before /:id)
router.get('/my-tours', checkAuth(ERole.GUIDE), tourController.getMyTours);

// Public routes
router.get('/', tourController.getAllTours);
router.get('/top-rated', tourController.getTopRatedTours);
router.get('/guide/:guideId', tourController.getToursByGuide);
router.get('/:id', tourController.getTourById);
router.get('/slug/:slug', tourController.getTourBySlug);

// Guide only routes
router.post(
  '/',
  checkAuth(ERole.GUIDE),
  multerUpload.array('images', 10),
  tourController.createTour
);

router.patch(
  '/:id',
  checkAuth(ERole.GUIDE),
  multerUpload.array('images', 10),
  tourController.updateTour
);

router.delete('/:id', checkAuth(ERole.GUIDE), tourController.deleteTour);

router.patch(
  '/:id/toggle-status',
  checkAuth(ERole.GUIDE),
  tourController.toggleTourStatus
);

// Admin routes
router.get('/admin/all-tours', checkAuth(ERole.ADMIN), tourController.getAllToursAdmin);
router.patch('/admin/:id', checkAuth(ERole.ADMIN), tourController.updateTourAdmin);
router.delete('/admin/:id', checkAuth(ERole.ADMIN), tourController.deleteTourAdmin);
router.patch('/admin/:id/toggle-status', checkAuth(ERole.ADMIN), tourController.toggleTourStatusAdmin);

export const tourRoute = router;
