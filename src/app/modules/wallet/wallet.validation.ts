import { z } from 'zod';


export const updateWalletZod = z.object({
  balance: z.number().min(0, 'Balance cannot be negative').optional(),
  pendingBalance: z.number().min(0, 'Pending balance cannot be negative').optional(),
  totalEarned: z.number().min(0, 'Total earned cannot be negative').optional(),
});

export type UpdateWalletInput = z.infer<typeof updateWalletZod>;

