/* eslint-disable @typescript-eslint/no-explicit-any */
import { IGenericErrorResponse } from "../interfaces/error.types";

export const handleDuplicateError = (err: any): IGenericErrorResponse => {
  const matchedArray = err.message.match(/"([^"]*)"/);
  
  // If regex doesn't match, provide a generic message
  const duplicateValue = matchedArray ? matchedArray[1] : 'This record';

  return {
    statusCode: 400,
    message: `${duplicateValue} already exists!!`,
  };
}