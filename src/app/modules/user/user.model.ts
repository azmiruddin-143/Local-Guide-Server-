import { Schema, model } from 'mongoose';
import { IUser, ERole, IsActive, IAuthProvider } from './user.interface';

const AuthProviderSchema = new Schema<IAuthProvider>(
  {
    provider: {
      type: String,
      required: true,
    },
    providerId: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    role: {
      type: String,
      enum: Object.values(ERole),
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      select: false, // Don't return password by default
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    bio: {
      type: String,
      default: null,
    },
    languages: {
      type: [String],
      default: [],
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    phoneNumber: {
      type: String,
      default: null,
    },
    location: {
      type: String,
      default: null,
    },
    // Guide-specific fields
    expertise: {
      type: [String],
      default: [],
    },
    // Tourist-specific fields
    travelPreferences: {
      type: [String],
      default: [],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: String,
      enum: Object.values(IsActive),
      default: IsActive.ACTIVE,
    },
    wallet: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
    },
    auths: {
      type: [AuthProviderSchema],
      default: [],
    },
  },
  {
    timestamps: true
  }
);



export const User = model<IUser>('User', UserSchema);
