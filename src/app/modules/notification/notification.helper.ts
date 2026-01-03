import { Types } from 'mongoose';
import { Notification } from './notification.model';
import { NotificationType, NotificationPriority } from './notification.interface';
import { ReviewTargetType } from '../review/review.interface';
import { ERole } from '../user/user.interface';

interface CreateNotificationData {
  userId: string | Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityId?: string | Types.ObjectId;
  relatedEntityType?: string;
  priority?: NotificationPriority;
  actionUrl?: string;
}

class NotificationHelperClass {
  /**
   * Create a single notification
   */
  async createNotification(data: CreateNotificationData): Promise<void> {
    try {
      await Notification.create({
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        relatedEntityId: data.relatedEntityId || null,
        relatedEntityType: data.relatedEntityType || null,
        priority: data.priority || NotificationPriority.MEDIUM,
        isRead: false,
      });
      console.log(`✅ Notification created: ${data.type} for user ${data.userId}`);
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      // Don't throw error - notifications should not break main flow
    }
  }

  /**
   * Create multiple notifications at once
   */
  async createBulkNotifications(notifications: CreateNotificationData[]): Promise<void> {
    try {
      const notificationDocs = notifications.map(data => ({
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        relatedEntityId: data.relatedEntityId || null,
        relatedEntityType: data.relatedEntityType || null,
        priority: data.priority || NotificationPriority.MEDIUM,
        actionUrl: data.actionUrl || null,
        isRead: false,
      }));

      await Notification.insertMany(notificationDocs);
      console.log(`✅ ${notifications.length} notifications created`);
    } catch (error) {
      console.error('❌ Error creating bulk notifications:', error);
    }
  }


  /**
   * Notify guide when a new booking is created
   */
  async notifyBookingCreated(booking: any): Promise<void> {
    const tourTitle = booking.tourId?.title || 'a tour';
    const touristName = booking.touristId?.name || 'A tourist';
    const bookingDate = booking.extras?.bookingDate 
      ? new Date(booking.extras.bookingDate).toLocaleDateString() 
      : 'soon';

    await this.createNotification({
      userId: booking.guideId,
      type: NotificationType.BOOKING_CREATED,
      title: '🎉 New Booking Request',
      message: `${touristName} has requested to book your tour "${tourTitle}" for ${bookingDate}. ${booking.numGuests} guest(s).`,
      relatedEntityId: booking._id,
      relatedEntityType: 'booking',
      priority: NotificationPriority.HIGH,
      
    });
  }

  /**
   * Notify tourist when booking is confirmed
   */
  async notifyBookingConfirmed(booking: any): Promise<void> {
    const tourTitle = booking.tourId?.title || 'your tour';

    await this.createNotification({
      userId: booking.touristId,
      type: NotificationType.BOOKING_CONFIRMED,
      title: '✅ Booking Confirmed!',
      message: `Great news! Your booking for "${tourTitle}" has been confirmed by the guide. Get ready for an amazing experience!`,
      relatedEntityId: booking._id,
      relatedEntityType: 'booking',
      priority: NotificationPriority.HIGH,
    });
  }

  /**
   * Notify tourist when booking is declined
   */
  async notifyBookingDeclined(booking: any): Promise<void> {
    const tourTitle = booking.tourId?.title || 'your tour';

    await this.createNotification({
      userId: booking.touristId,
      type: NotificationType.BOOKING_DECLINED,
      title: '❌ Booking Declined',
      message: `Unfortunately, your booking request for "${tourTitle}" has been declined by the guide. Please try another tour or time slot.`,
      relatedEntityId: booking._id,
      relatedEntityType: 'booking',
      priority: NotificationPriority.HIGH,
    });
  }

  /**
   * Notify both tourist and guide when booking is cancelled
   */
  async notifyBookingCancelled(booking: any, cancelledByUserId: string): Promise<void> {
    const tourTitle = booking.tourId?.title || 'the tour';
    const touristName = booking.touristId?.name || 'The tourist';
    const guideName = booking.guideId?.name || 'The guide';
    
    const cancelledByTourist = booking.touristId._id?.toString() === cancelledByUserId || 
                               booking.touristId.toString() === cancelledByUserId;

    const notifications: CreateNotificationData[] = [];

    // Notify tourist
    notifications.push({
      userId: booking.touristId._id || booking.touristId,
      type: NotificationType.BOOKING_CANCELLED,
      title: '🚫 Booking Cancelled',
      message: cancelledByTourist
        ? `You have cancelled your booking for "${tourTitle}". ${booking.paymentStatus === 'REFUND_PENDING' ? 'Refund is being processed.' : ''}`
        : `Your booking for "${tourTitle}" has been cancelled by the guide.`,
      relatedEntityId: booking._id,
      relatedEntityType: 'booking',
      priority: NotificationPriority.HIGH,
    });

    // Notify guide
    notifications.push({
      userId: booking.guideId._id || booking.guideId,
      type: NotificationType.BOOKING_CANCELLED,
      title: '🚫 Booking Cancelled',
      message: cancelledByTourist
        ? `${touristName} has cancelled their booking for "${tourTitle}".`
        : `You have cancelled the booking for "${tourTitle}".`,
      relatedEntityId: booking._id,
      relatedEntityType: 'booking',
      priority: NotificationPriority.HIGH,
    });

    await this.createBulkNotifications(notifications);
  }

