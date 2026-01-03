import { PipelineStage } from 'mongoose';
import { User } from '../user/user.model';
import { Tour } from '../tour/tour.model';
import { Booking } from '../booking/booking.model';
import { Payment } from '../payment/payment.model';
import { Payout } from '../payout/payout.model';
import { Review } from '../review/review.model';
import { WalletModel } from '../wallet/wallet.model';
import { Subscribe } from '../subscribe/subscribe.model';
import { Contact } from '../contact/contact.model';
import { BookingStatus, PaymentStatus } from '../booking/booking.interface';
import { PAYMENT_STATUS } from '../payment/payment.interface';
import { PayoutStatus } from '../payout/payout.interface';

/**
 * Get comprehensive platform statistics for admin dashboard
 * Includes users, tours, bookings, payments, revenue, payouts, reviews, etc.
 */
export const getAdminPlatformStats = async () => {
  // User Statistics Pipeline
  const userStatsPipeline: PipelineStage[] = [
    {
      $facet: {
        totalUsers: [{ $count: 'count' }],
        usersByRole: [
          {
            $group: {
              _id: '$role',
              count: { $sum: 1 },
            },
          },
        ],
        verifiedUsers: [
          {
            $match: { isVerified: true },
          },
          { $count: 'count' },
        ],
        activeUsers: [
          {
            $match: { isActive: 'ACTIVE', isDeleted: false },
          },
          { $count: 'count' },
        ],
        deletedUsers: [
          {
            $match: { isDeleted: true },
          },
          { $count: 'count' },
        ],
        recentUsers: [
          {
            $sort: { createdAt: -1 },
          },
          {
            $limit: 10,
          },
          {
            $project: {
              name: 1,
              email: 1,
              role: 1,
              createdAt: 1,
              isVerified: 1,
            },
          },
        ],
      },
    },
  ];

  // Tour Statistics Pipeline
  const tourStatsPipeline: PipelineStage[] = [
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
            $limit: 10,
          },
          {
            $lookup: {
              from: 'users',
              localField: 'guideId',
              foreignField: '_id',
              as: 'guide',
            },
          },
          {
            $unwind: '$guide',
          },
          {
            $project: {
              title: 1,
              slug: 1,
              category: 1,
              averageRating: 1,
              reviewCount: 1,
              'guide.name': 1,
            },
          },
        ],
      },
    },
  ];

  // Booking Statistics Pipeline
  const bookingStatsPipeline: PipelineStage[] = [
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
        bookingsByPaymentStatus: [
          {
            $group: {
              _id: '$paymentStatus',
              count: { $sum: 1 },
              totalAmount: { $sum: '$amountTotal' },
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

  // Payment & Revenue Statistics Pipeline
  const paymentStatsPipeline: PipelineStage[] = [
    {
      $facet: {
        totalPayments: [{ $count: 'count' }],
        paymentsByStatus: [
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              totalAmount: { $sum: '$amount' },
            },
          },
        ],
        totalRevenue: [
          {
            $match: { status: PAYMENT_STATUS.PAID },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
        ],
        monthlyRevenue: [
          {
            $match: { status: PAYMENT_STATUS.PAID },
          },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
              },
              revenue: { $sum: '$amount' },
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
        revenueByCategory: [
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
            $lookup: {
              from: 'tours',
              localField: 'booking.tourId',
              foreignField: '_id',
              as: 'tour',
            },
          },
          {
            $unwind: '$tour',
          },
          {
            $group: {
              _id: '$tour.category',
              revenue: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
          {
            $sort: { revenue: -1 },
          },
        ],
      },
    },
  ];

  // Payout Statistics Pipeline
  const payoutStatsPipeline: PipelineStage[] = [
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
        totalPlatformFees: [
          {
            $group: {
              _id: null,
              total: { $sum: '$platformFee' },
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
        monthlyPayouts: [
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
              },
              count: { $sum: 1 },
              totalAmount: { $sum: '$amount' },
              totalPlatformFee: { $sum: '$platformFee' },
              totalNetAmount: { $sum: '$netAmount' },
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

  // Review Statistics Pipeline
  const reviewStatsPipeline: PipelineStage[] = [
    {
      $facet: {
        totalReviews: [{ $count: 'count' }],
        reviewsByTarget: [
          {
            $group: {
              _id: '$target',
              count: { $sum: 1 },
              avgRating: { $avg: '$rating' },
            },
          },
        ],
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

  // Wallet Statistics Pipeline
  const walletStatsPipeline: PipelineStage[] = [
    {
      $facet: {
        totalWallets: [{ $count: 'count' }],
        totalBalance: [
          {
            $group: {
              _id: null,
              totalBalance: { $sum: '$balance' },
              totalPendingBalance: { $sum: '$pendingBalance' },
              totalEarned: { $sum: '$totalEarned' },
              totalPlatformFee: { $sum: '$totalPlatformFee' },
            },
          },
        ],
        topEarners: [
          {
            $sort: { totalEarned: -1 },
          },
          {
            $limit: 10,
          },
          {
            $lookup: {
              from: 'users',
              localField: 'guideId',
              foreignField: '_id',
              as: 'guide',
            },
          },
          {
            $unwind: '$guide',
          },
          {
            $project: {
              'guide.name': 1,
              'guide.email': 1,
              balance: 1,
              totalEarned: 1,
              totalPlatformFee: 1,
            },
          },
        ],
      },
    },
  ];

  // Execute all pipelines in parallel
  const [
    userStats,
    tourStats,
    bookingStats,
    paymentStats,
    payoutStats,
    reviewStats,
    walletStats,
    subscriberCount,
    contactCount,
  ] = await Promise.all([
    User.aggregate(userStatsPipeline),
    Tour.aggregate(tourStatsPipeline),
    Booking.aggregate(bookingStatsPipeline),
    Payment.aggregate(paymentStatsPipeline),
    Payout.aggregate(payoutStatsPipeline),
    Review.aggregate(reviewStatsPipeline),
    WalletModel.aggregate(walletStatsPipeline),
    Subscribe.countDocuments({ isActive: true }),
    Contact.countDocuments({ isRead: false }),
  ]);

  // Format and return comprehensive stats
  return {
    users: {
      total: userStats[0].totalUsers[0]?.count || 0,
      byRole: userStats[0].usersByRole.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      verified: userStats[0].verifiedUsers[0]?.count || 0,
      active: userStats[0].activeUsers[0]?.count || 0,
      deleted: userStats[0].deletedUsers[0]?.count || 0,
      recent: userStats[0].recentUsers,
    },
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
      byPaymentStatus: bookingStats[0].bookingsByPaymentStatus,
      recent: bookingStats[0].recentBookings,
      monthly: bookingStats[0].monthlyBookings,
    },
    revenue: {
      total: paymentStats[0].totalRevenue[0]?.total || 0,
      totalTransactions: paymentStats[0].totalRevenue[0]?.count || 0,
      byStatus: paymentStats[0].paymentsByStatus,
      monthly: paymentStats[0].monthlyRevenue,
      byCategory: paymentStats[0].revenueByCategory,
    },
    payouts: {
      total: payoutStats[0].totalPayouts[0]?.count || 0,
      byStatus: payoutStats[0].payoutsByStatus,
      totalPlatformFees: payoutStats[0].totalPlatformFees[0]?.total || 0,
      pending: payoutStats[0].pendingPayouts[0] || { count: 0, totalAmount: 0, totalNetAmount: 0 },
      monthly: payoutStats[0].monthlyPayouts,
    },
    reviews: {
      total: reviewStats[0].totalReviews[0]?.count || 0,
      byTarget: reviewStats[0].reviewsByTarget,
      byRating: reviewStats[0].reviewsByRating,
      recent: reviewStats[0].recentReviews,
    },
    wallets: {
      total: walletStats[0].totalWallets[0]?.count || 0,
      totalBalance: walletStats[0].totalBalance[0]?.totalBalance || 0,
      totalPendingBalance: walletStats[0].totalBalance[0]?.totalPendingBalance || 0,
      totalEarned: walletStats[0].totalBalance[0]?.totalEarned || 0,
      totalPlatformFee: walletStats[0].totalBalance[0]?.totalPlatformFee || 0,
      topEarners: walletStats[0].topEarners,
    },
    subscribers: {
      active: subscriberCount,
    },
    contacts: {
      unread: contactCount,
    },
  };
};

/**
 * Get top performing guides by revenue
 */
export const getTopPerformingGuides = async (limit: number = 10) => {
  const pipeline: PipelineStage[] = [
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
      $group: {
        _id: '$booking.guideId',
        totalRevenue: { $sum: '$amount' },
        totalBookings: { $sum: 1 },
      },
    },
    {
      $sort: { totalRevenue: -1 },
    },
    {
      $limit: limit,
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'guide',
      },
    },
    {
      $unwind: '$guide',
    },
    {
      $project: {
        'guide.name': 1,
        'guide.email': 1,
        'guide.avatarUrl': 1,
        'guide.averageRating': 1,
        'guide.reviewCount': 1,
        totalRevenue: 1,
        totalBookings: 1,
      },
    },
  ];

  return await Payment.aggregate(pipeline);
};

/**
 * Get popular tours by bookings
 */
export const getPopularTours = async (limit: number = 10) => {
  const pipeline: PipelineStage[] = [
    {
      $match: {
        status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
      },
    },
    {
      $group: {
        _id: '$tourId',
        bookingsCount: { $sum: 1 },
        totalRevenue: { $sum: '$amountTotal' },
        totalGuests: { $sum: '$numGuests' },
      },
    },
    {
      $sort: { bookingsCount: -1 },
    },
    {
      $limit: limit,
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
      $lookup: {
        from: 'users',
        localField: 'tour.guideId',
        foreignField: '_id',
        as: 'guide',
      },
    },
    {
      $unwind: '$guide',
    },
    {
      $project: {
        'tour.title': 1,
        'tour.slug': 1,
        'tour.category': 1,
        'tour.city': 1,
        'tour.averageRating': 1,
        'tour.reviewCount': 1,
        'guide.name': 1,
        bookingsCount: 1,
        totalRevenue: 1,
        totalGuests: 1,
      },
    },
  ];

  return await Booking.aggregate(pipeline);
};

/**
 * Get revenue analytics with date range filter
 */
export const getRevenueAnalytics = async (startDate?: Date, endDate?: Date) => {
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
      $facet: {
        totalRevenue: [
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
              count: { $sum: 1 },
              avgTransaction: { $avg: '$amount' },
            },
          },
        ],
        dailyRevenue: [
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' },
              },
              revenue: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
          {
            $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 },
          },
          {
            $limit: 30,
          },
        ],
        monthlyRevenue: [
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
              },
              revenue: { $sum: '$amount' },
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
      },
    },
  ];

  const result = await Payment.aggregate(pipeline);
  return result[0];
};
