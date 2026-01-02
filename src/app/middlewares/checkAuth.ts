import { envVars } from '../config/env';
import AppError from '../errorHelpers/AppError';
import { verifyToken } from '../utils/jwt';
import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { User } from '../modules/user/user.model';
import { IsActive } from '../modules/user/user.interface';
import { StatusCodes } from 'http-status-codes';

export const checkAuth = (...authRole: string[]) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      let accessToken;

      if (req.cookies?.accessToken) {
        accessToken = req.cookies.accessToken;
      }

      else if (req.headers?.authorization?.startsWith("Bearer ")) {
        accessToken = req.headers.authorization.split(" ")[1];
      }
        
      else if (req.body?.token) {
        accessToken = req.body.token;
      }

      if (!accessToken) {
        throw new AppError(StatusCodes.FORBIDDEN, 'No Token Received');
      }
      const decodedToken = verifyToken(
        accessToken,
        envVars.JWT_ACCESS_SECRET
      ) as JwtPayload;

      const isUserExist = await User.findOne({ email: decodedToken.email });

      if (!isUserExist) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'User does not exist');
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

      if (!authRole.includes(decodedToken.role)) {
        throw new AppError(403, 'You are not permitted to view this route!!!');
      }

      req.user = decodedToken;
      next();
    } catch (error) {
      next(error);
    }
  };