  /**
   * Notify both tourist and guide when booking is completed
   */
  async notifyBookingCompleted(booking: any): Promise<void> {
    const tourTitle = booking.tourId?.title || 'the tour';

    const notifications: CreateNotificationData[] = [];

    // Notify tourist
    notifications.push({
      userId: booking.touristId._id || booking.touristId,
      type: NotificationType.BOOKING_COMPLETED,
      title: '🎊 Tour Completed!',
      message: `Your tour "${tourTitle}" has been completed. We hope you had a great experience! Please leave a review.`,
      relatedEntityId: booking._id,
      relatedEntityType: 'booking',
      priority: NotificationPriority.MEDIUM,
    });

    // Notify guide
    notifications.push({
      userId: booking.guideId._id || booking.guideId,
      type: NotificationType.BOOKING_COMPLETED,
      title: '🎊 Tour Completed!',
      message: `Your tour "${tourTitle}" has been marked as completed. Great job!`,
      relatedEntityId: booking._id,
      relatedEntityType: 'booking',
      priority: NotificationPriority.MEDIUM,
    });

    await this.createBulkNotifications(notifications);
  }


  /**
   * Notify tourist and guide when payment is successful
   */
  async notifyPaymentSuccess(payment: any, booking: any): Promise<void> {
    const tourTitle = booking.tourId?.title || 'the tour';
    const amount = payment.amount || booking.amountTotal;

    const notifications: CreateNotificationData[] = [];

    // Notify tourist
    notifications.push({
      userId: booking.touristId._id || booking.touristId,
      type: NotificationType.PAYMENT_SUCCESS,
      title: '💳 Payment Successful',
      message: `Your payment of ${amount} BDT for "${tourTitle}" was successful. Your booking is now pending guide confirmation.`,
      relatedEntityId: payment._id,
      relatedEntityType: 'payment',
      priority: NotificationPriority.HIGH,
    });

    // Notify guide
    notifications.push({
      userId: booking.guideId._id || booking.guideId,
      type: NotificationType.PAYMENT_SUCCESS,
      title: '💰 Payment Received',
      message: `Payment of ${amount} BDT received for "${tourTitle}". Please confirm the booking.`,
      relatedEntityId: payment._id,
      relatedEntityType: 'payment',
      priority: NotificationPriority.HIGH,
    });

    await this.createBulkNotifications(notifications);
  }

  /**
   * Notify tourist when payment fails
   */
  async notifyPaymentFailed(payment: any, booking: any): Promise<void> {
    const tourTitle = booking.tourId?.title || 'the tour';

    await this.createNotification({
      userId: booking.touristId,
      type: NotificationType.PAYMENT_FAILED,
      title: '❌ Payment Failed',
      message: `Payment for "${tourTitle}" failed. Please try again or use a different payment method.`,
      relatedEntityId: payment._id,
      relatedEntityType: 'payment',
      priority: NotificationPriority.URGENT,
    });
  }

  /**
   * Notify tourist when payment is refunded
   */
  async notifyPaymentRefunded(payment: any, booking: any): Promise<void> {
    const tourTitle = booking.tourId?.title || 'the tour';
    const refundAmount = payment.metadata?.refundAmount || payment.amount;

    await this.createNotification({
      userId: booking.touristId,
      type: NotificationType.PAYMENT_REFUNDED,
      title: '💵 Refund Processed',
      message: `Refund of ${refundAmount} BDT has been processed for "${tourTitle}". The amount will be credited to your account shortly.`,
      relatedEntityId: payment._id,
      relatedEntityType: 'payment',
      priority: NotificationPriority.HIGH,
    });
  }


  /**
   * Notify guide when they receive a review
   */
  async notifyReviewReceived(review: any, booking: any): Promise<void> {
    const touristName = review.authorId?.name || 'A tourist';
    const rating = review.rating;
    const target = review.target === ReviewTargetType.TOUR ? 'tour' : 'guide profile';
    const tourTitle = booking.tourId?.title || 'your tour';

    await this.createNotification({
      userId: booking.guideId,
      type: review.target === ReviewTargetType.TOUR 
        ? NotificationType.REVIEW_RECEIVED_TOUR 
        : NotificationType.REVIEW_RECEIVED_GUIDE,
      title: '⭐ New Review Received',
      message: `${touristName} left a ${rating}-star review for your ${target} "${tourTitle}". ${review.content ? 'Check it out!' : ''}`,
      relatedEntityId: review._id,
      relatedEntityType: 'review',
      priority: NotificationPriority.MEDIUM,
    });
  }


