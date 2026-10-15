/**
 * PulseCare Health System - Health Check & Observability Controller
 * Implements standard cloud-native liveness and readiness probes.
 * 
 * Liveness (/health): Fast, non-blocking check used by AWS ALB / ECS to detect process hangs.
 * Readiness (/health/ready): Deep check verifying active database query connectivity.
 */

import { Request, Response } from 'express';
import db from '../../database/db.js';
import metricsService from '../services/metrics.service.js';

export class HealthController {
  /**
   * Liveness Probe (GET /health)
   * Rapid HTTP 200 response to indicate the Node.js process is active.
   * Does NOT query external systems to prevent cascading failure in load balancers.
   */
  public static liveness(req: Request, res: Response): void {
    res.status(200).json({
      status: 'healthy',
      service: 'PulseCare-Health-System',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
    });
  }

  /**
   * Readiness Probe (GET /health/ready)
   * Deeper verification that verifies database availability and query latency.
   * If the database is unreachable, returns 503 Service Unavailable so AWS ALB
   * can divert traffic from unhealthy container targets.
   */
  public static async readiness(req: Request, res: Response): Promise<void> {
    const dbHealth = await db.checkHealth();

    const isReady = dbHealth.status === 'healthy';
    const statusCode = isReady ? 200 : 503;

    res.status(statusCode).json({
      status: isReady ? 'ready' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: dbHealth,
      memory: process.memoryUsage(),
      uptime_seconds: process.uptime(),
    });
  }

  /**
   * Metrics Endpoint (GET /api/metrics)
   * Returns application-level metrics formatted for AWS CloudWatch Metric Filters.
   */
  public static metrics(req: Request, res: Response): void {
    const summary = metricsService.getSummary();
    res.json(summary);
  }
}

export default HealthController;
