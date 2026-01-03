import {
  getAdminPlatformStats,
  getTopPerformingGuides,
  getPopularTours,
  getRevenueAnalytics,
} from './admin.utils';
import {
  getGuideDashboardStats,
  getGuidePerformanceMetrics,
  getGuideEarningsBreakdown,
} from './guide.utils';
import {
  getTouristDashboardStats,
  getTouristTravelInsights,
  getTouristSpendingBreakdown,
  getTouristRecommendations,
} from './tourist.utils';

// ==================== ADMIN STATS ====================

/**
 * Get comprehensive platform statistics for admin dashboard
 * Includes users, tours, bookings, payments, revenue, payouts, reviews, wallets, etc.
 */
const getPlatformStats = async () => {
  return await getAdminPlatformStats();
};

/**
 * Get top performing guides by revenue
 */
const getTopGuides = async (limit: number = 10) => {
  return await getTopPerformingGuides(limit);
};

/**
 * Get popular tours by bookings
 */
const getPopularToursStats = async (limit: number = 10) => {
  return await getPopularTours(limit);
};

/**
 * Get revenue analytics with optional date range filter
 */
const getRevenueStats = async (startDate?: Date, endDate?: Date) => {
  return await getRevenueAnalytics(startDate, endDate);
};

// ==================== GUIDE STATS ====================

/**
 * Get comprehensive guide dashboard statistics
 * Includes tours, bookings, earnings, payouts, reviews, wallet
 */
const getGuideStats = async (guideId: string) => {
  return await getGuideDashboardStats(guideId);
};

/**
 * Get guide performance metrics
 * Includes completion rate, average booking value, cancellation rate, repeat customers
 */
const getGuidePerformance = async (guideId: string) => {
  return await getGuidePerformanceMetrics(guideId);
};

/**
 * Get guide earnings breakdown with optional date range
 * Includes daily, weekly, monthly earnings
 */
const getGuideEarnings = async (guideId: string, startDate?: Date, endDate?: Date) => {
  return await getGuideEarningsBreakdown(guideId, startDate, endDate);
};

// ==================== TOURIST STATS ====================

/**
 * Get comprehensive tourist dashboard statistics
 * Includes bookings, spending, reviews
 */
const getTouristStats = async (touristId: string) => {
  return await getTouristDashboardStats(touristId);
};

/**
 * Get tourist travel insights
 * Includes cities visited, countries visited, favorite categories, favorite guides
 */
const getTouristInsights = async (touristId: string) => {
  return await getTouristTravelInsights(touristId);
};

/**
 * Get tourist spending breakdown with optional date range
 * Includes daily, weekly, monthly spending
 */
const getTouristSpending = async (touristId: string, startDate?: Date, endDate?: Date) => {
  return await getTouristSpendingBreakdown(touristId, startDate, endDate);
};

/**
 * Get tourist recommendations based on booking history
 */
const getTouristRecommendationsData = async (touristId: string) => {
  return await getTouristRecommendations(touristId);
};

export const statsService = {
  // Admin
  getPlatformStats,
  getTopGuides,
  getPopularToursStats,
  getRevenueStats,
  
  // Guide
  getGuideStats,
  getGuidePerformance,
  getGuideEarnings,
  
  // Tourist
  getTouristStats,
  getTouristInsights,
  getTouristSpending,
  getTouristRecommendationsData,
};
