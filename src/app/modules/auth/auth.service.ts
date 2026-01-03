import { StatusCodes } from 'http-status-codes';
import AppError from '../../errorHelpers/AppError';
import { IAuthProvider, IsActive } from '../user/user.interface';
import { User } from '../user/user.model';
import bcryptjs from 'bcryptjs';
import {
  createAccessTokenWithRefresh,
  createUserTokens,
} from '../../utils/createTokens';
import { envVars } from '../../config/env';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { sendEmail } from '../../utils/sendMail';
import { verifyToken } from '../../utils/jwt';
import { NotificationHelper } from '../notification/notification.helper';

const userLogin = async (email: string, password: string) => {
  const user = await User.findOne({ email }).select('+passwordHash');

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  if (user.isDeleted) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'User is deleted');
  }

  if (user.isActive !== IsActive.ACTIVE) {
    throw new AppError(StatusCodes.BAD_REQUEST, `User is ${user.isActive}`);
  }

  if (!user.passwordHash) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Password not set for this user'
    );
  }

  const isPasswordMatch = await bcryptjs.compare(password, user.passwordHash);

  if (!isPasswordMatch) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid credentials');
  }

  const tokens = createUserTokens(user);

  return {
    user,
    tokens,
  };
};

const getNewAccessToken = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new AppError(StatusCodes.NOT_FOUND, 'no RefreshToken Received');
  }

  const accessToken = await createAccessTokenWithRefresh(refreshToken);
  return {
    accessToken: accessToken,
  };
};

const changePassword = async (
  oldPassword: string,
  newPassword: string,
  decodedUser: JwtPayload
) => {
  const user = await User.findById(decodedUser.userId).select('+passwordHash');

  if (!user) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'User Not Found');
  }

  if (user.isDeleted && user.isActive === IsActive.BLOCKED) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'User is Blocked or Deleted');
  }

  if (!user.passwordHash) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'User does not have a password set'
    );
  }

  const isOldPassword = await bcryptjs.compare(oldPassword, user.passwordHash);

  if (!isOldPassword) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Old Password does not match');
  }

  user.passwordHash = await bcryptjs.hash(
    newPassword,
    envVars.BCRYPT_SALT_ROUND
  );

  await user.save();
};

const setPassword = async (password: string, decodedUser: JwtPayload) => {
  const user = await User.findById(decodedUser.userId).select('+passwordHash');

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  if (user.passwordHash && user.auths[0]?.provider !== 'email') {
    throw new AppError(StatusCodes.BAD_REQUEST, 'User already has a password');
  }

  const hashPassword = await bcryptjs.hash(password, envVars.BCRYPT_SALT_ROUND);

  const credentialProvider: IAuthProvider = {
    provider: 'email',
    providerId: user.email,
  };

  const auths: IAuthProvider[] = [...user.auths, credentialProvider];
  user.passwordHash = hashPassword;
  user.isActive = IsActive.ACTIVE;
  user.auths = auths;

  await user.save();
  return {
    user: user.toObject(),
  };
};

const forgotPassword = async (email: string) => {
  const isUserExist = await User.findOne({ email });

  if (!isUserExist) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'User does not exist');
  }
  if (!isUserExist.isVerified) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'User is not verified');
  }
  if (
    isUserExist.isActive === IsActive.BLOCKED ||
    isUserExist.isActive === IsActive.INACTIVE
  ) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `User is ${isUserExist.isActive}`
    );
  }
  if (isUserExist.isDeleted) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'User is deleted');
  }

  const JwtPayload = {
    userId: isUserExist._id,
    email: isUserExist.email,
    role: isUserExist.role,
  };

  const resetToken = jwt.sign(JwtPayload, envVars.JWT_ACCESS_SECRET, {
    expiresIn: '10m',
  });

  const sendingLink = `${envVars.FRONTEND_URL}/reset-password?id=${isUserExist._id}&token=${resetToken}`;

  sendEmail({
    to: isUserExist.email,
    subject: 'Password Reset Request',
    templateName: 'forgetPassword',
    templateData: {
      name: isUserExist.name,
      sendingLink: sendingLink,
    },
  });
};

const resetPassword = async (payload: Record<string, any>) => {
  const verifiedToken = verifyToken(
    payload.token,
    envVars.JWT_ACCESS_SECRET
  ) as JwtPayload;

  console.log(verifiedToken);
  

  const decodedUser = verifiedToken as JwtPayload;


  if (payload.id !== decodedUser.userId) {
    throw new AppError(401, 'You can not reset your password');
  }

  const isUserExist = await User.findById(decodedUser.userId).select(
    '+passwordHash'
  );

  if (!isUserExist) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'User Does not Exist');
  }

  const isHashPassword = await bcryptjs.hash(
    payload.newPassword,
    envVars.BCRYPT_SALT_ROUND
  );

  isUserExist.passwordHash = isHashPassword;
  isUserExist.isActive = IsActive.ACTIVE;

  await isUserExist.save();

  // Send notification to user
  await NotificationHelper.notifyPasswordResetSuccess(isUserExist._id, isUserExist.name);
};

const getMe = async (decodedUser: JwtPayload) => {
  const me = await User.findById(decodedUser.userId);

  if (!me) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  return me;
};

export const authServices = {
  userLogin,
  getNewAccessToken,
  changePassword,
  setPassword,
  forgotPassword,
  resetPassword,
  getMe,
};
