import { Types } from "mongoose";

export enum IsActive {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BLOCKED = "BLOCKED"
}

export enum ERole {
  ADMIN = 'ADMIN',
  TOURIST = 'TOURIST',
  GUIDE = 'GUIDE',
}

export interface IAuthProvider {
  provider: string; 
  providerId: string;
}


export interface IUser {
  _id?: Types.ObjectId;
  name: string;
  email: string;
  passwordHash?: string;
  role: ERole;
  bio?: string | null;
  languages?: string[]; 
  avatarUrl?: string | null;
  isVerified: boolean;
  phoneNumber?: string | null;
  location?: string | null; 
  expertise?: string[]; 
  travelPreferences?: string[]; 
  reviewCount?: number;
  averageRating?: number;
  isDeleted?: boolean;
  isActive?: IsActive;
  wallet?: Types.ObjectId;
  auths: IAuthProvider[];
  createdAt: string;
  updatedAt: string;
}