/**
 * PulseCare Health System - Regulatory Audit Logging Service
 * Records audit trails for healthcare access compliance (DSPT / HIPAA style)
 * Every patient chart view, prescription creation, and auth event is logged.
 */

import db from '../../database/db.js';

export interface AuditEventParams {
  userId?: number | null;
  userRole?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | number | null;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure' | 'denied';
  details?: Record<string, any>;
}

export class AuditService {
  public static async log(params: AuditEventParams): Promise<void> {
    const timestamp = new Date().toISOString();
    const detailsJson = params.details ? JSON.stringify(params.details) : null;

    const sanitizedDetails = { ...(params.details || {}) };
    if (sanitizedDetails.error) {
      sanitizedDetails.reason = sanitizedDetails.error;
      delete sanitizedDetails.error;
    }

    // Output structured CloudWatch-friendly JSON log
    const cloudWatchEvent = {
      log_type: 'AUDIT_TRAIL',
      timestamp,
      user_id: params.userId || null,
      user_role: params.userRole || 'anonymous',
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId ? String(params.resourceId) : null,
      status: params.status,
      ip_address: params.ipAddress || 'unknown',
      details: sanitizedDetails,
    };

    console.log(JSON.stringify(cloudWatchEvent));

    // Persist to relational audit_logs table
    try {
      await db.execute(
        `INSERT INTO audit_logs (user_id, user_role, action, resource_type, resource_id, ip_address, user_agent, status, details_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          params.userId || null,
          params.userRole || null,
          params.action,
          params.resourceType,
          params.resourceId ? String(params.resourceId) : null,
          params.ipAddress || null,
          params.userAgent || null,
          params.status,
          detailsJson,
        ]
      );
    } catch (err) {
      console.error('[AUDIT] Failed to persist audit log to database:', err);
    }
  }
}

export default AuditService;
