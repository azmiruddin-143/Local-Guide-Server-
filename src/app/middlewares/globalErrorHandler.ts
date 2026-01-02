import { NextFunction, Request, Response } from 'express';


import { handleDuplicateError } from '../helpers/handleDuplicateError';
import { handleCastError } from '../helpers/handleCastError';
import { handlerValidationError } from '../helpers/handlerValidationError';
import { TErrorSources } from '../interfaces/error.types';
import { handlerZodError } from '../helpers/handlerZodError';
import { envVars } from '../config/env';
import AppError from '../errorHelpers/AppError';

export const globalErrorHandler = async (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (envVars.NODE_ENV === 'development') {
    console.log(err);
  }
  let statusCode = 500;
  let message = `Something Went Wrong!! ${err.message}`;
  let errorSources: TErrorSources[] = [];

  if (err.code === 11000) {
    const simplifiedError = handleDuplicateError(err);

    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
  } else if (err.name === 'CastError') {
    const simplifiedError = handleCastError(err);

    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
  } else if (err.name === 'ValidationError') {
    const simplifiedError = handlerValidationError(err);
    statusCode = simplifiedError.statusCode;
    errorSources = simplifiedError.errorSources as TErrorSources[];
    message = simplifiedError.message;
  } else if (err.name === 'ZodError') {
    const simplifiedError = handlerZodError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources as TErrorSources[];
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Error) {
    statusCode = 500;
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message: message,
    errorSources,
    err,
    stack: envVars.NODE_ENV === 'development' ? err.stack : null,
  });
};
