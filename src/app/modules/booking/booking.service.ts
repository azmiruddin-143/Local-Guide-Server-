import { Booking } from './booking.model';
import { Tour } from '../tour/tour.model';
import { Availability } from '../availability/availability.model';
import { IBooking, BookingStatus, PaymentStatus } from './booking.interface';
import AppError from '../../errorHelpers/AppError';
import { StatusCodes as httpStatus } from 'http-status-codes';
import mongoose, { Types } from 'mongoose';
import { availabilityServices } from '../availability/availability.service';
import { QueryBuilder } from '../../utils/QueryBuilder';
import { BookingSearchableFields } from '../../constants';
import { Payment } from '../payment/payment.model';
import { PAYMENT_STATUS } from '../payment/payment.interface';
import { WalletModel } from '../wallet/wallet.model';
import { settingsService } from '../settings/settings.service';
import { NotificationHelper } from '../notification/notification.helper';
import { User } from '../user/user.model';

const createBooking = async (touristId: string, payload: Partial<IBooking>) => {
  // Validate tour exists and is active
  const tour = await Tour.findById(payload.tourId);

  if (!tour) {
    throw new AppError(httpStatus.NOT_FOUND, 'Tour not found');
  }

  if (!tour.isActive) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Tour is not active');
  }

  // Validate availability exists
  const availability = await Availability.findById(payload.availabilityId);

  if (!availability) {
    throw new AppError(httpStatus.NOT_FOUND, 'Availability slot not found');
  }

  if (!availability.isAvailable) {
    throw new AppError(httpStatus.BAD_REQUEST, 'This time slot is not available');
  }

  // Check if guide matches
  if (availability.guideId.toString() !== tour.guideId.toString()) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Availability does not belong to tour guide');
  }

  // Check if adding guests would exceed capacity
  const currentGuests = availability.todaysTourist?.count || 0;
  const maxGuests = availability.todaysTourist?.maxGuests || availability.maxGroupSize;
  const availableSlots = maxGuests - currentGuests;

  if (payload.numGuests! > availableSlots) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Only ${availableSlots} spot${availableSlots !== 1 ? 's' : ''} remaining for this slot.`
    );
  }

  // Check if slot is already booked for a different tour
  if (availability.todaysTourist?.isBooked && 
      availability.todaysTourist?.tourId && 
      availability.todaysTourist.tourId.toString() !== payload.tourId!.toString()) {
    throw new AppError(
      httpStatus.CONFLICT,
      'This slot is already booked for a different tour'
    );
  }

  // Calculate amount from availability price
  const amountTotal = availability.pricePerPerson * payload.numGuests!;

  // Create booking
  const booking = await Booking.create({
    ...payload,
    touristId: touristId,
    guideId: tour.guideId,
    amountTotal,
    currency: 'BDT',
    status: BookingStatus.PENDING,
    paymentStatus: PaymentStatus.PENDING,
  });

  // Store date and time in extras for later use
  booking.extras = { 
    bookingDate: availability.specificDate,
    startTime: availability.startTime
  };
  await booking.save();

  // Populate booking for notification
  const populatedBooking = await Booking.findById(booking._id)
    .populate('tourId', 'title')
    .populate('touristId', 'name')
    .populate('guideId', 'name');

  // Send notification to guide
  if (populatedBooking) {
    await NotificationHelper.notifyBookingCreated(populatedBooking);
  }

  return booking;
};

const getBookingById = async (id: string, userId: string) => {
  const booking = await Booking.findById(id)
    .populate('tourId')
    .populate('touristId', 'name email avatarUrl')
    .populate('guideId', 'name email avatarUrl')
    .populate('availabilityId').populate('paymentId');

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }

  // Check if user is authorized to view this booking
  if (
    booking.touristId._id.toString() !== userId &&
    booking.guideId._id.toString() !== userId
  ) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to view this booking');
  }

  return booking;
};

const getTouristBookings = async (touristId: string, query: Record<string, string>) => {
  // Handle search for transactionId separately
  let baseQuery: any = { touristId };
  


  const bookingQuery = new QueryBuilder(
    Booking.find(baseQuery)
      .populate('tourId')
      .populate('guideId', 'name email avatarUrl phoneNumber')
      .populate('availabilityId')
      .populate('paymentId'),
    query
  )
    .filter()
    .sort()
    .paginate();

  const [data, meta] = await Promise.all([
    bookingQuery.build().exec(),
    bookingQuery.getMeta(),
  ]);


  //  Aggregation for existing stats
  const stats = await Booking.aggregate([
    {
      $match: {
        touristId: new mongoose.Types.ObjectId(touristId),
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        status: "$_id",
        count: 1,
      },
    },
  ]);

  //  Include missing statuses (0 count)
  const allStatuses = Object.values(BookingStatus);
  const mergedStats = allStatuses.map((status) => {
    const found = stats.find((s) => s.status === status);
    return {
      status,
      count: found ? found.count : 0,
    };
  });

  return {
    bookings: data,
    pagination: { ...meta, status: mergedStats },
  };
};

const getGuideBookings = async (guideId: string, query: Record<string, string>) => {
  // Handle search for transactionId separately
  let baseQuery: any = { guideId };

  const bookingQuery = new QueryBuilder(
    Booking.find(baseQuery)
      .populate('tourId')
      .populate('touristId', 'name email avatarUrl phoneNumber')
      .populate('availabilityId')
      .populate('paymentId'),
    query
  )
    .filter()
    .sort()
    .paginate();

  const [data, meta] = await Promise.all([
    bookingQuery.build().exec(),
    bookingQuery.getMeta(),
  ]);


  //  Aggregation for existing stats
  const stats = await Booking.aggregate([
    {
      $match: {
        guideId: new mongoose.Types.ObjectId(guideId),
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        status: "$_id",
        count: 1,
      },
    },
  ]);

  //  Include missing statuses (0 count)
  const allStatuses = Object.values(BookingStatus);
  const mergedStats = allStatuses.map((status) => {
    const found = stats.find((s) => s.status === status);
    return {
      status,
      count: found ? found.count : 0,
    };
  });


  return {
    bookings: data,
    pagination: { ...meta, status: mergedStats },
  };
};

const getAllBookingsAdmin = async (query: Record<string, string>) => {
  const bookingQuery = new QueryBuilder(
    Booking.find()
      .populate('tourId')
      .populate('touristId', 'name email avatarUrl phoneNumber')
      .populate('guideId', 'name email avatarUrl phoneNumber')
      .populate('availabilityId')
      .populate('paymentId'),
    query
  )
    .search(BookingSearchableFields)
    .filter()
    .sort()
    .paginate();

  const [data, meta] = await Promise.all([
    bookingQuery.build().exec(),
    bookingQuery.getMeta(),
  ]);


  //  Aggregation for existing stats
  const stats = await Booking.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        status: "$_id",
        count: 1,
      },
    },
  ]);

  //  Include missing statuses (0 count)
  const allStatuses = Object.values(BookingStatus);
  const mergedStats = allStatuses.map((status) => {
    const found = stats.find((s) => s.status === status);
    return {
      status,
      count: found ? found.count : 0,
    };
  });

  return {
    bookings: data,
    pagination: { ...meta, status: mergedStats },
  };
};

const confirmBooking = async (id: string, guideId: string, isAdmin: boolean = false) => {
  const booking = await Booking.findById(id);

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }

  if (!isAdmin && booking.guideId.toString() !== guideId) {
    throw new AppError(httpStatus.FORBIDDEN, 'You can only confirm your own bookings');
  }

  if (booking.status !== BookingStatus.PENDING) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Only pending bookings can be confirmed');
  }

  booking.status = BookingStatus.CONFIRMED;
  booking.confirmedAt = new Date();
  await booking.save();

  // Populate booking for notification
  const populatedBooking = await Booking.findById(booking._id)
    .populate('tourId', 'title')
    .populate('touristId', 'name')
    .populate('guideId', 'name');

  // Send notification to tourist
  if (populatedBooking) {
    await NotificationHelper.notifyBookingConfirmed(populatedBooking);
  }

  return booking;
};

const declineBooking = async (id: string, guideId: string, isAdmin: boolean = false) => {
  const booking = await Booking.findById(id);

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }

  if (!isAdmin && booking.guideId.toString() !== guideId) {
    throw new AppError(httpStatus.FORBIDDEN, 'You can only decline your own bookings');
  }

  if (booking.status !== BookingStatus.PENDING) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Only pending bookings can be declined');
  }

  booking.status = BookingStatus.DECLINED;
  await booking.save();

  // Populate booking for notification
  const populatedBooking = await Booking.findById(booking._id)
    .populate('tourId', 'title')
    .populate('touristId', 'name')
    .populate('guideId', 'name');

  // Send notification to tourist
  if (populatedBooking) {
    await NotificationHelper.notifyBookingDeclined(populatedBooking);
  }

  return booking;
};

const cancelBooking = async (
  id: string,
  userId: string,
  cancellationReason?: string,
  isAdmin: boolean = false
) => {
  const booking = await Booking.findById(id).populate('paymentId');

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }

  if (
    !isAdmin &&
    booking.touristId.toString() !== userId &&
    booking.guideId.toString() !== userId
  ) {
    throw new AppError(httpStatus.FORBIDDEN, 'You can only cancel your own bookings');
  }

  if (
    booking.status !== BookingStatus.PENDING &&
    booking.status !== BookingStatus.CONFIRMED
  ) {
    throw new AppError(httpStatus.BAD_REQUEST, 'This booking cannot be cancelled');
  }

  // If booking was confirmed (paid), reset availability
  if (booking.status === BookingStatus.CONFIRMED && booking.extras?.bookingDate && booking.extras?.startTime) {
    await availabilityServices.resetAvailabilityBooking(
      booking.guideId.toString(),
      new Date(booking.extras.bookingDate),
      booking.extras.startTime,
      booking.numGuests,
      booking.tourId.toString()
    );
  }

  // Update booking status
  booking.status = BookingStatus.CANCELLED;
  booking.cancelledBy = new Types.ObjectId(userId);
  booking.cancelledAt = new Date();
  booking.cancellationReason = cancellationReason || null;

  // If payment was successful, mark for refund and deduct from guide's wallet
  if (booking.paymentStatus === PaymentStatus.SUCCEEDED) {
    booking.paymentStatus = PaymentStatus.REFUND_PENDING;

    // Update payment record if exists
    if (booking.paymentId) {
      await Payment.findByIdAndUpdate(booking.paymentId, {
        status: PAYMENT_STATUS.REFUND_PENDING,
      });
    }

    // Deduct FULL amount from guide's wallet (platform fee not deducted yet)
    const wallet = await WalletModel.findOne({ guideId: booking.guideId });

    if (wallet) {
      // Deduct full amount from balance
      wallet.balance = Math.max(0, wallet.balance - booking.amountTotal);
      
      // Also deduct from totalEarned
      wallet.totalEarned = Math.max(0, wallet.totalEarned - booking.amountTotal);
      
      await wallet.save();
    } 
  }

  await booking.save();

  // Populate booking for notification
  const populatedBooking = await Booking.findById(booking._id)
    .populate('tourId', 'title')
    .populate('touristId', 'name')
    .populate('guideId', 'name');

  // Send notification to both tourist and guide
  if (populatedBooking) {
    await NotificationHelper.notifyBookingCancelled(populatedBooking, userId);
  }

  return booking;
};



const completeBooking = async (id: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findById(id).session(session);

    if (!booking) {
      throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Only confirmed bookings can be completed');
    }

    if (!booking.amountTotal || booking.amountTotal <= 0) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid booking amount');
    }

    const guide = await User.findById(booking.guideId).session(session);
    if (!guide) {
      throw new AppError(httpStatus.NOT_FOUND, 'Guide not found');
    }

    const wallet = await WalletModel.findOne({ guideId: guide._id }).session(session);
    if (!wallet) {
      throw new AppError(httpStatus.NOT_FOUND, 'Wallet not found');
    }

    // Update wallet
    wallet.payableBalance += booking.amountTotal;
    await wallet.save({ session });

    // Update booking status
    booking.status = BookingStatus.COMPLETED;
    booking.completedAt = new Date();
    await booking.save({ session });

    // commit if everything ok
    await session.commitTransaction();
    session.endSession();

    // Populate for notification (outside transaction)
    const populatedBooking = await Booking.findById(booking._id)
      .populate('tourId', 'title')
      .populate('touristId', 'name')
      .populate('guideId', 'name');

    if (populatedBooking) {
      await NotificationHelper.notifyBookingCompleted(populatedBooking);
    }

    return booking;

  } catch (error) {
    // rollback
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const bookingServices = {
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
