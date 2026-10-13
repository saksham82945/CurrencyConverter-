import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.util';

interface CachedResponse {
  statusCode: number;
  body: any;
  timestamp: number;
}

// In-memory LRU/TTL cache for idempotency keys (24-hour expiration)
const idempotencyStore = new Map<string, CachedResponse>();
const TTL_MS = 24 * 60 * 60 * 1000;

export function requireIdempotency(req: Request, res: Response, next: NextFunction) {
  const key = (req.headers['idempotency-key'] || req.headers['x-idempotency-key']) as string;
  if (!key) {
    return sendError(
      res, 
      'IDEMPOTENCY_KEY_REQUIRED', 
      'Mutation requests must provide an Idempotency-Key header.', 
      400
    );
  }

  const cached = idempotencyStore.get(key);
  if (cached) {
    if (Date.now() - cached.timestamp < TTL_MS) {
      return res.status(cached.statusCode).json(cached.body);
    } else {
      idempotencyStore.delete(key);
    }
  }

  // Intercept json response to cache it
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      idempotencyStore.set(key, {
        statusCode: res.statusCode,
        body,
        timestamp: Date.now()
      });
    }
    return originalJson(body);
  };

  next();
}
