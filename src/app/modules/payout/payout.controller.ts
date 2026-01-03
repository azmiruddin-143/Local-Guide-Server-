import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes as httpStatus } from 'http-status-codes';
import { payoutServices } from './payout.service';

const requestPayout = catchAsync(async (req: Request, res: Response) => {
  const guideId = (req.user as any).userId;
  const result = await payoutServices.requestPayout(guideId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Payout requested successfully',
    data: result,
  });
});

const getGuidePayouts = catchAsync(async (req: Request, res: Response) => {
  const { guideId } = req.params;
  const result = await payoutServices.getGuidePayouts(guideId, req.query as Record<string , string>);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payouts retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const processPayout = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { providerPayoutId } = req.body;
  const result = await payoutServices.processPayout(id, providerPayoutId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payout processed successfully',
    data: result,
  });
});

const failPayout = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { failureReason } = req.body;
  const result = await payoutServices.failPayout(id, failureReason);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payout marked as failed',
    data: result,
  });
});

const getWalletBalance = catchAsync(async (req: Request, res: Response) => {
  const guideId = (req.user as any).userId;
  const result = await payoutServices.getWalletBalance(guideId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Wallet balance retrieved successfully',
    data: result,
  });
});

const cancelPayout = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const guideId = (req.user as any).userId;
  const result = await payoutServices.cancelPayout(id, guideId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payout cancelled successfully',
    data: result,
  });
});

const getAllPayouts = catchAsync(async (req: Request, res: Response) => {
  const result = await payoutServices.getAllPayouts(req.query as Record<string, string>);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All payouts retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

export const payoutController = {
  requestPayout,
  getGuidePayouts,
  getAllPayouts,
  processPayout,
  failPayout,
  cancelPayout,
  getWalletBalance,
};
