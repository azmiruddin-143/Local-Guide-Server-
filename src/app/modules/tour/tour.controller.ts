import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes as httpStatus } from 'http-status-codes';
import { tourServices } from './tour.service';

const createTour = catchAsync(async (req: Request, res: Response) => {
  const guideId = (req.user as any).userId;
  const files = req.files as Express.Multer.File[];
  
  // Parse the data field if it exists
  let payload = req.body.data ? JSON.parse(req.body.data) : req.body;
  
  // Add media URLs from uploaded files
  if (files && files.length > 0) {
    const mediaUrls = files.map(file => file.path);
    payload = {
      ...payload,
      mediaUrls: mediaUrls
    };
  }
  
  const result = await tourServices.createTour(guideId, payload);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Tour created successfully',
    data: result,
  });
});

const getAllTours = catchAsync(async (req: Request, res: Response) => {
  const result = await tourServices.getAllTours(req.query as Record<string, string>);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Tours retrieved successfully',
    data: result.tours,
    meta: result.pagination,
  });
});

const getTourById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await tourServices.getTourById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Tour retrieved successfully',
    data: result,
  });
});

const getTourBySlug = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const result = await tourServices.getTourBySlug(slug);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Tour retrieved successfully',
    data: result,
  });
});

const getToursByGuide = catchAsync(async (req: Request, res: Response) => {
  const { guideId } = req.params;
  const result = await tourServices.getToursByGuide(guideId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Guide tours retrieved successfully',
    data: result,
  });
});

const getTopRatedTours = catchAsync(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 4;
  const result = await tourServices.getTopRatedTours(limit);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Top rated tours retrieved successfully',
    data: result,
  });
});

const getMyTours = catchAsync(async (req: Request, res: Response) => {
  const guideId = (req.user as any).userId;
  const result = await tourServices.getMyTours(guideId, req.query as Record<string, string>);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'My tours retrieved successfully',
    data: result.tours,
    meta: result.pagination,
  });
});

const updateTour = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const guideId = (req.user as any).userId;

  const files = req.files as Express.Multer.File[];

  // Parse the data field if it exists
  let payload = req.body.data ? JSON.parse(req.body.data) : req.body;

  // Handle media URLs
  const newMediaUrls = files && files.length > 0 ? files.map(file => file.path) : [];
  const existingMediaUrls = payload.existingMediaUrls || [];

  // Combine existing and new media URLs
  const allMediaUrls = [...existingMediaUrls, ...newMediaUrls];

  payload = {
    ...payload,
    mediaUrls: allMediaUrls
  };

  // Remove existingMediaUrls from payload as it's not part of the schema
  delete payload.existingMediaUrls;

  const result = await tourServices.updateTour(id, guideId, payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Tour updated successfully',
    data: result,
  });
});

const deleteTour = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const guideId = (req.user as any).userId;
  await tourServices.deleteTour(id, guideId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Tour deleted successfully',
    data: null,
  });
});

const toggleTourStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const guideId = (req.user as any).userId;
  const result = await tourServices.toggleTourStatus(id, guideId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Tour status updated successfully',
    data: result,
  });
});

// Admin routes
const getAllToursAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await tourServices.getAllToursAdmin(req.query as Record<string, string>);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All tours retrieved successfully',
    data: result.tours,
    meta: result.pagination,
  });
});

const updateTourAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await tourServices.updateTourAdmin(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Tour updated successfully',
    data: result,
  });
});

const deleteTourAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await tourServices.deleteTourAdmin(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Tour deleted successfully',
    data: null,
  });
});

const toggleTourStatusAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await tourServices.toggleTourStatusAdmin(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Tour status updated successfully',
    data: result,
  });
});

export const tourController = {
  createTour,
  getAllTours,
  getTourById,
  getToursByGuide,
  getTopRatedTours,
  getMyTours,
  updateTour,
  deleteTour,
  toggleTourStatus,
  getTourBySlug,
  // Admin
  getAllToursAdmin,
  updateTourAdmin,
  deleteTourAdmin,
  toggleTourStatusAdmin,
};
