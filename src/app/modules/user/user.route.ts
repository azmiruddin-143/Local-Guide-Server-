import { Router } from 'express';
import { userController } from './user.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  createUserZodSchema,
  updateUserZodSchema,
  updateUserByAdminZodSchema,
} from './user.validation';
import { checkAuth } from '../../middlewares/checkAuth';
import { ERole } from './user.interface';
import { multerUpload } from '../../config/multer.config';

const router = Router();

// Public routes
router.post(
  '/register',
  validateRequest(createUserZodSchema),
  userController.createUser
);

router.get('/all-guides', userController.getAllGuides);
router.get('/guide-filter-options', userController.getGuideFilterOptions);
router.get('/top-rated-guides', userController.getTopRatedGuides);
router.get('/:id', userController.getUserById);

// Protected routes - Any authenticated user
router.patch(
  '/update-profile',
  multerUpload.single('picture'),
  checkAuth(...Object.values(ERole)),
  validateRequest(updateUserZodSchema),
  userController.updateUserProfile
);

// Admin only routes
router.get(
  '/admin/all-users',
  checkAuth(ERole.ADMIN),
  userController.getAllUsers
);

router.patch(
  '/:id',
  checkAuth(ERole.ADMIN),
  validateRequest(updateUserByAdminZodSchema),
  userController.updateUser
);

router.delete(
  '/:id',
  checkAuth(ERole.ADMIN),
  userController.deleteUser
);

router.patch(
  '/verify/:id',
  checkAuth(ERole.ADMIN),
  userController.verifyUser
);

router.get(
  '/role/:role',
  checkAuth(ERole.ADMIN),
  userController.getUsersByRole
);



export const userRoute = router;