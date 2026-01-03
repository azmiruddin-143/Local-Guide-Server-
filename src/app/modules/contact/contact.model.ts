import { Schema, model } from 'mongoose';
import { IContact, InquiryType } from './contact.interface';

const ContactSchema = new Schema<IContact>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    inquiryType: {
      type: String,
      enum: Object.values(InquiryType),
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for admin queries
ContactSchema.index({ createdAt: -1 });
ContactSchema.index({ isRead: 1 });
ContactSchema.index({ inquiryType: 1 });

export const Contact = model<IContact>('Contact', ContactSchema);