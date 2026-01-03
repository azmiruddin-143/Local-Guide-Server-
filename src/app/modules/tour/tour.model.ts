import { Schema, model } from 'mongoose';
import { ITour, TourCategory } from './tour.interface';

const TourSchema = new Schema<ITour>(
  {
    guideId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug : {
      type: String,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    itinerary: {
      type: String,
      default: null,
    },
    city: {
      type: String,
      required: true,
      index: true,
    },
    country: {
      type: String,
      required: true,
    },
    meetingPoint: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: Object.values(TourCategory),
      required: true,
      index: true,
    },
    languages: {
      type: [String],
      default: [],
    },
    mediaUrls: {
      type: [String],
      default: [],
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    includedItems: {
      type: [String],
      default: [],
    },
    excludedItems: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
TourSchema.index({ price: 1 });
TourSchema.index({ city: 1, category: 1 });

export const Tour = model<ITour>('Tour', TourSchema);
