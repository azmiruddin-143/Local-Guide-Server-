import { Types } from 'mongoose';

export enum ReviewTargetType {
  TOUR = 'TOUR',
  GUIDE = 'GUIDE',
}

export interface IReview {
  _id?: Types.ObjectId;
  bookingId: Types.ObjectId;
  tourId: Types.ObjectId;
  guideId?: Types.ObjectId;
  authorId: Types.ObjectId;
  target: ReviewTargetType;
  rating: number;
  content?: string | null;
  photos?: string[];
  experienceTags?: string[];
  helpfulCount: number;
  verifiedBooking: boolean;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}
