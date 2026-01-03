import { z } from 'zod';
import { TourCategory } from './tour.interface';

export const createTourZodSchema = z.object({

    title: z.string().min(1, 'Title is required'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    itinerary: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    country: z.string().min(1, 'Country is required'),
    meetingPoint: z.string().min(1, 'Meeting point is required'),
    category: z.nativeEnum(TourCategory),
    languages: z.array(z.string()).min(1, 'At least one language is required'),
    includedItems: z.array(z.string()).optional(),
    excludedItems: z.array(z.string()).optional(),

});

export const updateTourZodSchema = z.object({

    title: z.string().min(1).optional(),
    description: z.string().min(10).optional(),
    itinerary: z.string().optional(),
    mediaUrls: z.array(z.string()).optional(),
    city: z.string().min(1).optional(),
    country: z.string().min(1).optional(),
    meetingPoint: z.string().min(1).optional(),
    category: z.nativeEnum(TourCategory).optional(),
    languages: z.array(z.string()).optional(),
    includedItems: z.array(z.string()).optional(),
    excludedItems: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
});
