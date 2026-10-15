/**
 * PulseCare Health System - Global Error Handler Middleware
 * Sanitizes uncaught errors to prevent information disclosure (CWE-209).
 * Internal stack traces and database schemas are NEVER exposed to the client.
 */

import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  const statusCode = err.statusCode || err.status || 500;
  const requestId = req.requestId || 'unknown';

  // Log full stack trace internally for CloudWatch debugging
  console.error(JSON.stringify({
    log_level: 'ERROR',
    timestamp: new Date().toISOString(),
    request_id: requestId,
    error_message: err.message,
    stack: err.stack,
    request_path: req.originalUrl,
  }));

  res.status(statusCode).json({
    error: statusCode >= 500 ? 'Internal Server Error' : err.name || 'Error',
    message: statusCode >= 500
      ? 'An unexpected error occurred. The incident has been recorded with reference ID: ' + requestId
      : err.message,
    requestId,
  });
}

export default errorHandler;
