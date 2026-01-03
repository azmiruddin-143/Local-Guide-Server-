import { Review } from './review.model';
import { IReview, ReviewTargetType } from './review.interface';
import AppError from '../../errorHelpers/AppError';
import { StatusCodes as httpStatus } from 'http-status-codes';
import { Booking } from '../booking/booking.model';
import { BookingStatus } from '../booking/booking.interface';
import { Types } from 'mongoose';
import { User } from '../user/user.model';
import { Tour } from '../tour/tour.model';
import { QueryBuilder } from '../../utils/QueryBuilder';
import { ReviewSearchableFields } from '../../constants';
import { NotificationHelper } from '../notification/notification.helper';

// Helper function to update guide review statistics
const updateGuideReviewStats = async (guideId: Types.ObjectId) => {
  // Get all guide reviews
  const reviews = await Review.find({ 
    guideId, 
    target: ReviewTargetType.GUIDE 
  });

  const reviewCount = reviews.length;
  const averageRating = reviewCount > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
    : 0;

  // Update guide document
  await User.findByIdAndUpdate(guideId, {
    reviewCount,
    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
  });

  console.log(`Updated guide ${guideId} stats: ${reviewCount} reviews, ${averageRating.toFixed(1)} avg rating`);
};

// Helper function to update tour review statistics
const updateTourReviewStats = async (tourId: Types.ObjectId) => {
  // Get all tour reviews
  const reviews = await Review.find({ 
    tourId, 
    target: ReviewTargetType.TOUR 
  });

  const reviewCount = reviews.length;
  const averageRating = reviewCount > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
    : 0;

  // Update tour document
  await Tour.findByIdAndUpdate(tourId, {
    reviewCount,
    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
  });

  console.log(`Updated tour ${tourId} stats: ${reviewCount} reviews, ${averageRating.toFixed(1)} avg rating`);
};

const createReview = async (touristId: string, payload: Partial<IReview>) => {
  console.log('Creating review with payload:', payload);
  console.log('Tourist ID:', touristId);
  
  // Verify booking exists and belongs to tourist
  const booking = await Booking.findById(payload.bookingId);

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }

  console.log('Booking found:', booking._id);
  console.log('Booking status:', booking.status);

  if (booking.touristId.toString() !== touristId) {
    throw new AppError(httpStatus.FORBIDDEN, 'You can only review your own bookings');
  }

  if (booking.status !== BookingStatus.COMPLETED) {
    throw new AppError(httpStatus.BAD_REQUEST, 'You can only review completed bookings');
  }

  // Check if review already exists for this booking and target
  const existingReview = await Review.findOne({
    bookingId: payload.bookingId,
    target: payload.target,
  });

  if (existingReview) {
    throw new AppError(httpStatus.BAD_REQUEST, `You have already reviewed this ${payload.target?.toLowerCase()}`);
  }

  // Set required fields
  payload.authorId = new Types.ObjectId(touristId);
  payload.tourId = booking.tourId;
  
  console.log('Target:', payload.target);
  console.log('ReviewTargetType.GUIDE:', ReviewTargetType.GUIDE);
  console.log('ReviewTargetType.TOUR:', ReviewTargetType.TOUR);
  
  // Only set guideId for GUIDE reviews
  if (payload.target === ReviewTargetType.GUIDE) {
    payload.guideId = booking.guideId;
    console.log('Setting guideId for GUIDE review:', booking.guideId);
  } else {
    console.log('NOT setting guideId for TOUR review');
  }
  
  payload.verifiedBooking = true;

  console.log('Final payload before create:', payload);

  const review = await Review.create(payload);
  console.log('Review created successfully:', review._id);

  // Update stats based on review target
  if (payload.target === ReviewTargetType.GUIDE && payload.guideId) {
    await updateGuideReviewStats(payload.guideId);
  } else if (payload.target === ReviewTargetType.TOUR) {
    await updateTourReviewStats(booking.tourId);
  }

  // Populate review for notification
  const populatedReview = await Review.findById(review._id)
    .populate('authorId', 'name');

  // Send notification to guide
  if (populatedReview) {
    await NotificationHelper.notifyReviewReceived(populatedReview, booking);
  }

  return review;
};

const updateReview = async (reviewId: string, touristId: string, payload: Partial<IReview>) => {
  const review = await Review.findById(reviewId);

  if (!review) {
    throw new AppError(httpStatus.NOT_FOUND, 'Review not found');
  }

  if (review.authorId.toString() !== touristId) {
    throw new AppError(httpStatus.FORBIDDEN, 'You can only update your own reviews');
  }

  // Check if rating is being updated
  const ratingChanged = payload.rating !== undefined && payload.rating !== review.rating;

  // Update allowed fields
  if (payload.rating !== undefined) review.rating = payload.rating;
  if (payload.content !== undefined) review.content = payload.content;
  if (payload.photos !== undefined) review.photos = payload.photos;
  if (payload.experienceTags !== undefined) review.experienceTags = payload.experienceTags;
  
  review.isEdited = true;
  await review.save();

  // Update stats if rating changed
  if (ratingChanged) {
    if (review.target === ReviewTargetType.GUIDE && review.guideId) {
      await updateGuideReviewStats(review.guideId);
    } else if (review.target === ReviewTargetType.TOUR ) {
      await updateTourReviewStats(review.tourId);
    }
  }

  return review;
};

