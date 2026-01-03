import { PipelineStage, Types } from 'mongoose';
import { Tour } from '../tour/tour.model';
import { Booking } from '../booking/booking.model';
import { Payment } from '../payment/payment.model';
import { Payout } from '../payout/payout.model';
import { Review } from '../review/review.model';
import { WalletModel } from '../wallet/wallet.model';
import { BookingStatus, PaymentStatus } from '../booking/booking.interface';
import { PAYMENT_STATUS } from '../payment/payment.interface';
import { PayoutStatus } from '../payout/payout.interface';

/**
 * Get comprehensive guide dashboard statistics
 */
export const getGuideDashboardStats = async (guideId: string) => {
  const guideObjectId = new Types.ObjectId(guideId);

  // Tours Statistics Pipeline
  const tourStatsPipeline: PipelineStage[] = [
    {
      $match: { guideId: guideObjectId },
    },
    {
      $facet: {
        totalTours: [{ $count: 'count' }],
        activeTours: [
          {
            $match: { isActive: true },
          },
          { $count: 'count' },
        ],
        inactiveTours: [
          {
            $match: { isActive: false },
          },
          { $count: 'count' },
        ],
        toursByCategory: [
          {
            $group: {
              _id: '$category',
              count: { $sum: 1 },
              avgRating: { $avg: '$averageRating' },
            },
          },
          {
            $sort: { count: -1 },
          },
        ],
        topRatedTours: [
          {
            $match: {
              isActive: true,
              reviewCount: { $gt: 0 },
            },
          },
          {
            $sort: { averageRating: -1, reviewCount: -1 },
          },
          {
            $limit: 5,
          },
          {
            $project: {
              title: 1,
              slug: 1,
              category: 1,
              averageRating: 1,
              reviewCount: 1,
            },
          },
        ],
      },
    },
  ];

  // Bookings Statistics Pipeline
  const bookingStatsPipeline: PipelineStage[] = [
    {
      $match: { guideId: guideObjectId },
    },
    {
      $facet: {
        totalBookings: [{ $count: 'count' }],
        bookingsByStatus: [
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              totalAmount: { $sum: '$amountTotal' },
            },
          },
        ],
        upcomingBookings: [
          {
            $match: {
              status: { $in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
              startAt: { $gte: new Date() },
            },
          },
          {
            $sort: { startAt: 1 },
          },
          {
            $limit: 10,
          },
          {
            $lookup: {
              from: 'tours',
              localField: 'tourId',
              foreignField: '_id',
              as: 'tour',
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'touristId',
              foreignField: '_id',
              as: 'tourist',
            },
          },
          {
            $unwind: '$tour',
          },
          {
            $unwind: '$tourist',
          },
          {
            $project: {
              'tour.title': 1,
              'tourist.name': 1,
              'tourist.email': 1,
              startAt: 1,
              numGuests: 1,
              amountTotal: 1,
              status: 1,
              paymentStatus: 1,
            },
          },
        ],
        recentBookings: [
          {
            $sort: { createdAt: -1 },
          },
          {
            $limit: 10,
          },
          {
            $lookup: {
              from: 'tours',
              localField: 'tourId',
              foreignField: '_id',
              as: 'tour',
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'touristId',
              foreignField: '_id',
              as: 'tourist',
            },
          },
          {
            $unwind: '$tour',
          },
          {
            $unwind: '$tourist',
          },
          {
            $project: {
              'tour.title': 1,
              'tourist.name': 1,
              amountTotal: 1,
              status: 1,
              paymentStatus: 1,
              createdAt: 1,
            },
          },
        ],
        monthlyBookings: [
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
              },
              count: { $sum: 1 },
              totalAmount: { $sum: '$amountTotal' },
            },
          },
          {
            $sort: { '_id.year': -1, '_id.month': -1 },
          },
          {
            $limit: 12,
          },
        ],
      },
    },
  ];

  // Earnings Statistics Pipeline
  const earningsStatsPipeline: PipelineStage[] = [
    {
      $match: { status: PAYMENT_STATUS.PAID },
    },
    {
      $lookup: {
        from: 'bookings',
        localField: 'bookingId',
        foreignField: '_id',
        as: 'booking',
      },
    },
    {
      $unwind: '$booking',
    },
    {
      $match: { 'booking.guideId': guideObjectId },
    },
    {
      $facet: {
        totalEarnings: [
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
        ],
        monthlyEarnings: [
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
              },
              earnings: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
          {
            $sort: { '_id.year': -1, '_id.month': -1 },
          },
          {
            $limit: 12,
          },
        ],
        earningsByTour: [
          {
            $group: {
              _id: '$booking.tourId',
              earnings: { $sum: '$amount' },
              bookings: { $sum: 1 },
            },
          },
          {
            $sort: { earnings: -1 },
          },
          {
            $limit: 10,
          },
          {
            $lookup: {
              from: 'tours',
              localField: '_id',
              foreignField: '_id',
              as: 'tour',
            },
          },
          {
            $unwind: '$tour',
          },
          {
            $project: {
              'tour.title': 1,
              'tour.slug': 1,
              earnings: 1,
              bookings: 1,
            },
          },
        ],
      },
    },
  ];

  // Payout Statistics Pipeline
  const payoutStatsPipeline: PipelineStage[] = [
    {
      $match: { guideId: guideObjectId },
    },
    {
      $facet: {
        totalPayouts: [{ $count: 'count' }],
        payoutsByStatus: [
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              totalAmount: { $sum: '$amount' },
              totalPlatformFee: { $sum: '$platformFee' },
              totalNetAmount: { $sum: '$netAmount' },
            },
          },
        ],
        totalPaidOut: [
          {
            $match: { status: PayoutStatus.SENT },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$netAmount' },
              count: { $sum: 1 },
            },
          },
        ],
        pendingPayouts: [
          {
            $match: { status: PayoutStatus.PENDING },
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              totalAmount: { $sum: '$amount' },
              totalNetAmount: { $sum: '$netAmount' },
            },
          },
        ],
        recentPayouts: [
          {
            $sort: { createdAt: -1 },
          },
          {
            $limit: 10,
          },
          {
            $project: {
              amount: 1,
              platformFee: 1,
              netAmount: 1,
              status: 1,
              requestedAt: 1,
              processedAt: 1,
            },
          },
        ],
      },
    },
  ];

  // Reviews Statistics Pipeline
  const reviewStatsPipeline: PipelineStage[] = [
    {
      $match: { guideId: guideObjectId },
    },
    {
      $facet: {
        totalReviews: [{ $count: 'count' }],
        reviewsByRating: [
          {
            $group: {
              _id: '$rating',
              count: { $sum: 1 },
            },
          },
          {
            $sort: { _id: -1 },
          },
        ],
        averageRating: [
          {
            $group: {
              _id: null,
              avgRating: { $avg: '$rating' },
            },
          },
        ],
        recentReviews: [
          {
            $sort: { createdAt: -1 },
          },
          {
            $limit: 10,
          },
          {
            $lookup: {
              from: 'users',
              localField: 'authorId',
              foreignField: '_id',
              as: 'author',
            },
          },
          {
            $lookup: {
              from: 'tours',
              localField: 'tourId',
              foreignField: '_id',
              as: 'tour',
            },
          },
          {
            $unwind: '$author',
          },
          {
            $unwind: '$tour',
          },
          {
            $project: {
              'author.name': 1,
              'author.avatarUrl': 1,
              'tour.title': 1,
              rating: 1,
              content: 1,
              target: 1,
              createdAt: 1,
            },
          },
        ],
      },
    },
  ];

  // Wallet Statistics
  const walletStats = await WalletModel.findOne({ guideId: guideObjectId }).lean();

  // Execute all pipelines in parallel
  const [tourStats, bookingStats, earningsStats, payoutStats, reviewStats] = await Promise.all([
    Tour.aggregate(tourStatsPipeline),
    Booking.aggregate(bookingStatsPipeline),
    Payment.aggregate(earningsStatsPipeline),
    Payout.aggregate(payoutStatsPipeline),
    Review.aggregate(reviewStatsPipeline),
  ]);

  // Format and return comprehensive guide stats
  return {
    tours: {
      total: tourStats[0].totalTours[0]?.count || 0,
      active: tourStats[0].activeTours[0]?.count || 0,
      inactive: tourStats[0].inactiveTours[0]?.count || 0,
      byCategory: tourStats[0].toursByCategory,
      topRated: tourStats[0].topRatedTours,
    },
    bookings: {
      total: bookingStats[0].totalBookings[0]?.count || 0,
      byStatus: bookingStats[0].bookingsByStatus,
      upcoming: bookingStats[0].upcomingBookings,
      recent: bookingStats[0].recentBookings,
      monthly: bookingStats[0].monthlyBookings,
    },
    earnings: {
      total: earningsStats[0].totalEarnings[0]?.total || 0,
      totalTransactions: earningsStats[0].totalEarnings[0]?.count || 0,
      monthly: earningsStats[0].monthlyEarnings,
      byTour: earningsStats[0].earningsByTour,
    },
    payouts: {
      total: payoutStats[0].totalPayouts[0]?.count || 0,
      byStatus: payoutStats[0].payoutsByStatus,
      totalPaidOut: payoutStats[0].totalPaidOut[0]?.total || 0,
      pending: payoutStats[0].pendingPayouts[0] || { count: 0, totalAmount: 0, totalNetAmount: 0 },
      recent: payoutStats[0].recentPayouts,
    },
    reviews: {
      total: reviewStats[0].totalReviews[0]?.count || 0,
      byRating: reviewStats[0].reviewsByRating,
      average: reviewStats[0].averageRating[0]?.avgRating || 0,
      recent: reviewStats[0].recentReviews,
    },
    wallet: {
      balance: walletStats?.balance || 0,
      pendingBalance: walletStats?.pendingBalance || 0,
      totalEarned: walletStats?.totalEarned || 0,
      totalPlatformFee: walletStats?.totalPlatformFee || 0,
    },
  };
};

