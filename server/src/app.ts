import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import apiRoutes from './routes/api.routes';
import { globalLimiter } from './middleware/rateLimiter.middleware';
import { errorHandler } from './middleware/error.middleware';
import { ENV } from './config/env';

export const app = express();

// Security headers with simulator exceptions for local dev
app.use(helmet({
  crossOriginResourcePolicy: false
}));

// CORS setup for Vite frontend (supports localhost, custom CLIENT_ORIGIN, and Vercel domains)
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      origin === ENV.CLIENT_ORIGIN ||
      origin === 'http://localhost:5173' ||
      origin === 'http://127.0.0.1:5173' ||
      origin.endsWith('.vercel.app') ||
      ENV.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key']
}));

app.use(cookieParser());
app.use(express.json());

// Persistent Simulator Disclaimer Header
app.use((req, res, next) => {
  res.setHeader('X-Simulation-Warning', 'Bank of Maldives Internet Banking Demo Only - Zero Real Money Movement');
  next();
});

// Global Rate Limiting
app.use('/api', globalLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    simulator: true,
    disclaimer: 'FICTIONAL FINTECH SIMULATOR - DEMO ONLY',
    time: new Date().toISOString()
  });
});

// REST API v1
app.use('/api/v1', apiRoutes);

// Centralized error handler
app.use(errorHandler);
