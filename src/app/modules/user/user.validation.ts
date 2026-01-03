import { z } from 'zod';
import { ERole, IsActive } from './user.interface';

export const createUserZodSchema =  z.object({
    role: z.nativeEnum(ERole),
    email: z.string().email({ message: 'Invalid email address' }),
    password: z
      .string()
      .min(6, { message: 'Password must be at least 6 characters' })
      .optional(),
    name: z.string().min(1, { message: 'Name is required' }),
    bio: z.string().optional(),
    languages: z.array(z.string()).optional(),
    phoneNumber: z.string().optional(),
    location: z.string().optional(),
    // Guide-specific fields
    expertise: z.array(z.string()).optional(),
    dailyRate: z.number().positive().optional(),
    // Tourist-specific fields
    travelPreferences: z.array(z.string()).optional(),
  })


export const updateUserZodSchema = z.object({
    name: z.string().min(1).optional(),
    bio: z.string().optional(),
    languages: z.array(z.string()).optional(),
    phoneNumber: z.string().optional(),
    location: z.string().optional(),
    avatarUrl: z.string().url().optional(),
    // Guide-specific fields
    expertise: z.array(z.string()).optional(),
    dailyRate: z.number().positive().optional(),
    // Tourist-specific fields
    travelPreferences: z.array(z.string()).optional(),
    isActive: z.nativeEnum(IsActive).optional(),
  })


export const updateUserByAdminZodSchema = z.object({
    role: z.nativeEnum(ERole).optional(),
    name: z.string().min(1).optional(),
    bio: z.string().optional(),
    languages: z.array(z.string()).optional(),
    phoneNumber: z.string().optional(),
    location: z.string().optional(),
    isVerified: z.boolean().optional(),
    isActive: z.nativeEnum(IsActive).optional(),
    isDeleted: z.boolean().optional(),
    // Guide-specific fields
    expertise: z.array(z.string()).optional(),
    dailyRate: z.number().positive().optional(),
    // Tourist-specific fields
    travelPreferences: z.array(z.string()).optional(),
  })
