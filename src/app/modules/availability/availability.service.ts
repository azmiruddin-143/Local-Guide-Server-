import { Availability } from './availability.model';
import AppError from '../../errorHelpers/AppError';
import { StatusCodes as httpStatus } from 'http-status-codes';
import { Types } from 'mongoose';

// Helper to convert time string to minutes for comparison
const convertTimeToMinutes = (time: string): number => {
  const [hourMin] = time.split(' '); // Remove AM/PM if present
  const [hour, min] = hourMin.split(':').map(Number);
  return hour * 60 + min;
};

// Auto cleanup past dates
const cleanupPastAvailabilities = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Reset todaysTourist for past dates
  await Availability.updateMany(
    { 
      specificDate: { $lt: today },
      'todaysTourist.isBooked': true 
    },
    { 
      $set: { 
        'todaysTourist.isBooked': false,
        'todaysTourist.count': 0,
        'todaysTourist.tourId': null,
        isAvailable: true
      } 
    }
  );
  
  // Delete old availabilities (older than today)
  await Availability.deleteMany({ specificDate: { $lt: today } });
};

const createAvailability = async (guideId: string, payload: any) => {
  // Cleanup before creating new
  await cleanupPastAvailabilities();
  
  // Validate date is within 7 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 7);
  
  const checkDate = new Date(payload.specificDate);
  checkDate.setHours(0, 0, 0, 0);
  
  if (checkDate < today || checkDate > maxDate) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Availability can only be created within next 7 days'
    );
  }
  
  // Validate: startTime < endTime (convert to minutes for comparison)
  const startMins = convertTimeToMinutes(payload.startTime);
  const endMins = convertTimeToMinutes(payload.endTime);
  if (startMins >= endMins) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Start time must be before end time');
  }

  // Check for time overlap with existing slots on the same date
  const existingSlots = await Availability.find({
    guideId,
    specificDate: {
      $gte: checkDate,
      $lt: new Date(checkDate.getTime() + 24 * 60 * 60 * 1000) // Same day
    }
  });

  // Check if new slot overlaps with any existing slot
  for (const existingSlot of existingSlots) {
    const existingStartMins = convertTimeToMinutes(existingSlot.startTime);
    const existingEndMins = convertTimeToMinutes(existingSlot.endTime);

    // Check for overlap:
    // New slot starts before existing ends AND new slot ends after existing starts
    const hasOverlap = (startMins < existingEndMins) && (endMins > existingStartMins);

    if (hasOverlap) {
      throw new AppError(
        httpStatus.CONFLICT,
        `Time slot overlaps with existing availability (${existingSlot.startTime} - ${existingSlot.endTime}). Please choose a different time.`
      );
    }
  }

  const availability = await Availability.create({
    ...payload,
    guideId,
  });
  return availability;
};

const getGuideAvailability = async (guideId: string) => {
  // Cleanup before fetching
  await cleanupPastAvailabilities();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const availabilities = await Availability.find({ 
    guideId,
    specificDate: { $gte: today }
  }).sort({ specificDate: 1, startTime: 1 });
  
  return availabilities;
};

const updateAvailability = async (id: string, guideId: string, payload: any) => {
  const availability = await Availability.findById(id);

  if (!availability) {
    throw new AppError(httpStatus.NOT_FOUND, 'Availability not found');
  }

  if (availability.guideId.toString() !== guideId) {
    throw new AppError(httpStatus.FORBIDDEN, 'You can only update your own availability');
  }

  // Validate: startTime < endTime (convert to minutes for comparison)
  const startTime = payload.startTime || availability.startTime;
  const endTime = payload.endTime || availability.endTime;
  const startMins = convertTimeToMinutes(startTime);
  const endMins = convertTimeToMinutes(endTime);
  if (startMins >= endMins) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Start time must be before end time');
  }

  // Check for time overlap with other existing slots on the same date (excluding current slot)
  const specificDate = payload.specificDate || availability.specificDate;
  const checkDate = new Date(specificDate);
  checkDate.setHours(0, 0, 0, 0);

  const existingSlots = await Availability.find({
    guideId,
    _id: { $ne: id }, // Exclude current slot being updated
    specificDate: {
      $gte: checkDate,
      $lt: new Date(checkDate.getTime() + 24 * 60 * 60 * 1000) // Same day
    }
  });

  // Check if updated slot overlaps with any existing slot
  for (const existingSlot of existingSlots) {
    const existingStartMins = convertTimeToMinutes(existingSlot.startTime);
    const existingEndMins = convertTimeToMinutes(existingSlot.endTime);

    // Check for overlap
    const hasOverlap = (startMins < existingEndMins) && (endMins > existingStartMins);

    if (hasOverlap) {
      throw new AppError(
        httpStatus.CONFLICT,
        `Time slot overlaps with existing availability (${existingSlot.startTime} - ${existingSlot.endTime}). Please choose a different time.`
      );
    }
  }

  // Update fields manually to trigger pre-save hook
  Object.assign(availability, payload);
  
  // Save to trigger pre-save hook (which converts time format)
  const updated = await availability.save();

  return updated;
};

const deleteAvailability = async (id: string, guideId: string) => {
  const availability = await Availability.findById(id);

  if (!availability) {
    throw new AppError(httpStatus.NOT_FOUND, 'Availability not found');
  }

  if (availability.guideId.toString() !== guideId) {
    throw new AppError(httpStatus.FORBIDDEN, 'You can only delete your own availability');
  }

  await Availability.findByIdAndDelete(id);
  return availability;
};

