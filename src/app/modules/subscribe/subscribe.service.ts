import { Subscribe } from './subscribe.model';
import AppError from '../../errorHelpers/AppError';
import { StatusCodes as httpStatus } from 'http-status-codes';
import { QueryBuilder } from '../../utils/QueryBuilder';

const subscribeNewsletter = async (email: string) => {
  // Check if email already exists
  const existingSubscription = await Subscribe.findOne({ email });

  if (existingSubscription) {
    // If already subscribed and active
    if (existingSubscription.isActive) {
      throw new AppError(httpStatus.BAD_REQUEST, 'This email is already subscribed to our newsletter');
    }

    // If previously unsubscribed, reactivate
    existingSubscription.isActive = true;
    existingSubscription.subscribedAt = new Date();
    existingSubscription.unsubscribedAt = undefined;
    await existingSubscription.save();

    return existingSubscription;
  }

  // Create new subscription
  const newSubscription = await Subscribe.create({
    email,
    isActive: true,
    subscribedAt: new Date(),
  });

  return newSubscription;
};

const unsubscribeNewsletter = async (email: string) => {
  const subscription = await Subscribe.findOne({ email });

  if (!subscription) {
    throw new AppError(httpStatus.NOT_FOUND, 'Email not found in our subscription list');
  }

  if (!subscription.isActive) {
    throw new AppError(httpStatus.BAD_REQUEST, 'This email is already unsubscribed');
  }

  subscription.isActive = false;
  subscription.unsubscribedAt = new Date();
  await subscription.save();

  return subscription;
};

const getAllSubscribers = async (query : Record<string, string>) => {

  const subscribersQuery = new QueryBuilder(Subscribe.find({ isActive: true }).sort({ subscribedAt: -1 }), query)
      .search(['email'])
      .filter()
      .sort()
      .paginate();
  
    const [data, meta] = await Promise.all([
      subscribersQuery.build().exec(),
      subscribersQuery.getMeta(),
    ]);
  
    return {
      contacts: data,
      pagination: meta,
    };
};

const getSubscriberStats = async () => {
  const totalSubscribers = await Subscribe.countDocuments({ isActive: true });
  const totalUnsubscribed = await Subscribe.countDocuments({ isActive: false });
  const recentSubscribers = await Subscribe.find({ isActive: true })
    .sort({ subscribedAt: -1 })
    .limit(10);

  return {
    totalSubscribers,
    totalUnsubscribed,
    recentSubscribers,
  };
};

export const subscribeServices = {
  subscribeNewsletter,
  unsubscribeNewsletter,
  getAllSubscribers,
  getSubscriberStats,
};
