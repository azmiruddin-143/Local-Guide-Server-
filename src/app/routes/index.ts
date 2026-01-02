import { Router } from 'express';
import { userRoute } from '../modules/user/user.route';
import { authRoute } from '../modules/auth/auth.route';
import { contactRoute } from '../modules/contact/contact.route';
import { statsRoute } from '../modules/stats/stats.route';
import { tourRoute } from '../modules/tour/tour.route';
import { bookingRoute } from '../modules/booking/booking.route';
import { paymentRoute } from '../modules/payment/payment.route';
import { reviewRoute } from '../modules/review/review.route';
import { payoutRoute } from '../modules/payout/payout.route';
import { notificationRoute } from '../modules/notification/notification.route';
import { availabilityRoute } from '../modules/availability/availability.route';
import { settingsRoutes } from '../modules/settings/settings.route';
import { subscribeRoutes } from '../modules/subscribe/subscribe.route';

export const router = Router();

const moduleRoutes = [
  {
    path: '/user',
    route: userRoute,
  },
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/tours',
    route: tourRoute,
  },
  {
    path: '/bookings',
    route: bookingRoute,
  },
  {
    path: '/payments',
    route: paymentRoute,
  },
  {
    path: '/reviews',
    route: reviewRoute,
  },
  {
    path: '/payouts',
    route: payoutRoute,
  },
  {
    path: '/notifications',
    route: notificationRoute,
  },
  {
    path: '/availability',
    route: availabilityRoute,
  },
  {
    path: '/contact',
    route: contactRoute,
  },
  {
    path: '/stats',
    route: statsRoute,
  },
  {
    path: '/settings',
    route: settingsRoutes,
  },
  {
    path: '/newsletter',
    route: subscribeRoutes,
  },
];

moduleRoutes.forEach(route => {
  router.use(route.path, route.route);
});
