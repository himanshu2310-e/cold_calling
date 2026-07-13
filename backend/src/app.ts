// ============================================
// Express Application Setup
// ============================================
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import env from './config/env';
import routes from './routes';
import errorHandler from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';

const app = express();

// ---- Security Middleware ----
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ---- Parsing Middleware ----
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ---- Security: NoSQL Injection & HPP ----
app.use(mongoSanitize());
app.use(hpp());

// ---- Logging ----
if (env.isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ---- Rate Limiting ----
app.use('/api/', apiLimiter);

// ---- API Routes ----
app.use('/api/v1', routes);

// ---- Root endpoint ----
app.get('/', (_req, res) => {
  res.json({
    name: 'ColdConnect CRM API',
    version: '1.0.0',
    status: 'running',
    docs: '/api/v1/health',
  });
});

// ---- 404 Handler ----
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// ---- Global Error Handler (must be last) ----
app.use(errorHandler);

export default app;
