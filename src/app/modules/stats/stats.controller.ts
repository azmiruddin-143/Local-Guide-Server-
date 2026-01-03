import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes as httpStatus } from 'http-status-codes';
import { statsService } from './stats.service';

// ==================== ADMIN CONTROLLERS ====================

/**
 * Get comprehensive platform statistics
 * Route: GET /stats/admin
 */
const getPlatformStats = catchAsync(async (req: Request, res: Response) => {
  const result = await statsService.getPlatformStats();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Platform statistics retrieved successfully',
    data: result,
  });
});

/**
 * Get top performing guides
 * Route: GET /stats/admin/top-guides
 */
const getTopGuides = catchAsync(async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const result = await statsService.getTopGuides(limit);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Top guides retrieved successfully',
    data: result,
  });
});

/**
 * Get popular tours
 * Route: GET /stats/admin/popular-tours
 */
const getPopularTours = catchAsync(async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const result = await statsService.getPopularToursStats(limit);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Popular tours retrieved successfully',
    data: result,
  });
});

/**
 * Get revenue analytics with optional date range
 * Route: GET /stats/admin/revenue
 */
const getRevenueStats = catchAsync(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  const result = await statsService.getRevenueStats(
    startDate ? new Date(startDate as string) : undefined,
    endDate ? new Date(endDate as string) : undefined
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Revenue statistics retrieved successfully',
    data: result,
  });
});

// ==================== GUIDE CONTROLLERS ====================

/**
 * Get guide dashboard statistics
 * Route: GET /stats/guide
 */
const getGuideStats = catchAsync(async (req: Request, res: Response) => {
  const guideId = (req.user as any).userId;
  const result = await statsService.getGuideStats(guideId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Guide statistics retrieved successfully',
    data: result,
  });
});

/**
 * Get guide performance metrics
 * Route: GET /stats/guide/performance
 */
const getGuidePerformance = catchAsync(async (req: Request, res: Response) => {
  const guideId = (req.user as any).userId;
  const result = await statsService.getGuidePerformance(guideId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Guide performance metrics retrieved successfully',
    data: result,
  });
});

/**
 * Get guide earnings breakdown
 * Route: GET /stats/guide/earnings
 */
const getGuideEarnings = catchAsync(async (req: Request, res: Response) => {
  const guideId = (req.user as any).userId;
  const { startDate, endDate } = req.query;

  const result = await statsService.getGuideEarnings(
    guideId,
    startDate ? new Date(startDate as string) : undefined,
    endDate ? new Date(endDate as string) : undefined
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Guide earnings breakdown retrieved successfully',
    data: result,
  });
});

// ==================== TOURIST CONTROLLERS ====================

/**
 * Get tourist dashboard statistics
 * Route: GET /stats/tourist
 */
const getTouristStats = catchAsync(async (req: Request, res: Response) => {
  const touristId = (req.user as any).userId;
  const result = await statsService.getTouristStats(touristId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Tourist statistics retrieved successfully',
    data: result,
  });
});

/**
 * Get tourist travel insights
 * Route: GET /stats/tourist/insights
 */
const getTouristInsights = catchAsync(async (req: Request, res: Response) => {
  const touristId = (req.user as any).userId;
  const result = await statsService.getTouristInsights(touristId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Tourist travel insights retrieved successfully',
    data: result,
  });
});

/**
 * Get tourist spending breakdown
 * Route: GET /stats/tourist/spending
 */
const getTouristSpending = catchAsync(async (req: Request, res: Response) => {
  const touristId = (req.user as any).userId;
  const { startDate, endDate } = req.query;

  const result = await statsService.getTouristSpending(
    touristId,
    startDate ? new Date(startDate as string) : undefined,
    endDate ? new Date(endDate as string) : undefined
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Tourist spending breakdown retrieved successfully',
    data: result,
  });
});

/**
 * Get tourist recommendations
 * Route: GET /stats/tourist/recommendations
 */
const getTouristRecommendations = catchAsync(async (req: Request, res: Response) => {
  const touristId = (req.user as any).userId;
  const result = await statsService.getTouristRecommendationsData(touristId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Tourist recommendations retrieved successfully',
    data: result,
  });
});

export const statsController = {
  // Admin
  getPlatformStats,
  getTopGuides,
  getPopularTours,
  getRevenueStats,
  
  // Guide
  getGuideStats,
  getGuidePerformance,
  getGuideEarnings,
  
  // Tourist
  getTouristStats,
  getTouristInsights,
  getTouristSpending,
  getTouristRecommendations,
};
