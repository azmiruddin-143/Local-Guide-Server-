import bcryptjs from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from './user.model';
import { IUser, ERole, IAuthProvider, IsActive } from './user.interface';
import AppError from '../../errorHelpers/AppError';
import { StatusCodes as httpStatus } from 'http-status-codes';
import { QueryBuilder } from '../../utils/QueryBuilder';
import { UserSearchableFields } from '../../constants';
import { WalletModel } from '../wallet/wallet.model';
import { NotificationHelper } from '../notification/notification.helper';


const createUser = async (payload: Partial<IUser> & { password?: string }) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email: payload.email });
  if (existingUser) {
    throw new AppError(httpStatus.CONFLICT, 'User already exists with this email');
  }

  // Hash password if provided
  if (payload.password) {
    const saltRounds = 10;
    payload.passwordHash = await bcryptjs.hash(payload.password, saltRounds);
    delete payload.password;
  }

  const authProvider: IAuthProvider = {
    provider: 'email',
    providerId: payload.email as string,
  };

  payload.auths = [authProvider];

  // Start a session for transaction
  const session = await mongoose.startSession();
  
  try {
    // Start transaction
    session.startTransaction();

    // Create user within transaction
    const [user] = await User.create([payload], { session });
    
    // If user is a guide, create wallet
    if (payload.role === ERole.GUIDE) {
      await WalletModel.create([{ guideId: user._id }], { session });
    }

    // Commit transaction
    await session.commitTransaction();
    
    return user;
  } catch (error) {
    // Rollback transaction on error
    await session.abortTransaction();
    throw error;
  } finally {
    // End session
    session.endSession();
  }
};

const getAllUsers = async (query: Record<string, string>) => {
  const userQuery = new QueryBuilder(User.find(), query)
    .search(UserSearchableFields)
    .filter()
    .sort()
    .paginate();

  const [data, meta] = await Promise.all([
    userQuery.build().exec(),
    userQuery.getMeta(),
  ]);

  return {
    users: data,
    pagination: meta,
  };
};

const getAllGuides = async (query: Record<string, string>) => {
  const filterQuery: any = { role: "GUIDE", isDeleted: false, isVerified: true, IsActive: {$ne: IsActive.BLOCKED}};

 
  const userQuery = new QueryBuilder(
    User.find(filterQuery).select('-isDeleted -auths -passwordHash'),
    query
  )
    .search(UserSearchableFields)
    .filter()
    .sort()
    .paginate();

  const [data, meta] = await Promise.all([
    userQuery.build().exec(),
    userQuery.getMeta(),
  ]);

  return {
    users: data,
    pagination: meta,
  };
};

const getGuideFilterOptions = async () => {
  // Get all unique languages and expertise from verified guides
  const guides = await User.find({ 
    role: "GUIDE", 
    isDeleted: false
  }).select('languages expertise');

  // Extract unique languages
  const languagesSet = new Set<string>();
  guides.forEach(guide => {
    if (guide.languages && Array.isArray(guide.languages)) {
      guide.languages.forEach(lang => languagesSet.add(lang));
    }
  });

  // Extract unique expertise
  const expertiseSet = new Set<string>();
  guides.forEach(guide => {
    if (guide.expertise && Array.isArray(guide.expertise)) {
      guide.expertise.forEach(exp => expertiseSet.add(exp));
    }
  });

  return {
    languages: Array.from(languagesSet).sort(),
    expertise: Array.from(expertiseSet).sort(),
  };
};

const getTopRatedGuides = async (limit: number = 4) => {
  const guides = await User.find({
    role: "GUIDE",
    isDeleted: false,
    isVerified: true,
    reviewCount: { $gt: 0 } // Only guides with reviews
  })
    .select('-isDeleted -auths -passwordHash')
    .sort({ averageRating: -1, reviewCount: -1 }) // Sort by rating, then by review count
    .limit(limit);

  return guides;
};

const getUserById = async (id: string) => {
  const user = await User.findById(id);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }
  return user;
};

const getUserByEmail = async (email: string) => {
  const user = await User.findOne({ email }).select('+passwordHash');
  return user;
};

const updateUser = async (id: string, payload: Partial<IUser>) => {
  const user = await User.findById(id);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Prevent updating sensitive fields
  delete (payload as any).passwordHash;
  delete (payload as any).email;
  delete (payload as any).role;

  const updatedUser = await User.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return updatedUser;
};

const updateUserProfile = async (
  userId: string,
  payload: Partial<IUser>,
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Prevent updating sensitive fields
  delete (payload as any).passwordHash;
  delete (payload as any).email;
  delete (payload as any).role;
  delete (payload as any).isDeleted;

  const updatedUser = await User.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: true,
  });

  return updatedUser;
};

const updateUserByAdmin = async (id: string, payload: Partial<IUser>) => {
  const user = await User.findById(id);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Check if account status is being changed
  const statusChanged = payload.isActive && payload.isActive !== user.isActive;
  const oldStatus = user.isActive;

  // Prevent updating password and email through this route
  delete (payload as any).passwordHash;
  delete (payload as any).email;

  const updatedUser = await User.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  // Send notification if status changed
  if (statusChanged && updatedUser && payload.isActive) {
    await NotificationHelper.notifyAccountStatusChanged(updatedUser._id, payload.isActive);
  }

  return updatedUser;
};

const deleteUser = async (id: string) => {
  const user = await User.findById(id);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Soft delete
  const deletedUser = await User.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  );

  return deletedUser;
};

const getUsersByRole = async (role: ERole) => {
  const users = await User.find({ role });
  return users;
};

const verifyUser = async (id: string) => {
  const user = await User.findByIdAndUpdate(
    id,
    { isVerified: true },
    { new: true }
  );

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Send notification to user
  await NotificationHelper.notifyAccountVerified(user._id, user.name);

  return user;
};

export const userServices = {
  createUser,
  getAllUsers,
  getAllGuides,
  getGuideFilterOptions,
  getTopRatedGuides,
  getUserById,
  getUserByEmail,
  updateUser,
  updateUserProfile,
  updateUserByAdmin,
  deleteUser,
  getUsersByRole,
  verifyUser,
};
