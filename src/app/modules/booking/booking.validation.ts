import { z } from 'zod';

export const createBookingZodSchema = z.object({
    tourId: z.string().min(1, 'Tour ID is required'),
    availabilityId: z.string().min(1, 'Availability ID is required'),
    startAt: z.string().datetime('Invalid date format'),
    endAt: z.string().datetime('Invalid date format').optional(),
    numGuests: z.number().int().positive('Number of guests must be positive'),
    specialRequests: z.string().nullable().optional(),
});

export const updateBookingStatusZodSchema = z.object({
    status: z.enum(['CONFIRMED', 'DECLINED', 'CANCELLED', 'COMPLETED']),
    cancellationReason: z.string().optional(),
});

export const cancelBookingZodSchema = z.object({
    cancellationReason: z.string().min(1, 'Cancellation reason is required'),
});
