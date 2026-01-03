import { Types } from 'mongoose';

export enum TourCategory {
  FOOD = 'FOOD',
  HISTORY = 'HISTORY',
  ADVENTURE = 'ADVENTURE',
  ART = 'ART',
  NIGHTLIFE = 'NIGHTLIFE',
  SHOPPING = 'SHOPPING',
  PHOTOGRAPHY = 'PHOTOGRAPHY',
  NATURE = 'NATURE',
  CULTURE = 'CULTURE',
  OTHER = 'OTHER',
}

export interface ITour {
  _id?: Types.ObjectId;
  guideId: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  itinerary?: string | null;
  city: string;
  country: string;
  meetingPoint: string;
  category: TourCategory;
  languages: string[];
  mediaUrls: string[];
  includedItems?: string[];
  excludedItems?: string[];
  reviewCount?: number;
  averageRating?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
