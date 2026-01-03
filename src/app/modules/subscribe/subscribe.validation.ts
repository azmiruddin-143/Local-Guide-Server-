import { z } from 'zod';

const subscribeSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please provide a valid email address'),
});

const unsubscribeSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please provide a valid email address'),
});

export const subscribeValidations = {
  subscribeSchema,
  unsubscribeSchema,
};
