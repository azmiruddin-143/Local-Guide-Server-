import { Schema, model } from 'mongoose';
import { IBooking, BookingStatus, PaymentStatus } from './booking.interface';

const BookingSchema = new Schema<IBooking>(
  {
    tourId: {
      type: Schema.Types.ObjectId,
      ref: 'Tour',
      required: true,
    },
    touristId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    guideId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    availabilityId: {
     type: Schema.Types.ObjectId,
      ref: 'Availability',
      required: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    startAt: {
      type: Date,
      required: true,
    },
    endAt: {
      type: Date,
    },
    numGuests: {
      type: Number,
      required: true,
      min: 1,
    },
    amountTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.PENDING,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    specialRequests: {
      type: String,
      default: null,
    },
    cancellationReason: {
      type: String,
      default: null,
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    extras: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Booking = model<IBooking>('Booking', BookingSchema);
