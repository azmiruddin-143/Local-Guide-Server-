import { Tour } from './tour.model';
import { ITour } from './tour.interface';
import AppError from '../../errorHelpers/AppError';
import { StatusCodes as httpStatus } from 'http-status-codes';
import { Types } from 'mongoose';
import { QueryBuilder } from '../../utils/QueryBuilder';
import { TourSearchableFields } from '../../constants';
import { generateUniqueSlugWithCheck } from '../../utils/generateUniqueSlugWithCheck';

const createTour = async (guideId: string, payload: Partial<ITour>) => {
  payload.guideId = new Types.ObjectId(guideId);

  const slug = await generateUniqueSlugWithCheck(payload.title as string, Tour);

  payload.slug = slug;

  const tour = await Tour.create(payload);
  return tour;
};

const getAllTours = async (query: Record<string, string>) => {
  const tourQuery = new QueryBuilder(
    Tour.find({ isActive: true })
      .populate('guideId', 'name avatarUrl'),
    query
  )
    .search(TourSearchableFields)
    .filter()
    .sort()
    .paginate();

  const [data, meta] = await Promise.all([
    tourQuery.build().exec(),
    tourQuery.getMeta(),
  ]);

  return {
    tours: data,
    pagination: meta,
  };
};

const getTourById = async (id: string) => {
  const tour = await Tour.findById(id)
    .populate('guideId', 'name avatarUrl bio languages expertise rating email bio isVerified phoneNumber location  expertise dailyRate travelPreferences isActive')
    

  if (!tour) {
    throw new AppError(httpStatus.NOT_FOUND, 'Tour not found');
  }

  return tour;
};


const getTourBySlug = async (slug: string) => {
  const tour = await Tour.findOne({ slug })
    .populate('guideId', 'name avatarUrl bio languages expertise rating email bio isVerified phoneNumber location  expertise dailyRate travelPreferences isActive')
    

  if (!tour) {
    throw new AppError(httpStatus.NOT_FOUND, 'Tour not found');
  }

  return tour;
};


const getToursByGuide = async (guideId: string) => {
  const tours = await Tour.find({ guideId })
  return tours;
};

const getMyTours = async (guideId: string, query: Record<string, string>) => {
  const tourQuery = new QueryBuilder(
    Tour.find({ guideId })
   ,
    query
  )
    .search(TourSearchableFields)
    .filter()
    .sort()
    .paginate();

  const [data, meta] = await Promise.all([
    tourQuery.build().exec(),
    tourQuery.getMeta(),
  ]);

  return {
    tours: data,
    pagination: meta,
  };
};

const updateTour = async (id: string, guideId: string, payload: Partial<ITour>) => {
  const tour = await Tour.findById(id);

  if (!tour) {
    throw new AppError(httpStatus.NOT_FOUND, 'Tour not found');
  }

  if (tour.guideId.toString() !== guideId) {
    throw new AppError(httpStatus.FORBIDDEN, 'You can only update your own tours');
  }

  const updatedTour = await Tour.findByIdAndUpdate(id, payload, {
    new: true
  });

  return updatedTour;
};

const deleteTour = async (id: string, guideId: string) => {
  const tour = await Tour.findById(id);

  if (!tour) {
    throw new AppError(httpStatus.NOT_FOUND, 'Tour not found');
  }

  if (tour.guideId.toString() !== guideId) {
    throw new AppError(httpStatus.FORBIDDEN, 'You can only delete your own tours');
  }

  await Tour.findByIdAndDelete(id);
  return tour;
};

const toggleTourStatus = async (id: string, guideId: string) => {
  const tour = await Tour.findById(id);

  if (!tour) {
    throw new AppError(httpStatus.NOT_FOUND, 'Tour not found');
  }

  if (tour.guideId.toString() !== guideId) {
    throw new AppError(httpStatus.FORBIDDEN, 'You can only update your own tours');
  }

  tour.isActive = !tour.isActive;
  await tour.save();

  return tour;
};

// Admin services
const getAllToursAdmin = async (query: Record<string, string>) => {
  const tourQuery = new QueryBuilder(
    Tour.find()
      .populate('guideId', 'name avatarUrl email phoneNumber'),
    query
  )
    .search(TourSearchableFields)
    .filter()
    .sort()
    .paginate();

  const [data, meta] = await Promise.all([
    tourQuery.build().exec(),
    tourQuery.getMeta(),
  ]);

  return {
    tours: data,
    pagination: meta,
  };
};

const updateTourAdmin = async (id: string, payload: Partial<ITour>) => {
  const tour = await Tour.findById(id);

  if (!tour) {
    throw new AppError(httpStatus.NOT_FOUND, 'Tour not found');
  }

  const updatedTour = await Tour.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).populate('guideId', 'name avatarUrl email phoneNumber');

  return updatedTour;
};

const deleteTourAdmin = async (id: string) => {
  const tour = await Tour.findById(id);

  if (!tour) {
    throw new AppError(httpStatus.NOT_FOUND, 'Tour not found');
  }

  await Tour.findByIdAndDelete(id);
  return tour;
};

const toggleTourStatusAdmin = async (id: string) => {
  const tour = await Tour.findById(id);

  if (!tour) {
    throw new AppError(httpStatus.NOT_FOUND, 'Tour not found');
  }

  tour.isActive = !tour.isActive;
  await tour.save();

  return tour;
};

const getTopRatedTours = async (limit: number = 4) => {
  const tours = await Tour.find({ 
    isActive: true,
    reviewCount: { $gt: 0 } // Only tours with reviews
  })
    .populate('guideId', 'name avatarUrl')
    .sort({ averageRating: -1, reviewCount: -1 }) // Sort by rating, then by review count
    .limit(limit);

  return tours;
};

export const tourServices = {
  createTour,
  getAllTours,
  getTourById,
  getToursByGuide,
  getTopRatedTours,
  getMyTours,
  updateTour,
  deleteTour,
  toggleTourStatus,
  getTourBySlug,
  // Admin
  getAllToursAdmin,
  updateTourAdmin,
  deleteTourAdmin,
  toggleTourStatusAdmin,
};
