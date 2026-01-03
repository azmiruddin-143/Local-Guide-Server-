import { z } from 'zod';
import { ReviewTargetType } from './review.interface';

export const createReviewZodSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  target: z.nativeEnum(ReviewTargetType),
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  content: z.string().optional(),
  photos: z.array(z.string()).optional(),
  experienceTags: z.array(z.string()).optional(),
});

export const updateReviewZodSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  content: z.string().optional(),
  photos: z.array(z.string()).optional(),
  experienceTags: z.array(z.string()).optional(),
});
