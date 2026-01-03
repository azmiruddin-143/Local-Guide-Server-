


/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";

import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { authServices } from "./auth.service";
import { setAuthCookie } from "../../utils/setCookie";
import AppError from "../../errorHelpers/AppError";
import passport from "passport";
import { createUserTokens } from "../../utils/createTokens";
import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../../config/env";



const userLogin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
      
  passport.authenticate('local', async (err: any, user: any, info: any) => {

    if (err) {
      console.log(err);
      
      return next(err);
    }
    if (!user) {
      return next(new AppError(StatusCodes.NOT_FOUND, info.message));
    }

    const tokenInfo =  createUserTokens(user);

    const { passwordHash, ...rest } = user.toObject();

    setAuthCookie(res, tokenInfo);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'User Login Successfully',
      data: {
        accessToken: tokenInfo.accessToken,
        refreshToken: tokenInfo.refreshToken,
        ...rest,
      },
    });
  })(req, res, next);
}
);

const getNewAccessToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
     const refreshToken = req.cookies.refreshToken;
    const loginInfo = await authServices.getNewAccessToken(refreshToken)

    setAuthCookie(res, loginInfo);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'User Login Successfully!',
      data: loginInfo,
    });
  }
);


const changePassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
   const oldPassword = req.body.oldPassword;
   const newPassword = req.body.newPassword;
   const decodedUser = req.user;

   await authServices.changePassword(
     oldPassword,
     newPassword,
     decodedUser as JwtPayload
   );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Password Changed Successfully!',
      data: null,
    });
  }
);


const setPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {

    const decodedUser = req.user
    const password = req.body.password

    await authServices.setPassword(password , decodedUser as JwtPayload)
   
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Password Changed Successfully!',
      data: null,
    });
  }
);


const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {

    const { email } = req.body;

    await authServices.forgotPassword(email);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Email Send Successfully!',
      data: null,
    });
  }
);

const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {

   await authServices.resetPassword(req.body);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Password Changed Successfully!',
      data: null,
    });
  }
);


const gatMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = req.user;

   const me =  await authServices.getMe(decodedUser as JwtPayload);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Data received Successfully!',
      data: me,
    });
  }
);

const googleCallbackController = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
   let redirectTo = req.query.state ? (req.query.state as string) : '';

   if (redirectTo.startsWith('/')) {
     redirectTo = redirectTo.slice(1);
   }
   const user = req.user;

   if (!user) {
     throw new AppError(StatusCodes.NOT_FOUND, 'User Not Found');
   }

   const tokenInfo = createUserTokens(user);

   setAuthCookie(res, tokenInfo);

   res.redirect(`${envVars.FRONTEND_URL}/${redirectTo}`);
  }
);



const logout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {

     res.clearCookie('accessToken', {
       httpOnly: true,
       secure: true,
       sameSite: 'none',
     });

     res.clearCookie('refreshToken', {
       httpOnly: true,
       secure: true,
       sameSite: 'none',
     });
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'User LogOut Successfully!',
      data: null,
    });
  }
);



export const AuthController = {
  userLogin,
  getNewAccessToken,
  logout,
  resetPassword,
  googleCallbackController,
  changePassword,
  setPassword,
  forgotPassword,
  gatMe,
};