

export interface TErrorSources {
  path: string;
  message: string;
}


export interface IGenericErrorResponse {
  statusCode: number,
  message: string,
  errorSources?: TErrorSources[]
}