import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { requestIdMiddleware } from './middleware/request-id.middleware.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import apiRouter from './routes/api.router.js';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Security and utility middleware
app.use(cors({
  origin: '*', // For SIH local evaluation, allow any origin. In production, restrict to frontend URI.
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
}));

app.use(express.json());
app.use(morgan('dev'));
app.use(requestIdMiddleware);

// API router mount
app.use('/api', apiRouter);

// Base landing redirect / info
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the HarvestTrust API Service.',
    docs: '/api/health',
    student: 'JANARTHANAN V (Reg: 411723205021)',
    version: '1.0.0'
  });
});

// Centralized error handling
app.use(errorMiddleware as any);

// Start server
const server = app.listen(port, () => {
  console.log(`[Server] HarvestTrust API running on http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Shutting down gracefully.');
  server.close(() => {
    console.log('[Server] Closed remaining connections.');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Server] Uncaught Exception:', error);
  process.exit(1);
});
