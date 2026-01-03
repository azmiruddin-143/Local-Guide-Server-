import { Schema, model } from 'mongoose';
import { IAvailability } from './availability.interface';

const AvailabilitySchema = new Schema<IAvailability>(
  {
    guideId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    specificDate: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    durationMins: {
      type: Number,
      required: true,
      min: 30,
    },
    maxGroupSize: {
      type: Number,
      required: true,
      min: 1,
      default: 10,
    },
    pricePerPerson: {
      type: Number,
      required: true,
      min: 0,
    },
    todaysTourist: {
      isBooked: {
        type: Boolean,
        default: false,
      },
      count: {
        type: Number,
        default: 0,
      },
      tourId: {
        type: Schema.Types.ObjectId,
        ref: 'Tour',
        default: null,
      },
      maxGuests: {
        type: Number,
        default: 10,
      },
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index to prevent duplicate date+time for same guide
AvailabilitySchema.index({ guideId: 1, specificDate: 1, startTime: 1 }, { unique: true });

// Helper function to convert 24-hour format to 12-hour format with AM/PM
function convertTo12HourFormat(time24: string): string {
  const [hourStr, minute] = time24.split(':');
  let hour = parseInt(hourStr);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  
  // Convert hour to 12-hour format
  if (hour === 0) {
    hour = 12; // Midnight
  } else if (hour > 12) {
    hour = hour - 12;
  }
  
  return `${hour}:${minute} ${ampm}`;
}

// Helper function to calculate timeOfDay from startTime
function getTimeOfDay(startTime: string): string {
  // Extract hour from both formats (09:00 or 9:00 AM)
  const hour = parseInt(startTime.split(':')[0]);
  if (hour >= 6 && hour < 12) return 'MORNING';
  if (hour >= 12 && hour < 18) return 'AFTERNOON';
  return 'EVENING';
}

// Helper function to calculate duration in minutes
function calculateDuration(startTime: string, endTime: string): number {
  // Extract hours and minutes from both formats
  const extractTime = (time: string) => {
    const [hourMin] = time.split(' '); // Remove AM/PM if present
    const [hour, min] = hourMin.split(':').map(Number);
    return { hour, min };
  };
  
  const start = extractTime(startTime);
  const end = extractTime(endTime);
  
  return (end.hour * 60 + end.min) - (start.hour * 60 + start.min);
}

// Auto-calculate timeOfDay and durationMins before save
AvailabilitySchema.pre('save', function (next) {
  // Convert times to 12-hour format with AM/PM if they're in 24-hour format
  if (this.startTime && !this.startTime.includes('AM') && !this.startTime.includes('PM')) {
    this.startTime = convertTo12HourFormat(this.startTime);
  }
  if (this.endTime && !this.endTime.includes('AM') && !this.endTime.includes('PM')) {
    this.endTime = convertTo12HourFormat(this.endTime);
  }
  
  // Calculate timeOfDay from startTime
  if (!this.timeOfDay) {
    this.timeOfDay = getTimeOfDay(this.startTime) as any;
  }
  
  // Calculate duration if not provided
  if (!this.durationMins) {
    this.durationMins = calculateDuration(this.startTime, this.endTime);
  }
  
  // Validation: specificDate must be within next 7 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 7);
  
  const checkDate = new Date(this.specificDate);
  checkDate.setHours(0, 0, 0, 0);
  
  if (checkDate < today || checkDate > maxDate) {
    next(new Error('Availability can only be created within next 7 days'));
  }
  
  next();
});

export const Availability = model<IAvailability>('Availability', AvailabilitySchema);
