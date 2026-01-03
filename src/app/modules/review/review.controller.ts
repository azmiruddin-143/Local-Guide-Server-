import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes as httpStatus } from 'http-status-codes';
import { reviewServices } from './review.service';

const createReview = catchAsync(async (req: Request, res: Response) => {
  const touristId = (req.user as any).userId;
  const result = await reviewServices.createReview(touristId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Review created successfully',
    data: result,
  });
});

const updateReview = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const touristId = (req.user as any).userId;
  const result = await reviewServices.updateReview(id, touristId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review updated successfully',
    data: result,
  });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const touristId = (req.user as any).userId;
  await reviewServices.deleteReview(id, touristId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review deleted successfully',
    data: null,
  });
});

const getReviewsByBooking = catchAsync(async (req: Request, res: Response) => {
  const { bookingId } = req.params;
  const result = await reviewServices.getReviewsByBooking(bookingId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Reviews retrieved successfully',
    data: result,
  });
});

const getReviewByBookingAndTarget = catchAsync(async (req: Request, res: Response) => {
  const { bookingId, target } = req.params;
  const result = await reviewServices.getReviewByBookingAndTarget(bookingId, target as any);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review retrieved successfully',
    data: result,
  });
});

const getReviewsByTour = catchAsync(async (req: Request, res: Response) => {
  const { tourId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  const result = await reviewServices.getReviewsByTour(tourId, page, limit);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Tour reviews retrieved successfully',
    data: result,
  });
});

const getReviewsByGuide = catchAsync(async (req: Request, res: Response) => {
  const { guideId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  const result = await reviewServices.getReviewsByGuide(guideId, page, limit);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Guide reviews retrieved successfully',
    data: result,
  });
});

const getMyReviews = catchAsync(async (req: Request, res: Response) => {
  const touristId = (req.user as any).userId;
  const result = await reviewServices.getMyReviews(touristId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'My reviews retrieved successfully',
    data: result,
  });
});

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  const result = await reviewServices.getAllReviews(req.query as Record<string, string>);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Reviews retrieved successfully',
    data: result.reviews,
    meta: result.pagination,
  });
});

const deleteReviewByAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await reviewServices.deleteReviewByAdmin(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review deleted successfully',
    data: result,
  });
});

const getBestRandomReviews = catchAsync(async (req: Request, res: Response) => {
  const result = await reviewServices.getBestRandomReviews();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Best reviews retrieved successfully',
    data: result,
  });
});

export const reviewController = {
  createReview,
  updateReview,
  deleteReview,
  getReviewsByBooking,
  getReviewByBookingAndTarget,
  getReviewsByTour,
  getReviewsByGuide,
  getMyReviews,
  getAllReviews,
  deleteReviewByAdmin,
  getBestRandomReviews,
};
