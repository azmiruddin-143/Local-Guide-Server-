import { Types } from 'mongoose';

export enum NotificationType {
  // Booking Events
  BOOKING_CREATED = 'BOOKING_CREATED',
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  BOOKING_DECLINED = 'BOOKING_DECLINED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  BOOKING_COMPLETED = 'BOOKING_COMPLETED',
  
  // Payment Events
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_REFUNDED = 'PAYMENT_REFUNDED',
  
  // Review Events
  REVIEW_RECEIVED_TOUR = 'REVIEW_RECEIVED_TOUR',
  REVIEW_RECEIVED_GUIDE = 'REVIEW_RECEIVED_GUIDE',
  
  // Payout Events
  PAYOUT_REQUESTED = 'PAYOUT_REQUESTED',
  PAYOUT_PROCESSED = 'PAYOUT_PROCESSED',
  PAYOUT_FAILED = 'PAYOUT_FAILED',
  PAYOUT_CANCELLED = 'PAYOUT_CANCELLED',
  
  // User/Account Events
  ACCOUNT_VERIFIED = 'ACCOUNT_VERIFIED',
  ACCOUNT_STATUS_CHANGED = 'ACCOUNT_STATUS_CHANGED',
  PASSWORD_RESET_SUCCESS = 'PASSWORD_RESET_SUCCESS',
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface INotification {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  priority?: NotificationPriority;
  actionUrl?: string | null;
  relatedEntityId?: Types.ObjectId | null;
  relatedEntityType?: string | null; 
  createdAt: string;
  updatedAt: string;
}
