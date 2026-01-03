import { Router } from 'express';
import { contactController } from './contact.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { createContactZodSchema } from './contact.validation';
import { checkAuth } from '../../middlewares/checkAuth';
import { ERole } from '../user/user.interface';

const router = Router();

// Public route - Anyone can submit contact form
router.post(
  '/',
  validateRequest(createContactZodSchema),
  contactController.createContact
);

// Admin routes
router.get('/', checkAuth(ERole.ADMIN), contactController.getAllContacts);

router.get('/:id', checkAuth(ERole.ADMIN), contactController.getContactById);

router.patch('/:id/read', checkAuth(ERole.ADMIN), contactController.markAsRead);

router.delete('/:id', checkAuth(ERole.ADMIN), contactController.deleteContact);

export const contactRoute = router;