const checkAvailability = async (guideId: string, date: Date, startTime: string) => {
  await cleanupPastAvailabilities();
  
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  // Use date range to handle timezone issues
  const nextDay = new Date(checkDate);
  nextDay.setDate(nextDay.getDate() + 1);
  
  const availability = await Availability.findOne({ 
    guideId,
    specificDate: {
      $gte: checkDate,
      $lt: nextDay
    },
    startTime,
    isAvailable: true
  });

  if (!availability) {
    const dateStr = checkDate.toISOString().split('T')[0];
    return { 
      available: false, 
      reason: `Guide has not set availability for ${dateStr} at ${startTime}. Please contact the guide or choose a different date/time.` 
    };
  }

  // Check if already fully booked
  if (availability.todaysTourist.isBooked && 
      availability.todaysTourist.count >= availability.todaysTourist.maxGuests) {
    return { 
      available: false, 
      reason: 'Fully booked',
      currentGuests: availability.todaysTourist.count,
      maxGuests: availability.todaysTourist.maxGuests
    };
  }

  return { 
    available: true,
    availableSlots: availability.todaysTourist.maxGuests - availability.todaysTourist.count,
    currentGuests: availability.todaysTourist.count,
    maxGuests: availability.todaysTourist.maxGuests
  };
};

// Update availability when booking is made
const updateAvailabilityBooking = async (
  guideId: string,
  date: Date,
  startTime: string,
  tourId: string,
  guestCount: number
) => {
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  // Use date range to handle timezone issues
  const nextDay = new Date(checkDate);
  nextDay.setDate(nextDay.getDate() + 1);
  
  const availability = await Availability.findOne({ 
    guideId, 
    specificDate: {
      $gte: checkDate,
      $lt: nextDay
    },
    startTime 
  });

  if (!availability) {
    throw new AppError(
      httpStatus.NOT_FOUND, 
      `Availability slot not found for guide on ${checkDate.toISOString().split('T')[0]} at ${startTime}. Please ensure the guide has created availability for this date and time.`
    );
  }

  // Check if this is the same tour or a different tour
  const currentTourId = availability.todaysTourist?.tourId?.toString();
  const newTourId = tourId.toString();

  if (currentTourId && currentTourId !== newTourId) {
    throw new AppError(
      httpStatus.CONFLICT, 
      'This slot is already booked for a different tour'
    );
  }

  // Check if adding guests exceeds capacity
  const newCount = (availability.todaysTourist?.count || 0) + guestCount;
  if (newCount > availability.todaysTourist.maxGuests) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot add ${guestCount} guests. Only ${availability.todaysTourist.maxGuests - availability.todaysTourist.count} slots available`
    );
  }

  // Update the availability
  availability.todaysTourist = {
    isBooked: true,
    count: newCount,
    tourId: new Types.ObjectId(tourId),
    maxGuests: availability.todaysTourist.maxGuests,
  };

  // Mark as unavailable if fully booked
  if (newCount >= availability.todaysTourist.maxGuests) {
    availability.isAvailable = false;
  }

  await availability.save();
  return availability;
};

// Reset availability when booking is cancelled
const resetAvailabilityBooking = async (
  guideId: string,
  date: Date,
  startTime: string,
  guestCount: number,
  tourId?: string
) => {
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  // Use date range to handle timezone issues
  const nextDay = new Date(checkDate);
  nextDay.setDate(nextDay.getDate() + 1);
  
  const availability = await Availability.findOne({ 
    guideId, 
    specificDate: {
      $gte: checkDate,
      $lt: nextDay
    },
    startTime 
  });

  if (!availability) {
    return null;
  }

  // Only reset if it's the same tour
  const currentTourId = availability.todaysTourist?.tourId?.toString();
  if (tourId && currentTourId !== tourId.toString()) {
    return availability;
  }

  // Decrease count or reset if no more bookings
  const newCount = Math.max(0, (availability.todaysTourist?.count || 0) - guestCount);
  
  availability.todaysTourist = {
    isBooked: newCount > 0,
    count: newCount,
    tourId: newCount > 0 ? availability.todaysTourist?.tourId : null,
    maxGuests: availability.todaysTourist.maxGuests,
  };

  // Make available again if not fully booked
  if (newCount < availability.todaysTourist.maxGuests) {
    availability.isAvailable = true;
  }

  await availability.save();
  return availability;
};

// Debug function to see what's in database
const debugAvailability = async (guideId: string, dateStr: string, timeStr: string) => {
  const checkDate = new Date(dateStr);
  checkDate.setHours(0, 0, 0, 0);
  
  // Get all slots for this guide on this date
  const allSlotsForDate = await Availability.find({
    guideId,
    specificDate: {
      $gte: checkDate,
      $lt: new Date(checkDate.getTime() + 24 * 60 * 60 * 1000)
    }
  });

  // Try to find exact match
  const exactMatch = await Availability.findOne({
    guideId,
    specificDate: checkDate,
    startTime: timeStr
  });

  return {
    searchCriteria: {
      guideId,
      dateProvided: dateStr,
      dateConverted: checkDate.toISOString(),
      timeProvided: timeStr,
    },
    allSlotsForThisDate: allSlotsForDate.map(slot => ({
      id: slot._id,
      specificDate: slot.specificDate,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isAvailable: slot.isAvailable,
      todaysTourist: slot.todaysTourist
    })),
    exactMatch: exactMatch ? {
      id: exactMatch._id,
      specificDate: exactMatch.specificDate,
      startTime: exactMatch.startTime,
      endTime: exactMatch.endTime,
      isAvailable: exactMatch.isAvailable,
      todaysTourist: exactMatch.todaysTourist
    } : null,
    totalSlotsFound: allSlotsForDate.length
  };
};

export const availabilityServices = {
  createAvailability,
  getGuideAvailability,
  updateAvailability,
  deleteAvailability,
  checkAvailability,
  updateAvailabilityBooking,
  resetAvailabilityBooking,
  cleanupPastAvailabilities,
  debugAvailability,
};
