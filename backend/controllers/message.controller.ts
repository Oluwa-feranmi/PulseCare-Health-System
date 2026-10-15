/**
 * PulseCare Health System - Secure Communications & Messaging Controller
 * Handles patient notifications, clinical communications, and reminder alerts.
 */

import { Request, Response } from 'express';
import db from '../../database/db.js';
import AuditService from '../services/audit.service.js';

export class MessageController {
  public static async listMessages(req: Request, res: Response): Promise<void> {
    const { patientId } = req.query;

    try {
      let sql = `
        SELECT m.*,
               p.healthcare_identifier, u_p.full_name as patient_name,
               u_c.full_name as clinician_name, c.title as clinician_title
        FROM messages m
        JOIN patients p ON m.patient_id = p.id
        JOIN users u_p ON p.user_id = u_p.id
        LEFT JOIN clinicians c ON m.clinician_id = c.id
        LEFT JOIN users u_c ON c.user_id = u_c.id
      `;
      const params: any[] = [];

      if (req.user?.role === 'patient') {
        sql += ` WHERE m.patient_id = ?`;
        params.push(req.user.patient_id);
      } else if (patientId) {
        sql += ` WHERE m.patient_id = ?`;
        params.push(parseInt(patientId as string, 10));
      }

      sql += ` ORDER BY m.created_at DESC`;

      const result = await db.query(sql, params);
      res.json({ messages: result.rows });
    } catch (err: any) {
      console.error('[MSG] listMessages error:', err);
      res.status(500).json({ error: 'Server Error', message: err.message });
    }
  }

  public static async sendMessage(req: Request, res: Response): Promise<void> {
    const { patient_id, clinician_id, subject, content, category } = req.body;

    let targetPatientId = patient_id;
    if (req.user?.role === 'patient') {
      targetPatientId = req.user.patient_id;
    }

    if (!targetPatientId || !subject || !content) {
      res.status(400).json({ error: 'Validation Error', message: 'Patient, subject, and message content are required.' });
      return;
    }

    const senderType = req.user?.role === 'clinician' ? 'clinician' : 'patient';

    try {
      const insertRes = await db.execute(
        `INSERT INTO messages (patient_id, clinician_id, sender_type, subject, content, is_read, category)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          targetPatientId,
          clinician_id || (req.user?.role === 'clinician' ? req.user.clinician_id : null),
          senderType,
          subject.trim(),
          content.trim(),
          false,
          category || 'general',
        ]
      );

      await AuditService.log({
        userId: req.user?.id,
        userRole: req.user?.role,
        action: 'SECURE_MESSAGE_SENT',
        resourceType: 'message',
        resourceId: insertRes.lastInsertId,
        ipAddress: req.ip,
        status: 'success',
        details: { patient_id: targetPatientId, sender_type: senderType, subject },
      });

      res.status(201).json({ message: 'Message sent successfully', messageId: insertRes.lastInsertId });
    } catch (err: any) {
      console.error('[MSG] sendMessage error:', err);
      res.status(500).json({ error: 'Server Error', message: err.message });
    }
  }

  public static async markAsRead(req: Request, res: Response): Promise<void> {
    const messageId = parseInt(req.params.id, 10);
    if (isNaN(messageId)) {
      res.status(400).json({ error: 'Bad Request', message: 'Invalid message ID' });
      return;
    }

    try {
      const msgRes = await db.query('SELECT * FROM messages WHERE id = ?', [messageId]);
      if (msgRes.rows.length === 0) {
        res.status(404).json({ error: 'Not Found', message: 'Message not found' });
        return;
      }

      const msg = msgRes.rows[0];
      if (req.user?.role === 'patient' && msg.patient_id !== req.user.patient_id) {
        res.status(403).json({ error: 'Forbidden', message: 'Cannot update messages for another patient.' });
        return;
      }

      await db.execute('UPDATE messages SET is_read = ? WHERE id = ?', [true, messageId]);
      res.json({ message: 'Marked as read' });
    } catch (err: any) {
      res.status(500).json({ error: 'Server Error', message: err.message });
    }
  }
}

export default MessageController;
