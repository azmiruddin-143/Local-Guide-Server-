import { Schema, model } from 'mongoose';
import { IReview, ReviewTargetType } from './review.interface';

const reviewSchema = new Schema<IReview>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    tourId: {
      type: Schema.Types.ObjectId,
      ref: 'Tour',
      required: true,
    },
    guideId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    target: {
      type: String,
      enum: Object.values(ReviewTargetType),
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    content: {
      type: String,
      default: null,
    },
    photos: {
      type: [String],
      default: [],
    },
    experienceTags: {
      type: [String],
      default: [],
    },
    helpfulCount: {
      type: Number,
      default: 0,
    },
    verifiedBooking: {
      type: Boolean,
      default: true,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);


export const Review = model<IReview>('Review', reviewSchema);
