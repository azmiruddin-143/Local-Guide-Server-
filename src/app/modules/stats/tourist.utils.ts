import { PipelineStage, Types } from 'mongoose';
import { Booking } from '../booking/booking.model';
import { Payment } from '../payment/payment.model';
import { Review } from '../review/review.model';
import { BookingStatus} from '../booking/booking.interface';
import { PAYMENT_STATUS } from '../payment/payment.interface';

/**
 * Get comprehensive tourist dashboard statistics
 */
export const getTouristDashboardStats = async (touristId: string) => {
  const touristObjectId = new Types.ObjectId(touristId);

  // Bookings Statistics Pipeline
  const bookingStatsPipeline: PipelineStage[] = [
    {
      $match: { touristId: touristObjectId },
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
        bookingsByPaymentStatus: [
          {
            $group: {
              _id: '$paymentStatus',
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
              localField: 'guideId',
              foreignField: '_id',
              as: 'guide',
            },
          },
          {
            $unwind: '$tour',
          },
          {
            $unwind: '$guide',
          },
          {
            $project: {
              'tour.title': 1,
              'tour.slug': 1,
              'tour.city': 1,
              'tour.mediaUrls': 1,
              'guide.name': 1,
              'guide.avatarUrl': 1,
              startAt: 1,
              numGuests: 1,
              amountTotal: 1,
              status: 1,
              paymentStatus: 1,
            },
          },
        ],
        completedBookings: [
          {
            $match: {
              status: BookingStatus.COMPLETED,
            },
          },
          {
            $sort: { completedAt: -1 },
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
              localField: 'guideId',
              foreignField: '_id',
              as: 'guide',
            },
          },
          {
            $unwind: '$tour',
          },
          {
            $unwind: '$guide',
          },
          {
            $project: {
              'tour.title': 1,
              'tour.slug': 1,
              'tour.city': 1,
              'tour.mediaUrls': 1,
              'guide.name': 1,
              startAt: 1,
              completedAt: 1,
              amountTotal: 1,
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
              localField: 'guideId',
              foreignField: '_id',
              as: 'guide',
            },
          },
          {
            $unwind: '$tour',
          },
          {
            $unwind: '$guide',
          },
          {
            $project: {
              'tour.title': 1,
              'guide.name': 1,
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
        bookingsByCategory: [
          {
            $match: {
              status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
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
            $unwind: '$tour',
          },
          {
            $group: {
              _id: '$tour.category',
              count: { $sum: 1 },
              totalSpent: { $sum: '$amountTotal' },
            },
          },
          {
            $sort: { count: -1 },
          },
        ],
      },
    },
  ];

  // Spending Statistics Pipeline
  const spendingStatsPipeline: PipelineStage[] = [
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
      $match: { 'booking.touristId': touristObjectId },
    },
    {
      $facet: {
        totalSpent: [
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
              count: { $sum: 1 },
              avgTransaction: { $avg: '$amount' },
            },
          },
        ],
        monthlySpending: [
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
              },
              spent: { $sum: '$amount' },
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
        recentPayments: [
          {
            $sort: { createdAt: -1 },
          },
          {
            $limit: 10,
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
            $project: {
              'tour.title': 1,
              amount: 1,
              status: 1,
              transactionId: 1,
              createdAt: 1,
            },
          },
        ],
      },
    },
  ];

  // Reviews Statistics Pipeline
  const reviewStatsPipeline: PipelineStage[] = [
    {
      $match: { authorId: touristObjectId },
    },
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
              from: 'tours',
              localField: 'tourId',
              foreignField: '_id',
              as: 'tour',
            },
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
            $unwind: '$tour',
          },
          {
            $unwind: {
              path: '$guide',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              'tour.title': 1,
              'guide.name': 1,
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



  // Execute all pipelines in parallel
  const [bookingStats, spendingStats, reviewStats] = await Promise.all([
    Booking.aggregate(bookingStatsPipeline),
    Payment.aggregate(spendingStatsPipeline),
    Review.aggregate(reviewStatsPipeline),
  ]);

  // Format and return comprehensive tourist stats
  return {
    bookings: {
      total: bookingStats[0].totalBookings[0]?.count || 0,
      byStatus: bookingStats[0].bookingsByStatus,
      byPaymentStatus: bookingStats[0].bookingsByPaymentStatus,
      upcoming: bookingStats[0].upcomingBookings,
      completed: bookingStats[0].completedBookings,
      recent: bookingStats[0].recentBookings,
      monthly: bookingStats[0].monthlyBookings,
      byCategory: bookingStats[0].bookingsByCategory,
    },
    spending: {
      total: spendingStats[0].totalSpent[0]?.total || 0,
      totalTransactions: spendingStats[0].totalSpent[0]?.count || 0,
      avgTransaction: spendingStats[0].totalSpent[0]?.avgTransaction || 0,
      monthly: spendingStats[0].monthlySpending,
      recentPayments: spendingStats[0].recentPayments,
    },
    reviews: {
      total: reviewStats[0].totalReviews[0]?.count || 0,
      byTarget: reviewStats[0].reviewsByTarget,
      byRating: reviewStats[0].reviewsByRating,
      recent: reviewStats[0].recentReviews,
    },
  };
};

/**
 * Get tourist travel insights
 */
export const getTouristTravelInsights = async (touristId: string) => {
  const touristObjectId = new Types.ObjectId(touristId);

  const pipeline: PipelineStage[] = [
    {
      $match: {
        touristId: touristObjectId,
        status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
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
      $unwind: '$tour',
    },
    {
      $facet: {
        citiesVisited: [
          {
            $group: {
              _id: '$tour.city',
              visits: { $sum: 1 },
              totalSpent: { $sum: '$amountTotal' },
            },
          },
          {
            $sort: { visits: -1 },
          },
        ],
        countriesVisited: [
          {
            $group: {
              _id: '$tour.country',
              visits: { $sum: 1 },
              totalSpent: { $sum: '$amountTotal' },
            },
          },
          {
            $sort: { visits: -1 },
          },
        ],
        favoriteCategories: [
          {
            $group: {
              _id: '$tour.category',
              bookings: { $sum: 1 },
              totalSpent: { $sum: '$amountTotal' },
            },
          },
          {
            $sort: { bookings: -1 },
          },
        ],
        favoriteGuides: [
          {
            $group: {
              _id: '$guideId',
              bookings: { $sum: 1 },
              totalSpent: { $sum: '$amountTotal' },
            },
          },
          {
            $sort: { bookings: -1 },
          },
          {
            $limit: 5,
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
              bookings: 1,
              totalSpent: 1,
            },
          },
        ],
        totalGuests: [
          {
            $group: {
              _id: null,
              total: { $sum: '$numGuests' },
            },
          },
        ],
      },
    },
  ];

  const result = await Booking.aggregate(pipeline);
  return result[0];
};

/**
 * Get tourist spending breakdown
 */
export const getTouristSpendingBreakdown = async (touristId: string, startDate?: Date, endDate?: Date) => {
  const touristObjectId = new Types.ObjectId(touristId);
  
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
      $match: { 'booking.touristId': touristObjectId },
    },
    {
      $facet: {
        dailySpending: [
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' },
              },
              spent: { $sum: '$amount' },
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
        weeklySpending: [
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                week: { $week: '$createdAt' },
              },
              spent: { $sum: '$amount' },
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
        monthlySpending: [
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
              },
              spent: { $sum: '$amount' },
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

/**
 * Get tourist recommendations based on history
 */
export const getTouristRecommendations = async (touristId: string) => {
  const touristObjectId = new Types.ObjectId(touristId);

  // Get tourist's booking history to understand preferences
  const preferences = await Booking.aggregate([
    {
      $match: {
        touristId: touristObjectId,
        status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
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
      $unwind: '$tour',
    },
    {
      $group: {
        _id: null,
        categories: { $addToSet: '$tour.category' },
        cities: { $addToSet: '$tour.city' },
      },
    },
  ]);

  return preferences[0] || { categories: [], cities: [] };
};
