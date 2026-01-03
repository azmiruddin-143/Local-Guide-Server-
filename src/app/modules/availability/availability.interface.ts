import { Types } from 'mongoose';

export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export enum TimeOfDay {
  MORNING = 'MORNING',   // 06:00 - 11:59
  AFTERNOON = 'AFTERNOON', // 12:00 - 17:59
  EVENING = 'EVENING',   // 18:00 - 23:59
}

export interface IAvailability {
  _id?: Types.ObjectId;
  guideId: Types.ObjectId;
  specificDate: Date;              // শুধু specific date (7 days er moddhe)
  startTime: string;
  endTime: string;
  timeOfDay: TimeOfDay;            // Auto-calculated from startTime
  durationMins: number;            // Duration in minutes
  maxGroupSize: number;            // Max group size for this slot
  pricePerPerson: number;          // Price per person for this slot
  todaysTourist: {
    isBooked: boolean;             // slot এ already booking আছে?
    count: number;                 // মোট কটি guest book করেছে
    tourId: Types.ObjectId | null; // কোন tour এর booking হচ্ছে
    maxGuests: number;             // maximum guest capacity (deprecated, use maxGroupSize)
  }
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}
