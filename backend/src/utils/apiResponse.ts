// ============================================
// API Response Helper
// ============================================

interface SuccessResponseOptions<T> {
  message?: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ErrorResponseOptions {
  message?: string;
  errors?: Record<string, string[]>;
}

/**
 * Standardized success response.
 */
export const successResponse = <T>(options: SuccessResponseOptions<T> = {}) => {
  const { message = 'Success', data, pagination } = options;
  const response: Record<string, unknown> = {
    success: true,
    message,
  };

  if (data !== undefined) {
    response.data = data;
  }

  if (pagination) {
    response.pagination = {
      ...pagination,
      hasNextPage: pagination.page < pagination.totalPages,
      hasPrevPage: pagination.page > 1,
    };
  }

  return response;
};

/**
 * Standardized error response.
 */
export const errorResponse = (options: ErrorResponseOptions = {}) => {
  const { message = 'An error occurred', errors } = options;
  const response: Record<string, unknown> = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return response;
};

/**
 * Custom API error class with status code.
 */
export class ApiError extends Error {
  statusCode: number;
  errors?: Record<string, string[]>;

  constructor(statusCode: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = 'ApiError';

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