  /**
   * Notify admin when guide requests payout
   */
  async notifyPayoutRequested(payout: any, guide: any): Promise<void> {
    const guideName = guide.name || 'A guide';
    const amount = payout.amount;

    // Get all admin users
    const User = require('../user/user.model').User;
    const admins = await User.find({ role: ERole.ADMIN, isDeleted: false }).select('_id');

    const notifications: CreateNotificationData[] = admins.map((admin: any) => ({
      userId: admin._id,
      type: NotificationType.PAYOUT_REQUESTED,
      title: '💼 New Payout Request',
      message: `${guideName} requested a payout of ${amount} BDT. Net amount: ${payout.netAmount} BDT (Platform fee: ${payout.platformFee} BDT).`,
      relatedEntityId: payout._id,
      relatedEntityType: 'payout',
      priority: NotificationPriority.HIGH,
    }));

    if (notifications.length > 0) {
      await this.createBulkNotifications(notifications);
    }
  }

  /**
   * Notify guide when payout is processed
   */
  async notifyPayoutProcessed(payout: any): Promise<void> {
    await this.createNotification({
      userId: payout.guideId,
      type: NotificationType.PAYOUT_PROCESSED,
      title: '✅ Payout Processed',
      message: `Your payout of ${payout.netAmount} BDT has been successfully processed and sent to your account.`,
      relatedEntityId: payout._id,
      relatedEntityType: 'payout',
      priority: NotificationPriority.HIGH,
    });
  }

  /**
   * Notify guide when payout fails
   */
  async notifyPayoutFailed(payout: any): Promise<void> {
    const reason = payout.failureReason || 'Unknown reason';

    await this.createNotification({
      userId: payout.guideId,
      type: NotificationType.PAYOUT_FAILED,
      title: '❌ Payout Failed',
      message: `Your payout request of ${payout.amount} BDT failed. Reason: ${reason}. The amount has been returned to your wallet.`,
      relatedEntityId: payout._id,
      relatedEntityType: 'payout',
      priority: NotificationPriority.URGENT,
    });
  }

  /**
   * Notify guide when payout is cancelled
   */
  async notifyPayoutCancelled(payout: any): Promise<void> {
    await this.createNotification({
      userId: payout.guideId,
      type: NotificationType.PAYOUT_CANCELLED,
      title: '🚫 Payout Cancelled',
      message: `Your payout request of ${payout.amount} BDT has been cancelled. The amount has been returned to your wallet.`,
      relatedEntityId: payout._id,
      relatedEntityType: 'payout',
      priority: NotificationPriority.MEDIUM,
    });
  }


  /**
   * Notify user when account is verified
   */
  async notifyAccountVerified(userId: string | Types.ObjectId, userName: string): Promise<void> {
    await this.createNotification({
      userId,
      type: NotificationType.ACCOUNT_VERIFIED,
      title: '✅ Account Verified',
      message: `Congratulations ${userName}! Your account has been verified. You now have full access to all features.`,
      priority: NotificationPriority.HIGH,
    });
  }

  /**
   * Notify user when account status changes
   */
  async notifyAccountStatusChanged(userId: string | Types.ObjectId, newStatus: string): Promise<void> {
    const statusMessages: Record<string, string> = {
      ACTIVE: 'Your account has been activated. You can now access all features.',
      INACTIVE: 'Your account has been set to inactive.',
      BLOCKED: 'Your account has been blocked. Please contact support for more information.',
    };

    await this.createNotification({
      userId,
      type: NotificationType.ACCOUNT_STATUS_CHANGED,
      title: '🔔 Account Status Updated',
      message: statusMessages[newStatus] || `Your account status has been changed to ${newStatus}.`,
      priority: newStatus === 'BLOCKED' ? NotificationPriority.URGENT : NotificationPriority.HIGH,
    });
  }

  /**
   * Notify user when password is reset successfully
   */
  async notifyPasswordResetSuccess(userId: string | Types.ObjectId, userName: string): Promise<void> {
    await this.createNotification({
      userId,
      type: NotificationType.PASSWORD_RESET_SUCCESS,
      title: '🔐 Password Reset Successful',
      message: `Hi ${userName}, your password has been reset successfully. If you didn't make this change, please contact support immediately.`,
      priority: NotificationPriority.HIGH,
    });
  }
}

export const NotificationHelper = new NotificationHelperClass();
