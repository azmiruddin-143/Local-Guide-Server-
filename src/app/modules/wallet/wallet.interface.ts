import { Document, Types } from 'mongoose';

export interface IWallet extends Document {
  guideId: Types.ObjectId;
  balance: number;
  payableBalance: number;
  pendingBalance: number; 
  totalEarned: number;
  totalPlatformFee: number; 
  totalReceived?: number;
  transactions: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
