import { Router } from 'express';
import { notificationController } from './notification.controller';
import { checkAuth } from '../../middlewares/checkAuth';
import { ERole } from '../user/user.interface';

const router = Router();

// All authenticated users
router.get(
  '/',
  checkAuth(...Object.values(ERole)),
  notificationController.getUserNotifications
);

router.patch(
  '/:id/read',
  checkAuth(...Object.values(ERole)),
  notificationController.markAsRead
);

router.patch(
  '/read-all',
  checkAuth(...Object.values(ERole)),
  notificationController.markAllAsRead
);

router.delete(
  '/:id',
  checkAuth(...Object.values(ERole)),
  notificationController.deleteNotification
);

router.get(
  '/unread-count',
  checkAuth(...Object.values(ERole)),
  notificationController.getUnreadCount
);

export const notificationRoute = router;
