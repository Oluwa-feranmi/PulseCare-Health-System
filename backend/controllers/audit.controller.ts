/**
 * PulseCare Health System - Regulatory Audit Controller
 * Provides audit trail query access for compliance reviews and security event analysis.
 */

import { Request, Response } from 'express';
import db from '../../database/db.js';

export class AuditController {
  public static async listAuditLogs(req: Request, res: Response): Promise<void> {
    const { action, status, limit = '100' } = req.query;

    try {
      let sql = `
        SELECT a.*, u.email as user_email, u.full_name as user_name
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
      `;
      const conditions: string[] = [];
      const params: any[] = [];

      if (action) {
        conditions.push(`a.action LIKE ?`);
        params.push(`%${action}%`);
      }

      if (status) {
        conditions.push(`a.status = ?`);
        params.push(status);
      }

      if (conditions.length > 0) {
        sql += ` WHERE ` + conditions.join(' AND ');
      }

      sql += ` ORDER BY a.timestamp DESC LIMIT ?`;
      params.push(Math.min(parseInt(limit as string, 10) || 100, 500));

      const result = await db.query(sql, params);
      res.json({ auditLogs: result.rows });
    } catch (err: any) {
      res.status(500).json({ error: 'Server Error', message: err.message });
    }
  }
}

export default AuditController;
