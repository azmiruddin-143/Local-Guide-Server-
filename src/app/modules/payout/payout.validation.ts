import { z } from 'zod';

export const requestPayoutZodSchema = z.object({
  amount: z.number().positive('Amount must be positive').min(100, 'Minimum payout amount is 100 BDT'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  accountDetails: z.object({
    accountNumber: z.string().min(1, 'Account number is required'),
    accountName: z.string().min(1, 'Account name is required'),
    bankName: z.string().optional(),
    branchName: z.string().optional(),
    mobileNumber: z.string().optional(),
  }),
});

export const processPayoutZodSchema = z.object({
  providerPayoutId: z.string().optional(),
});

export const failPayoutZodSchema = z.object({
  failureReason: z.string().min(1, 'Failure reason is required'),
});
