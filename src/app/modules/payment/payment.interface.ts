import { Types } from 'mongoose';

export enum PAYMENT_STATUS {
  PAID = 'PAID',
  INITIATED = 'INITIATED',
  UNPAID = 'UNPAID',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  REFUND_PENDING = 'REFUND_PENDING'
}

export interface IPayment {
  bookingId: Types.ObjectId;
  customerId: Types.ObjectId;
  provider: string;
  transactionId: string;
  currency: string;
  amount: number;
  paymentGatewayData?: any;
  metadata?: any;
  invoiceUrl?: string;
  status: PAYMENT_STATUS;
}
