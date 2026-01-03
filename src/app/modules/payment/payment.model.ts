import { Schema, model } from 'mongoose';
import { IPayment, PAYMENT_STATUS } from './payment.interface';

const PaymentSchema = new Schema<IPayment>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'BDT',
    },
    provider: {
      type: String
    },
    transactionId: {
      type: String,
      index: true,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.UNPAID,
    },
    paymentGatewayData: {
      type: Schema.Types.Mixed,
      default: null,
    },
     metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
    invoiceUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Payment = model<IPayment>('Payment', PaymentSchema);
