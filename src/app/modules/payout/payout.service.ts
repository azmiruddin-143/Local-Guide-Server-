import { Payout } from './payout.model';
import { WalletModel } from '../wallet/wallet.model';
import AppError from '../../errorHelpers/AppError';
import { StatusCodes as httpStatus } from 'http-status-codes';
import { PayoutStatus } from './payout.interface';
import { settingsService } from '../settings/settings.service';
import { QueryBuilder } from '../../utils/QueryBuilder';
import { payoutSearchableFields } from '../../constants';
import { NotificationHelper } from '../notification/notification.helper';
import { User } from '../user/user.model';

const requestPayout = async (guideId: string, payload: any) => {
  // Get guide's wallet
  const wallet = await WalletModel.findOne({ guideId });

  if (!wallet) {
    throw new AppError(httpStatus.NOT_FOUND, 'Wallet not found');
  }

  // Get platform settings for validation
  const settings = await settingsService.getPlatformSettings();

  // Check if requested amount is available
  if (payload.amount > wallet.balance) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Insufficient balance. Available: ${wallet.balance} BDT, Requested: ${payload.amount} BDT`
    );
  }

  // Check minimum payout amount from settings
  if (payload.amount < settings.payout.minimumAmount) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Minimum payout amount is ${settings.payout.minimumAmount} BDT`
    );
  }

  // Calculate platform fee and net amount
  const platformFee = await settingsService.calculatePlatformFee(payload.amount);
  const netAmount = payload.amount - platformFee;

  // Create payout request with fee breakdown
  const payout = await Payout.create({
    ...payload,
    guideId,
    platformFee,
    netAmount,
    currency: 'BDT',
    requestedAt: new Date(),
  });

  // Deduct requested amount from wallet balance (move to pending)
  wallet.balance -= payload.amount;
  wallet.payableBalance -= payload.amount;
  wallet.pendingBalance += payload.amount;
  
  // Track total platform fee
  wallet.totalPlatformFee = (wallet.totalPlatformFee || 0) + platformFee;
  
  await wallet.save();

  // Get guide info for notification
  const guide = await User.findById(guideId).select('name');

  // Send notification to admin
  if (guide) {
    await NotificationHelper.notifyPayoutRequested(payout, guide);
  }

  return payout;
};

const getGuidePayouts = async (guideId: string, query: Record<string, string>) => {
  
  const payoutQuery = new QueryBuilder(Payout.find({ guideId }), query).search(payoutSearchableFields).filter()
    .sort()
    .paginate()
    .fields();

  const [data, meta] = await Promise.all([
    payoutQuery.build().exec(),
    payoutQuery.getMeta(),
  ]);

  return { data, meta };
};

const processPayout = async (id: string, providerPayoutId?: string) => {
  const payout = await Payout.findById(id);

  if (!payout) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payout not found');
  }

  if (payout.status !== PayoutStatus.PENDING) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Only pending payouts can be processed');
  }

  // Get wallet to deduct from pending balance
  const wallet = await WalletModel.findOne({ guideId: payout.guideId });

  if (!wallet) {
    throw new AppError(httpStatus.NOT_FOUND, 'Wallet not found');
  }

  // Update payout status
  payout.status = PayoutStatus.SENT;
  payout.processedAt = new Date();
  if (providerPayoutId) {
    payout.providerPayoutId = providerPayoutId;
  }
  await payout.save();

  // Deduct requested amount from pending balance (not netAmount)
  wallet.pendingBalance = Math.max(0, wallet.pendingBalance - payout.amount);
  wallet.totalReceived = (wallet.totalReceived || 0) + payout.netAmount;

  await wallet.save();

  // Note: Guide receives netAmount (amount - platformFee)
  // Platform keeps the platformFee

  // Send notification to guide
  await NotificationHelper.notifyPayoutProcessed(payout);

  return payout;
};

