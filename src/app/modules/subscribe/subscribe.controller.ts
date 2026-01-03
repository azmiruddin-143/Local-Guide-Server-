import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes as httpStatus } from 'http-status-codes';
import { subscribeServices } from './subscribe.service';

const subscribeNewsletter = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await subscribeServices.subscribeNewsletter(email);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Successfully subscribed to newsletter!',
    data: result,
  });
});

const unsubscribeNewsletter = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await subscribeServices.unsubscribeNewsletter(email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Successfully unsubscribed from newsletter',
    data: result,
  });
});

const getAllSubscribers = catchAsync(async (req: Request, res: Response) => {
  const result = await subscribeServices.getAllSubscribers(req.query as Record<string, string>);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscribers retrieved successfully',
    data: result.contacts,
    meta: result.pagination,
  });
});

const getSubscriberStats = catchAsync(async (req: Request, res: Response) => {
  const result = await subscribeServices.getSubscriberStats();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscriber stats retrieved successfully',
    data: result,
  });
});

export const subscribeControllers = {
  subscribeNewsletter,
  unsubscribeNewsletter,
  getAllSubscribers,
  getSubscriberStats,
};
