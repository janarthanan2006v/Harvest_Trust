import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  fieldErrors?: Record<string, string>;
}

export function errorMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const requestId = req.requestId || 'unknown';
  
  // Log the error internally (excluding sensitive details in production)
  console.error(`[Error] RequestID: ${requestId} - ${err.stack || err.message || err}`);

  // Handle Zod Validation Error
  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    err.errors.forEach((e) => {
      const field = e.path.join('.');
      fieldErrors[field] = e.message;
    });

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Please correct the highlighted fields.',
        fieldErrors
      },
      requestId
    });
  }

  // Handle custom application errors
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  const errorMessage = err.message || 'An unexpected error occurred.';

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: errorMessage,
      ...(err.fieldErrors ? { fieldErrors: err.fieldErrors } : {})
    },
    requestId
  });
}