const failPayout = async (id: string, failureReason: string) => {
  const payout = await Payout.findById(id);

  if (!payout) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payout not found');
  }

  if (payout.status !== PayoutStatus.PENDING) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Only pending payouts can be failed');
  }

  // Get wallet to return amount to balance
  const wallet = await WalletModel.findOne({ guideId: payout.guideId });

  if (!wallet) {
    throw new AppError(httpStatus.NOT_FOUND, 'Wallet not found');
  }

  // Update payout status
  payout.status = PayoutStatus.FAILED;
  payout.failureReason = failureReason;
  payout.processedAt = new Date();
  await payout.save();

  // Return FULL amount to balance from pending (refund platform fee too)
  wallet.balance += payout.amount;
  wallet.pendingBalance = Math.max(0, wallet.pendingBalance - payout.amount);
  
  // Refund platform fee since payout failed
  wallet.totalPlatformFee = Math.max(0, wallet.totalPlatformFee - payout.platformFee);
  
  await wallet.save();

  // Send notification to guide
  await NotificationHelper.notifyPayoutFailed(payout);

  return payout;
};

const cancelPayout = async (id: string, guideId: string) => {
  const payout = await Payout.findById(id);

  if (!payout) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payout not found');
  }

  if (payout.guideId.toString() !== guideId) {
    throw new AppError(httpStatus.FORBIDDEN, 'You can only cancel your own payouts');
  }

  if (payout.status !== PayoutStatus.PENDING) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Only pending payouts can be cancelled');
  }

  // Get wallet to return amount to balance
  const wallet = await WalletModel.findOne({ guideId: payout.guideId });

  if (!wallet) {
    throw new AppError(httpStatus.NOT_FOUND, 'Wallet not found');
  }

  // Update payout status
  payout.status = PayoutStatus.CANCELLED;
  await payout.save();

  // Return FULL amount to balance from pending (refund platform fee too)
  wallet.balance += payout.amount;
  wallet.payableBalance += payout.amount;
  wallet.pendingBalance = Math.max(0, wallet.pendingBalance - payout.amount);
  
  // Refund platform fee since payout cancelled
  wallet.totalPlatformFee = Math.max(0, wallet.totalPlatformFee - payout.platformFee);
  
  await wallet.save();

  // Send notification to guide
  await NotificationHelper.notifyPayoutCancelled(payout);

  return payout;
};

const getWalletBalance = async (guideId: string) => {
  const wallet = await WalletModel.findOne({ guideId });

  if (!wallet) {
    // Return default wallet if not found
    return {
      balance: 0,
      pendingBalance: 0,
      totalEarned: 0,
      totalPlatformFee: 0,
      totalReceived: 0,
    };
  }

  // Calculate total net amount received by guide (after platform fee deduction)
  const totalReceivedResult = await Payout.aggregate([
    { 
      $match: { 
        guideId: wallet.guideId, 
        status: PayoutStatus.SENT 
      } 
    },
    { 
      $group: { 
        _id: null, 
        total: { $sum: "$netAmount" } 
      } 
    }
  ]);


  return {
    balance: wallet.balance,
    pendingBalance: wallet.pendingBalance,
    totalEarned: wallet.totalEarned,
    totalPlatformFee: wallet.totalPlatformFee || 0,
    totalReceived: wallet.totalReceived || 0,
    payableBalance: wallet.payableBalance || 0
  };
};

const getAllPayouts = async (query: Record<string, string>) => {

  
  const payoutQuery = new QueryBuilder(Payout.find().populate('guideId', 'name email phoneNumber avatarUrl'), query).search(payoutSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, meta] = await Promise.all([
    payoutQuery.build().exec(),
    payoutQuery.getMeta(),
  ]);



  const statsData = await Payout.aggregate([
    {
      $group: {
        _id: "$status",
        totalAmount: { $sum: "$netAmount" },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        status: "$_id",
        totalAmount: 1,
        count: 1
      }
    }
  ]);

  // Create dynamic default structure from enum
  const defaultStats: Record<string, { totalAmount: number; count: number }> = {};

  Object.values(PayoutStatus).forEach(status => {
    defaultStats[status] = { totalAmount: 0, count: 0 };
  });

  // Merge aggregated values into default structure
  statsData.forEach(item => {
    defaultStats[item.status] = {
      totalAmount: item.totalAmount,
      count: item.count
    };
  });

  // Final stats object
  const stats = defaultStats;


  return { data, meta: {...meta, stats} };
};

export const payoutServices = {
  requestPayout,
  getGuidePayouts,
  getAllPayouts,
  processPayout,
  failPayout,
  cancelPayout,
  getWalletBalance,
};
