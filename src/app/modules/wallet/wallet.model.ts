import { Schema, model } from 'mongoose';
import { IWallet } from './wallet.interface';


// Wallet Schema
const walletSchema = new Schema<IWallet>(
  {
    guideId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    payableBalance: {
      type: Number,
      default: 0,
    },
    pendingBalance: {
      type: Number,
      default: 0,
    },
    totalEarned: {
      type: Number,
      default: 0,
    },
    totalPlatformFee: {
      type: Number,
      default: 0,
    },
    totalReceived: {
      type: Number,
      default: 0,
    },
    transactions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Payment',
      },
    ],
  },
  {
    timestamps: true, 
    versionKey: false, 
  }
);

// Wallet Model
export const WalletModel = model<IWallet>('Wallet', walletSchema);
