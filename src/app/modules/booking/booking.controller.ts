import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes as httpStatus } from 'http-status-codes';
import { bookingServices } from './booking.service';

const createBooking = catchAsync(async (req: Request, res: Response) => {
  const touristId = (req.user as any).userId;
  const result = await bookingServices.createBooking(touristId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Booking created successfully',
    data: result,
  });
});

const getBookingById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req.user as any).userId;
  const result = await bookingServices.getBookingById(id, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking retrieved successfully',
    data: result,
  });
});

const getTouristBookings = catchAsync(async (req: Request, res: Response) => {
  const { touristId } = req.params;
  const result = await bookingServices.getTouristBookings(touristId, req.query as Record<string, string>);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Tourist bookings retrieved successfully',
    data: result.bookings,
    meta: result.pagination,
  });
});

const getGuideBookings = catchAsync(async (req: Request, res: Response) => {
  const { guideId } = req.params;
  const result = await bookingServices.getGuideBookings(guideId, req.query as Record<string, string>);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Guide bookings retrieved successfully',
    data: result.bookings,
    meta: result.pagination,
  });
});

const confirmBooking = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const guideId = (req.user as any).userId;
  const isAdmin = (req.user as any).role === 'ADMIN';
  const result = await bookingServices.confirmBooking(id, guideId, isAdmin);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking confirmed successfully',
    data: result,
  });
});

const declineBooking = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const guideId = (req.user as any).userId;
  const isAdmin = (req.user as any).role === 'ADMIN';
  const result = await bookingServices.declineBooking(id, guideId, isAdmin);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking declined successfully',
    data: result,
  });
});

const cancelBooking = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req.user as any).userId;
  const isAdmin = (req.user as any).role === 'ADMIN';
  const { cancellationReason } = req.body;
  const result = await bookingServices.cancelBooking(id, userId, cancellationReason, isAdmin);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking cancelled successfully',
    data: result,
  });
});

const completeBooking = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await bookingServices.completeBooking(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking completed successfully',
    data: result,
  });
});

const getAllBookingsAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await bookingServices.getAllBookingsAdmin(req.query as Record<string, string>);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All bookings retrieved successfully',
    data: result.bookings,
    meta: result.pagination,
  });
});

export const bookingController = {
  createBooking,
  getBookingById,
  getTouristBookings,
  getGuideBookings,
  confirmBooking,
  declineBooking,
  cancelBooking,
  completeBooking,
  getAllBookingsAdmin,
};
