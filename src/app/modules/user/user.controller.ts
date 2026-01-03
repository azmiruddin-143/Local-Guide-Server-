import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes as httpStatus } from 'http-status-codes';
import { userServices } from './user.service';

const createUser = catchAsync(async (req: Request, res: Response) => {
  const result = await userServices.createUser(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'User registered successfully',
    data: result,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await userServices.getAllUsers(req.query as Record<string, string>);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Users retrieved successfully',
    data: result.users,
    meta: result.pagination,
  });
});


const getAllGuides = catchAsync(async (req: Request, res: Response) => {
  const result = await userServices.getAllGuides(req.query as Record<string, string>);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Guides retrieved successfully',
    data: result.users,
    meta: result.pagination,
  });
});

const getGuideFilterOptions = catchAsync(async (req: Request, res: Response) => {
  const result = await userServices.getGuideFilterOptions();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Guide filter options retrieved successfully',
    data: result,
  });
});

const getTopRatedGuides = catchAsync(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 4;
  const result = await userServices.getTopRatedGuides(limit);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Top rated guides retrieved successfully',
    data: result,
  });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await userServices.getUserById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User retrieved successfully',
    data: result,
  });
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await userServices.updateUserByAdmin(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User updated successfully',
    data: result,
  });
});

const updateUserProfile = catchAsync(async (req: Request, res: Response) => {
  const decodedUser = req.user as any; 

  console.log('=== updateUserProfile Controller ===');
  console.log('User ID:', decodedUser.userId);
  console.log('Request body:', req.body);
  console.log('Request file:', req.file);

  const payload: any = {
    ...req.body
  };

  // Handle file upload
  if (req.file?.path) {
    payload.avatarUrl = req.file.path;
    console.log('✓ File uploaded to:', req.file.path);
  } else {
    console.log('✗ No file uploaded');
  }

  // Convert string numbers to actual numbers for dailyRate
  if (payload.dailyRate) {
    if (typeof payload.dailyRate === 'string') {
      payload.dailyRate = parseFloat(payload.dailyRate);
    }
    console.log('Daily rate:', payload.dailyRate);
  }

  console.log('Final payload:', JSON.stringify(payload, null, 2));

  const result = await userServices.updateUserProfile(decodedUser.userId, payload);

  console.log('✓ Profile updated successfully');

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Profile updated successfully',
    data: result,
  });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await userServices.deleteUser(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User deleted successfully',
    data: result,
  });
});

const getUsersByRole = catchAsync(async (req: Request, res: Response) => {
  const { role } = req.params;
  const result = await userServices.getUsersByRole(role as any);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `${role}s retrieved successfully`,
    data: result,
  });
});

const verifyUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await userServices.verifyUser(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User verified successfully',
    data: result,
  });
});

export const userController = {
  createUser,
  getAllUsers,
  getAllGuides,
  getGuideFilterOptions,
  getTopRatedGuides,
  getUserById,
  updateUser,
  updateUserProfile,
  deleteUser,
  getUsersByRole,
  verifyUser,
};
