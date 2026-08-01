import { ApiError } from '../utils/ApiError.js';

/**
 * Global Error Handler Middleware
 */
export const errorHandler = (err, req, res, _next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  // Handle Mongoose duplicate key error (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Account with this ${field} already exists`;
    error = new ApiError(409, message, [{ field, message }]);
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const formattedErrors = Object.values(err.errors).map((el) => ({
      field: el.path,
      message: el.message,
    }));
    error = new ApiError(400, 'Validation Error', formattedErrors);
  }

  const response = {
    statusCode: error.statusCode,
    success: false,
    message: error.message,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  };

  res.status(error.statusCode).json(response);
};
