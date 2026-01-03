import { Payment } from './payment.model';
import { Booking } from '../booking/booking.model';
import { BookingStatus, PaymentStatus } from '../booking/booking.interface';
import AppError from '../../errorHelpers/AppError';
import { StatusCodes as httpStatus } from 'http-status-codes';
import { ISSLCommerz } from './sslCommerz/sslCommerz.interface';
import { SSLService } from './sslCommerz/sslCommerz.service';
import { PAYMENT_STATUS } from './payment.interface';
import { availabilityServices } from '../availability/availability.service';
import { WalletModel } from '../wallet/wallet.model';
import { settingsService } from '../settings/settings.service';
import { QueryBuilder } from '../../utils/QueryBuilder';
import { PaymentSearchableFields } from '../../constants';
import { NotificationHelper } from '../notification/notification.helper';

const getTransactionId = () => {
  return `TXN_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
};

const initiatePayment = async (bookingId: string, userId: string) => {
  const session = await Payment.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findById(bookingId)
      .populate('touristId')
      .populate('tourId');

    if (!booking) {
      throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
    }

    if (booking.touristId._id.toString() !== userId) {
      throw new AppError(httpStatus.FORBIDDEN, 'You can only pay for your own bookings');
    }

    if (booking.paymentStatus !== PaymentStatus.PENDING) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Payment already processed');
    }

    // Check availability before initiating payment
    if (booking.extras?.bookingDate && booking.extras?.startTime) {
      const availabilityCheck = await availabilityServices.checkAvailability(
        booking.guideId.toString(),
        new Date(booking.extras.bookingDate),
        booking.extras.startTime
      );

      if (!availabilityCheck.available) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Cannot proceed with payment: ${availabilityCheck.reason}. Please select a different date/time.`
        );
      }

      // Check if enough slots available for the number of guests
      if (availabilityCheck.availableSlots && availabilityCheck.availableSlots < booking.numGuests) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Only ${availabilityCheck.availableSlots} slots available, but you requested ${booking.numGuests} guests.`
        );
      }
    }

    const transactionId = getTransactionId();

    // Create payment record
    const payment = await Payment.create(
      [
        {
          bookingId,
          amount: booking.amountTotal,
          currency: 'BDT', // SSLCommerz uses BDT
          provider: 'sslcommerz',
          transactionId: transactionId,
          status: 'INITIATED',
        },
      ],
      { session }
    );

    // Update booking payment status
    await Booking.findByIdAndUpdate(
      bookingId,
      { paymentStatus: PaymentStatus.INITIATED,paymentId: payment[0]._id },
      { session }
    );

    const tourist = booking.touristId as any;

    // Prepare SSLCommerz payload
    const sslPayload: ISSLCommerz = {
      address: tourist.location || 'Bangladesh',
      email: tourist.email,
      phoneNumber: tourist.phoneNumber || '01700000000',
      name: tourist.name,
      amount: booking.amountTotal,
      transactionId: transactionId,
    };

    // Initialize SSLCommerz payment
    const sslPayment = await SSLService.sslPaymentInit(sslPayload);

    await session.commitTransaction();
    session.endSession();

    return {
      payment: payment[0],
      paymentUrl: sslPayment,
      transactionId,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const successPayment = async (query: Record<string, string>, body: any) => {
  const session = await Payment.startSession();
  session.startTransaction();

  try {
    // Validate payment with SSLCommerz
    const data = await SSLService.validatepayment(body);
    
    console.log(data);
    

    // Update payment status
    const updatedPayment = await Payment.findOneAndUpdate(
      { transactionId: query.tran_id },
      {
        status: PAYMENT_STATUS.PAID,
        paymentGatewayData: data
      },
      { new: true, session }
    );
     
    if (!updatedPayment) {
      throw new AppError(httpStatus.NOT_FOUND, 'Payment not found');
    }

    // Get booking details
    const booking = await Booking.findById(updatedPayment.bookingId).session(session);
    
    if (!booking) {
      throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
    }

    // Update booking payment status (keep status as PENDING for guide confirmation)
    booking.paymentStatus = PaymentStatus.SUCCEEDED;
    booking.status = BookingStatus.PENDING; // Guide needs to confirm
    await booking.save({ session });

    // Update availability - mark as booked (optional, don't fail payment if not found)
    if (booking.extras?.bookingDate && booking.extras?.startTime) {
      try {
        await availabilityServices.updateAvailabilityBooking(
          booking.guideId.toString(),
          new Date(booking.extras.bookingDate),
          booking.extras.startTime,
          booking.tourId.toString(),
          booking.numGuests
        );
      } catch (error: any) {
        // Log warning but don't fail the payment
        console.warn('Failed to update availability:', error.message);
        console.warn('Booking will proceed without availability update');
      }
    }

    // Update guide wallet - add FULL amount to balance and totalEarned
    // Platform fee will be deducted when guide requests payout
    let wallet = await WalletModel.findOne({ guideId: booking.guideId }).session(session);
    
    if (!wallet) {
      // Create wallet if doesn't exist
      const newWallets = await WalletModel.create([{
        guideId: booking.guideId,
        balance: booking.amountTotal,
        pendingBalance: 0,
        totalEarned: booking.amountTotal,
        totalPlatformFee: 0,
        transactions: [updatedPayment._id],
      }], { session });
      wallet = newWallets[0];
    } else {
      // Update existing wallet - add FULL amount to balance and totalEarned
      wallet.balance += booking.amountTotal;
      wallet.totalEarned += booking.amountTotal;
      if (!wallet.transactions.includes(updatedPayment._id)) {
        wallet.transactions.push(updatedPayment._id);
      }
      await wallet.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    // Populate booking for notification
    const populatedBooking = await Booking.findById(booking._id)
      .populate('tourId', 'title')
      .populate('touristId', 'name')
      .populate('guideId', 'name');

    // Send notification to both tourist and guide
    if (populatedBooking) {
      await NotificationHelper.notifyPaymentSuccess(updatedPayment, populatedBooking);
    }

    return { success: true, message: 'Payment completed successfully', bookingId: booking._id };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const failPayment = async (query: Record<string, string>) => {
  const session = await Payment.startSession();
  session.startTransaction();

  try {
    const updatedPayment = await Payment.findOneAndUpdate(
      { transactionId: query.tran_id },
      { status: 'FAILED', metadata: query },
      { new: true, runValidators: true, session }
    );

    if (!updatedPayment) {
      throw new AppError(httpStatus.NOT_FOUND, 'Payment not found');
    }

    await Booking.findByIdAndUpdate(
      updatedPayment.bookingId,
      { paymentStatus: PaymentStatus.FAILED },
      { new: true, runValidators: true, session }
    );

    await session.commitTransaction();
    session.endSession();

    // Get booking for notification
    const booking = await Booking.findById(updatedPayment.bookingId)
      .populate('tourId', 'title')
      .populate('touristId', 'name');

    // Send notification to tourist
    if (booking) {
      await NotificationHelper.notifyPaymentFailed(updatedPayment, booking);
    }

    return { success: false, message: 'Payment failed' };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const cancelPayment = async (query: Record<string, string>) => {
  const session = await Payment.startSession();
  session.startTransaction();

  try {
    const updatedPayment = await Payment.findOneAndUpdate(
      { transactionId: query.tran_id },
      { status: PAYMENT_STATUS.CANCELLED, metadata: query },
      { new: true, runValidators: true, session }
    );

    if (!updatedPayment) {
      throw new AppError(httpStatus.NOT_FOUND, 'Payment not found');
    }

    // Keep booking payment status as PENDING so user can retry
    await Booking.findByIdAndUpdate(
      updatedPayment.bookingId,
      { paymentStatus: PaymentStatus.PENDING },
      { new: true, runValidators: true, session }
    );

    await session.commitTransaction();
    session.endSession();

    return { success: false, message: 'Payment cancelled by user' };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const getPaymentByBooking = async (bookingId: string, userId: string) => {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }

  if (
    booking.touristId.toString() !== userId &&
    booking.guideId.toString() !== userId
  ) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to view this payment');
  }

  const payment = await Payment.findOne({ bookingId });

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment not found');
  }

  return payment;
};

const retryPayment = async (bookingId: string, userId: string) => {
  const booking = await Booking.findById(bookingId).populate('touristId');

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }

  if (booking.touristId._id.toString() !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, 'You can only retry payment for your own bookings');
  }

  const existingPayment = await Payment.findOne({ bookingId });

  if (!existingPayment) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment record not found');
  }

  if (existingPayment.status === PAYMENT_STATUS.PAID) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Payment already completed');
  }

  // Generate new transaction ID
  const newTransactionId = getTransactionId();

  // Update payment record
  existingPayment.transactionId = newTransactionId;
  existingPayment.status = PAYMENT_STATUS.UNPAID;
  await existingPayment.save();

  const tourist = booking.touristId as any;

  // Prepare SSLCommerz payload
  const sslPayload: ISSLCommerz = {
    address: tourist.location || 'Bangladesh',
    email: tourist.email,
    phoneNumber: tourist.phoneNumber || '01700000000',
    name: tourist.name,
    amount: booking.amountTotal,
    transactionId: newTransactionId,
  };

  // Initialize SSLCommerz payment
  const sslPayment = await SSLService.sslPaymentInit(sslPayload);

  return {
    payment: existingPayment,
    paymentUrl: sslPayment,
    transactionId: newTransactionId,
  };
};

const refundPayment = async (
  paymentId: string,
  refundData: {
    refundReason: string;
    refundAmount: number;
    adminNotes?: string;
  }
) => {
  const session = await Payment.startSession();
  session.startTransaction();

  try {
    // Validate refundData exists
    if (!refundData) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Refund data is required');
    }

    const payment = await Payment.findById(paymentId).session(session);

    if (!payment) {
      throw new AppError(httpStatus.NOT_FOUND, 'Payment not found');
    }

    if (payment.status !== PAYMENT_STATUS.REFUND_PENDING) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Only refund pending payments can be refunded'
      );
    }

    // Validate refund reason
    if (!refundData.refundReason || !refundData.refundReason.trim()) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Refund reason is required');
    }

    // Validate refund amount
    if (
      !refundData.refundAmount ||
      refundData.refundAmount <= 0 ||
      refundData.refundAmount > payment.amount
    ) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid refund amount');
    }

    // Get booking
    const booking = await Booking.findById(payment.bookingId).session(session);

    if (!booking) {
      throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
    }

    // Update payment status and add refund metadata
    payment.status = PAYMENT_STATUS.REFUNDED;
    payment.metadata = {
      ...payment.metadata,
      refundReason: refundData.refundReason,
      refundAmount: refundData.refundAmount,
      adminNotes: refundData.adminNotes || '',
      refundedAt: new Date().toISOString(),
    };
    await payment.save({ session });

    // Update booking payment status and add refund info
    booking.paymentStatus = PaymentStatus.REFUNDED;
    booking.refundReason = refundData.refundReason;
    await booking.save({ session });

    // Note: Guide's wallet was already deducted in cancelBooking
    // No need to deduct again here

    await session.commitTransaction();
    session.endSession();

    // Get booking for notification
    const populatedBooking = await Booking.findById(booking._id)
      .populate('tourId', 'title')
      .populate('touristId', 'name');

    // Send notification to tourist
    if (populatedBooking) {
      await NotificationHelper.notifyPaymentRefunded(payment, populatedBooking);
    }

    return payment;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const getMyPaymentHistory = async (userId: string, query: Record<string, string>) => {
  // Get bookings for this tourist
  const bookings = await Booking.find({ touristId: userId }).select('_id');
  const bookingIds = bookings.map(b => b._id);

  // Build base query with tourist's bookings
  const baseQuery = Payment.find({ bookingId: { $in: bookingIds } })
    .populate({
      path: 'bookingId',
      populate: [
        { path: 'tourId', select: 'title mediaUrls city country' },
        { path: 'guideId', select: 'name avatarUrl' }
      ]
    });

  const paymentQuery = new QueryBuilder(baseQuery, query)
    .search(PaymentSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, meta] = await Promise.all([
    paymentQuery.build().exec(),
    paymentQuery.getMeta(),
  ]);

  // Calculate stats by status
  const statsData = await Payment.aggregate([
    { $match: { bookingId: { $in: bookingIds } } },
    {
      $group: {
        _id: "$status",
        totalAmount: { $sum: "$amount" },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        status: "$_id",
        totalAmount: 1,
        count: 1
      }
    }
  ]);

  // Create default stats structure
  const defaultStats: Record<string, { totalAmount: number; count: number }> = {};
  Object.values(PAYMENT_STATUS).forEach(status => {
    defaultStats[status] = { totalAmount: 0, count: 0 };
  });

  // Merge aggregated values into default structure
  statsData.forEach(item => {
    defaultStats[item.status] = {
      totalAmount: item.totalAmount,
      count: item.count
    };
  });

  return {
    payments: data,
    meta: {
      ...meta,
      stats: defaultStats
    }
  };
};

const getAllPaymentsAdmin = async (query: Record<string, string>) => {
  const paymentQuery = new QueryBuilder(
    Payment.find()
      .populate({
        path: 'bookingId',
        populate: [
          { path: 'tourId', select: 'title mediaUrls city country' },
          { path: 'touristId', select: 'name email avatarUrl' },
          { path: 'guideId', select: 'name email avatarUrl' }
        ]
      }),
    query
  )
    .search(PaymentSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, meta] = await Promise.all([
    paymentQuery.build().exec(),
    paymentQuery.getMeta(),
  ]);

  // Calculate stats by status
  const statsData = await Payment.aggregate([
    {
      $group: {
        _id: "$status",
        totalAmount: { $sum: "$amount" },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        status: "$_id",
        totalAmount: 1,
        count: 1
      }
    }
  ]);

  // Create default stats structure
  const defaultStats: Record<string, { totalAmount: number; count: number }> = {};
  Object.values(PAYMENT_STATUS).forEach(status => {
    defaultStats[status] = { totalAmount: 0, count: 0 };
  });

  // Merge aggregated values into default structure
  statsData.forEach(item => {
    defaultStats[item.status] = {
      totalAmount: item.totalAmount,
      count: item.count
    };
  });

  return {
    payments: data,
    meta: {
      ...meta,
      stats: defaultStats
    }
  };
};

export const paymentServices = {
  initiatePayment,
  successPayment,
  failPayment,
  cancelPayment,
  getPaymentByBooking,
  retryPayment,
  refundPayment,
  getMyPaymentHistory,
  getAllPaymentsAdmin,
};
