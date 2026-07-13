// ============================================
// Global Error Handler Middleware
// ============================================
import { Request, Response, NextFunction } from 'express';
import { ApiError, errorResponse } from '../utils/apiResponse';
import env from '../config/env';

/**
 * Centralized error handling middleware.
 * Must be registered AFTER all routes.
 */
const errorHandler = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: Record<string, string[]> | undefined;

  // Custom API error
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError' && 'errors' in err) {
    statusCode = 400;
    message = 'Validation failed';
    const mongooseErrors = err as any;
    errors = {};
    Object.keys(mongooseErrors.errors).forEach((key) => {
      errors![key] = [mongooseErrors.errors[key].message];
    });
  }

  // Mongoose duplicate key error
  if ('code' in err && (err as any).code === 11000) {
    statusCode = 409;
    const keyValue = (err as any).keyValue;
    const field = Object.keys(keyValue)[0];
    message = `Duplicate value for '${field}'. This ${field} already exists.`;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource ID format.';
  }

  // Log error in development
  if (env.isDev) {
    console.error('❌ Error:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
  }

  res.status(statusCode).json(
    errorResponse({
      message,
      errors,
    })
  );
};

export default errorHandler;
