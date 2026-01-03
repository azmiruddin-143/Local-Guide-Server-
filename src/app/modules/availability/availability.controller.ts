import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes as httpStatus } from 'http-status-codes';
import { availabilityServices } from './availability.service';

const createAvailability = catchAsync(async (req: Request, res: Response) => {
  const guideId = (req.user as any).userId;
  const result = await availabilityServices.createAvailability(guideId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Availability created successfully',
    data: result,
  });
});

const getMyAvailability = catchAsync(async (req: Request, res: Response) => {
  const guideId = (req.user as any).userId;
  const result = await availabilityServices.getGuideAvailability(guideId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Availability retrieved successfully',
    data: result,
  });
});

const getGuideAvailability = catchAsync(async (req: Request, res: Response) => {
  const { guideId } = req.params;
  const result = await availabilityServices.getGuideAvailability(guideId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Availability retrieved successfully',
    data: result,
  });
});

const updateAvailability = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const guideId = (req.user as any).userId;
  const result = await availabilityServices.updateAvailability(id, guideId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Availability updated successfully',
    data: result,
  });
});

const deleteAvailability = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const guideId = (req.user as any).userId;
  await availabilityServices.deleteAvailability(id, guideId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Availability deleted successfully',
    data: null,
  });
});

const checkAvailability = catchAsync(async (req: Request, res: Response) => {
  const { guideId } = req.params;
  const { date, time } = req.query;
  const result = await availabilityServices.checkAvailability(
    guideId,
    new Date(date as string),
    time as string
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Availability check completed',
    data: result,
  });
});

const debugAvailability = catchAsync(async (req: Request, res: Response) => {
  const { guideId } = req.params;
  const { date, time } = req.query;
  
  const result = await availabilityServices.debugAvailability(
    guideId,
    date as string,
    time as string
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Debug info retrieved',
    data: result,
  });
});

export const availabilityController = {
  createAvailability,
  getMyAvailability,
  getGuideAvailability,
  updateAvailability,
  deleteAvailability,
  checkAvailability,
  debugAvailability,
};
