import { Response } from 'express';
import { ApiSuccessResponse, ApiErrorResponse } from '../../../shared/types/api.types';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200) {
  const payload: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta: {
      simulated: true,
      timestamp: new Date().toISOString()
    }
  };
  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response, 
  code: string, 
  message: string, 
  statusCode = 400, 
  details?: any
) {
  const payload: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      details
    },
    meta: {
      simulated: true,
      timestamp: new Date().toISOString()
    }
  };
  return res.status(statusCode).json(payload);
}
