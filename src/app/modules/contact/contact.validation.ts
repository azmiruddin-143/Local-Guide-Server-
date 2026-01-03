import { z } from 'zod';
import { InquiryType } from './contact.interface';

export const createContactZodSchema = z.object({
    fullName: z
      .string()
      .min(1, 'Full name is required')
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name must not exceed 100 characters'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email address'),
    phoneNumber: z
      .string()
      .optional(),
    inquiryType: z.nativeEnum(InquiryType),
    subject: z
      .string()
      .min(1, 'Subject is required')
      .min(3, 'Subject must be at least 3 characters')
      .max(200, 'Subject must not exceed 200 characters'),
    message: z
      .string()
      .min(1, 'Message is required')
      .min(10, 'Message must be at least 10 characters')
      .max(1000, 'Message must not exceed 1000 characters'),
});
