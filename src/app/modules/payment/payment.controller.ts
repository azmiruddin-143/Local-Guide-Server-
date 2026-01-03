import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes as httpStatus } from 'http-status-codes';
import { paymentServices } from './payment.service';
import { envVars } from '../../config/env';

const initiatePayment = catchAsync(async (req: Request, res: Response) => {
  const { bookingId } = req.body;
  const userId = (req.user as any).userId;
  const result = await paymentServices.initiatePayment(bookingId, userId);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Payment initiated successfully',
    data: result,
  });
});

const successPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentServices.successPayment(req.query as any, req.body as any);

  // Redirect to frontend success page with bookingId
  res.redirect(`${envVars.SSL.SSL_SUCCESS_FRONTEND_URL}?transactionId=${req.query.tran_id}&bookingId=${result.bookingId}`);
});

const failPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentServices.failPayment(req.query as any);

  // Redirect to frontend fail page
  res.redirect(`${envVars.SSL.SSL_FAIL_FRONTEND_URL}?transactionId=${req.query.tran_id}`);
});

const cancelPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentServices.cancelPayment(req.query as any);

  // Redirect to frontend cancel page
  res.redirect(`${envVars.SSL.SSL_CANCEL_FRONTEND_URL}?transactionId=${req.query.tran_id}`);
});

// const validatePayment = catchAsync(async (req: Request, res: Response) => {
//   // IPN (Instant Payment Notification) endpoint
//   await paymentServices.successPayment(req.body);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Payment validated successfully',
//     data: null,
//   });
// });

const getPaymentByBooking = catchAsync(async (req: Request, res: Response) => {
  const { bookingId } = req.params;
  const userId = (req.user as any).userId;
  const result = await paymentServices.getPaymentByBooking(bookingId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment retrieved successfully',
    data: result,
  });
});

const retryPayment = catchAsync(async (req: Request, res: Response) => {
  const { bookingId } = req.body;
  const userId = (req.user as any).userId;
  const result = await paymentServices.retryPayment(bookingId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment retry initiated successfully',
    data: result,
  });
});

const refundPayment = catchAsync(async (req: Request, res: Response) => {
  const { paymentId } = req.params;
  const refundData = req.body;
  
  console.log('Refund request received:', { paymentId, refundData });
  const result = await paymentServices.refundPayment(paymentId, refundData);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment refunded successfully',
    data: result,
  });
});

const getMyPaymentHistory = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any).userId;
  const result = await paymentServices.getMyPaymentHistory(userId, req.query as Record<string, string>);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment history retrieved successfully',
    data: result.payments,
    meta: result.meta,
  });
});

const getAllPaymentsAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentServices.getAllPaymentsAdmin(req.query as Record<string, string>);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All payments retrieved successfully',
    data: result.payments,
    meta: result.meta,
  });
});

export const paymentController = {
  initiatePayment,
  successPayment,
  failPayment,
  cancelPayment,
  // validatePayment,
  getPaymentByBooking,
  retryPayment,
  refundPayment,
  getMyPaymentHistory,
  getAllPaymentsAdmin,
};
