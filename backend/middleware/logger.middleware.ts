/**
 * PulseCare Health System - CloudWatch JSON Request Logger
 * Emits production-grade structured JSON log entries suitable for ingestion by
 * AWS CloudWatch Logs, AWS FireLens, and Datadog/ELK forwarders.
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import metricsService from '../services/metrics.service.js';

export function cloudWatchRequestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.requestId = requestId;

  res.setHeader('X-Request-ID', requestId);

  // Intercept completion
  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Record metrics
    metricsService.recordRequest(statusCode, durationMs);

    // Skip verbose logs for static assets during dev
    if (req.originalUrl.startsWith('/@') || req.originalUrl.startsWith('/node_modules')) {
      return;
    }

    const structuredLog = {
      log_level: statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO',
      timestamp: new Date().toISOString(),
      request_id: requestId,
      http_method: req.method,
      request_path: req.originalUrl,
      status_code: statusCode,
      duration_ms: durationMs,
      client_ip: req.ip || req.socket.remoteAddress,
      user_id: req.user ? req.user.id : null,
      user_role: req.user ? req.user.role : 'unauthenticated',
      user_agent: req.headers['user-agent'] || 'unknown',
    };

    if (statusCode >= 500) {
      console.error(JSON.stringify(structuredLog));
    } else if (statusCode >= 400) {
      console.warn(JSON.stringify(structuredLog));
    } else {
      console.log(JSON.stringify(structuredLog));
    }
  });

  next();
}

export default cloudWatchRequestLogger;