const deleteReview = async (reviewId: string, touristId: string) => {
  const review = await Review.findById(reviewId);

  if (!review) {
    throw new AppError(httpStatus.NOT_FOUND, 'Review not found');
  }

  if (review.authorId.toString() !== touristId) {
    throw new AppError(httpStatus.FORBIDDEN, 'You can only delete your own reviews');
  }

  // Store review info before deletion
  const reviewTarget = review.target;
  const guideId = review.guideId;
  const tourId = review.tourId;

  await Review.findByIdAndDelete(reviewId);

  // Update stats based on review target
  if (reviewTarget === ReviewTargetType.GUIDE && guideId) {
    await updateGuideReviewStats(guideId);
  } else if (reviewTarget === ReviewTargetType.TOUR) {
    await updateTourReviewStats(tourId);
  }

  return review;
};

const getReviewsByBooking = async (bookingId: string) => {
  const reviews = await Review.find({ bookingId })
    .populate('authorId', 'name avatarUrl')
    .sort({ createdAt: -1 });

  return reviews;
};

const getReviewByBookingAndTarget = async (bookingId: string, target: ReviewTargetType) => {
  const review = await Review.findOne({ bookingId, target })
    .populate('authorId', 'name avatarUrl');

  return review;
};

const getReviewsByTour = async (tourId: string, page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;
  
  const [reviews, total] = await Promise.all([
    Review.find({ tourId, target: ReviewTargetType.TOUR })
      .populate('authorId', 'name avatarUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments({ tourId, target: ReviewTargetType.TOUR })
  ]);

  return {
    reviews,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    }
  };
};

const getReviewsByGuide = async (guideId: string, page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;
  
  const [reviews, total] = await Promise.all([
    Review.find({ guideId, target: ReviewTargetType.GUIDE })
      .populate('authorId', 'name avatarUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments({ guideId, target: ReviewTargetType.GUIDE })
  ]);

  return {
    reviews,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    }
  };
};

const getMyReviews = async (touristId: string) => {
  const reviews = await Review.find({ authorId: touristId })
    .populate('tourId', 'title slug')
    .populate('guideId', 'name avatarUrl')
    .sort({ createdAt: -1 });

  return reviews;
};

// Admin function to get all reviews with pagination
const getAllReviews = async (query: Record<string, string>) => {
  const reviewQuery = new QueryBuilder(
    Review.find()
      .populate('tourId', 'title city')
      .populate('guideId', 'name email avatarUrl')
      .populate('authorId', 'name email avatarUrl')
      .populate('bookingId'),
    query
  )
    .search(ReviewSearchableFields)
    .filter()
    .sort()
    .paginate();

  const [data, meta] = await Promise.all([
    reviewQuery.build().exec(),
    reviewQuery.getMeta(),
  ]);

  const [tourReviews, guideReviews] = await Promise.all([
    Review.countDocuments({ target: ReviewTargetType.TOUR }),
    Review.countDocuments({ target: ReviewTargetType.GUIDE }),
  ]);

  return { 
    reviews: data, 
    pagination: { ...meta, tourReviews, guideReviews } 
  };
};

// Admin function to delete any review
const deleteReviewByAdmin = async (reviewId: string) => {
  const review = await Review.findById(reviewId);

  if (!review) {
    throw new AppError(httpStatus.NOT_FOUND, 'Review not found');
  }

  // Store review info before deletion
  const reviewTarget = review.target;
  const guideId = review.guideId;
  const tourId = review.tourId;

  await Review.findByIdAndDelete(reviewId);

  // Update stats based on review target
  if (reviewTarget === ReviewTargetType.GUIDE && guideId) {
    await updateGuideReviewStats(guideId);
  } else if (reviewTarget === ReviewTargetType.TOUR) {
    await updateTourReviewStats(tourId);
  }

  return review;
};

// Get 3 random 5-star reviews for homepage testimonials
const getBestRandomReviews = async () => {
  const reviews = await Review.aggregate([
    // Match only 5-star reviews with content
    { 
      $match: { 
        rating: 5,
        content: { $exists: true, $ne: '' }
      } 
    },
    // Randomly sample 3 reviews
    { $sample: { size: 3 } },
    // Lookup author details
    {
      $lookup: {
        from: 'users',
        localField: 'authorId',
        foreignField: '_id',
        as: 'author'
      }
    },
    { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
    // Lookup tour details
    {
      $lookup: {
        from: 'tours',
        localField: 'tourId',
        foreignField: '_id',
        as: 'tour'
      }
    },
    { $unwind: { path: '$tour', preserveNullAndEmptyArrays: true } },
    // Project only needed fields
    {
      $project: {
        _id: 1,
        rating: 1,
        content: 1,
        createdAt: 1,
        author: {
          name: '$author.name',
          location: '$author.location',
          avatarUrl: '$author.avatarUrl'
        },
        tour: {
          title: '$tour.title'
        }
      }
    }
  ]);

  return reviews;
};

export const reviewServices = {
  createReview,
  updateReview,
  deleteReview,
  getReviewsByBooking,
  getReviewByBookingAndTarget,
  getReviewsByTour,
  getReviewsByGuide,
  getMyReviews,
  getAllReviews,
  deleteReviewByAdmin,
  getBestRandomReviews,
};