/**
 * Get guide performance metrics
 */
export const getGuidePerformanceMetrics = async (guideId: string) => {
  const guideObjectId = new Types.ObjectId(guideId);

  const pipeline: PipelineStage[] = [
    {
      $match: { guideId: guideObjectId },
    },
    {
      $facet: {
        completionRate: [
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ],
        averageBookingValue: [
          {
            $match: {
              status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
            },
          },
          {
            $group: {
              _id: null,
              avgValue: { $avg: '$amountTotal' },
              totalBookings: { $sum: 1 },
            },
          },
        ],
        cancellationRate: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              cancelled: {
                $sum: {
                  $cond: [{ $eq: ['$status', BookingStatus.CANCELLED] }, 1, 0],
                },
              },
            },
          },
        ],
        repeatCustomers: [
          {
            $match: {
              status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
            },
          },
          {
            $group: {
              _id: '$touristId',
              bookings: { $sum: 1 },
            },
          },
          {
            $match: {
              bookings: { $gt: 1 },
            },
          },
          {
            $count: 'count',
          },
        ],
      },
    },
  ];

  const result = await Booking.aggregate(pipeline);
  return result[0];
};

/**
 * Get guide earnings breakdown
 */
export const getGuideEarningsBreakdown = async (guideId: string, startDate?: Date, endDate?: Date) => {
  const guideObjectId = new Types.ObjectId(guideId);
  
  const matchStage: any = { status: PAYMENT_STATUS.PAID };
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = startDate;
    if (endDate) matchStage.createdAt.$lte = endDate;
  }

  const pipeline: PipelineStage[] = [
    {
      $match: matchStage,
    },
    {
      $lookup: {
        from: 'bookings',
        localField: 'bookingId',
        foreignField: '_id',
        as: 'booking',
      },
    },
    {
      $unwind: '$booking',
    },
    {
      $match: { 'booking.guideId': guideObjectId },
    },
    {
      $facet: {
        dailyEarnings: [
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' },
              },
              earnings: { $sum: '$amount' },
              bookings: { $sum: 1 },
            },
          },
          {
            $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 },
          },
          {
            $limit: 30,
          },
        ],
        weeklyEarnings: [
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                week: { $week: '$createdAt' },
              },
              earnings: { $sum: '$amount' },
              bookings: { $sum: 1 },
            },
          },
          {
            $sort: { '_id.year': -1, '_id.week': -1 },
          },
          {
            $limit: 12,
          },
        ],
        monthlyEarnings: [
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
              },
              earnings: { $sum: '$amount' },
              bookings: { $sum: 1 },
            },
          },
          {
            $sort: { '_id.year': -1, '_id.month': -1 },
          },
          {
            $limit: 12,
          },
        ],
      },
    },
  ];

  const result = await Payment.aggregate(pipeline);
  return result[0];
};
