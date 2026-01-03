import { Types } from 'mongoose';

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  DECLINED = 'DECLINED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  INITIATED = 'INITIATED',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  REFUND_PENDING = 'REFUND_PENDING'
}

export interface IBooking {
  _id?: Types.ObjectId;
  tourId: Types.ObjectId;
  touristId: Types.ObjectId;
  guideId: Types.ObjectId;
  availabilityId: Types.ObjectId;
  paymentId: Types.ObjectId;
  startAt: Date;
  endAt?: Date;
  numGuests: number;
  amountTotal: number;
  currency: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  specialRequests?: string | null;
  cancellationReason?: string | null;
  refundReason?: string | null;
  cancelledBy?: Types.ObjectId | null;
  cancelledAt?: Date | null;
  confirmedAt?: Date | null;
  completedAt?: Date | null;
  extras?: any;
  createdAt: string;
  updatedAt: string;
}
