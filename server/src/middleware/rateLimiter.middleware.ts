import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again in a few minutes.'
    },
    meta: {
      simulated: true,
      timestamp: new Date().toISOString()
    }
  }
});

export const transferLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // Unlimited demonstration throughput
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TRANSFER_RATE_LIMIT_EXCEEDED',
      message: 'Too many transfer attempts. Please wait a minute.'
    },
    meta: {
      simulated: true,
      timestamp: new Date().toISOString()
    }
  }
});
