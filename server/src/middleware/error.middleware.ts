import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.util';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('[Error Middleware]', err);

  const statusCode = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);
  const code = err.code || err.name || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred in the simulation engine';

  return sendError(res, code, message, statusCode, err.details);
}
