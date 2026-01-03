import { Router } from 'express';
import { statsController } from './stats.controller';
import { checkAuth } from '../../middlewares/checkAuth';
import { ERole } from '../user/user.interface';

const router = Router();

// ==================== ADMIN ROUTES ====================

/**
 * Get comprehensive platform statistics
 * Includes users, tours, bookings, revenue, payouts, reviews, wallets, etc.
 */
router.get(
  '/admin',
  checkAuth(ERole.ADMIN),
  statsController.getPlatformStats
);

/**
 * Get top performing guides by revenue
 */
router.get(
  '/admin/top-guides',
  checkAuth(ERole.ADMIN),
  statsController.getTopGuides
);

/**
 * Get popular tours by bookings
 */
router.get(
  '/admin/popular-tours',
  checkAuth(ERole.ADMIN),
  statsController.getPopularTours
);

/**
 * Get revenue analytics with optional date range
 * Query params: startDate, endDate
 */
router.get(
  '/admin/revenue',
  checkAuth(ERole.ADMIN),
  statsController.getRevenueStats
);

// ==================== GUIDE ROUTES ====================

/**
 * Get guide dashboard statistics
 * Includes tours, bookings, earnings, payouts, reviews, wallet
 */
router.get(
  '/guide',
  checkAuth(ERole.GUIDE),
  statsController.getGuideStats
);

/**
 * Get guide performance metrics
 * Includes completion rate, average booking value, cancellation rate, repeat customers
 */
router.get(
  '/guide/performance',
  checkAuth(ERole.GUIDE),
  statsController.getGuidePerformance
);

/**
 * Get guide earnings breakdown
 * Query params: startDate, endDate
 * Includes daily, weekly, monthly earnings
 */
router.get(
  '/guide/earnings',
  checkAuth(ERole.GUIDE),
  statsController.getGuideEarnings
);

// ==================== TOURIST ROUTES ====================

/**
 * Get tourist dashboard statistics
 * Includes bookings, spending, reviews
 */
router.get(
  '/tourist',
  checkAuth(ERole.TOURIST),
  statsController.getTouristStats
);

/**
 * Get tourist travel insights
 * Includes cities visited, countries visited, favorite categories, favorite guides
 */
router.get(
  '/tourist/insights',
  checkAuth(ERole.TOURIST),
  statsController.getTouristInsights
);

/**
 * Get tourist spending breakdown
 * Query params: startDate, endDate
 * Includes daily, weekly, monthly spending
 */
router.get(
  '/tourist/spending',
  checkAuth(ERole.TOURIST),
  statsController.getTouristSpending
);

/**
 * Get tourist recommendations based on booking history
 */
router.get(
  '/tourist/recommendations',
  checkAuth(ERole.TOURIST),
  statsController.getTouristRecommendations
);

export const statsRoute = router;
