// ============================================
// Zod Validation Middleware
// ============================================
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from '../utils/apiResponse';

/**
 * Validate request body, query, or params against a Zod schema.
 * Usage: validate(schema, 'body') or validate(schema, 'query')
 */
const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = req[source];
      const result = schema.parse(data);
      // Replace with parsed (coerced/transformed) data
      req[source] = result;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors: Record<string, string[]> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!formattedErrors[path]) {
            formattedErrors[path] = [];
          }
          formattedErrors[path].push(err.message);
        });

        return next(new ApiError(400, 'Validation failed', formattedErrors));
      }
      next(error);
    }
  };
};

export default validate;
