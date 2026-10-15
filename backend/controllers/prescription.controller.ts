/**
 * PulseCare Health System - Prescriptions & Medications Controller
 * Handles prescription issuance, clinical review, refills, and medication formulary.
 */

import { Request, Response } from 'express';
import db from '../../database/db.js';
import AuditService from '../services/audit.service.js';
import metricsService from '../services/metrics.service.js';

export class PrescriptionController {
  /**
   * List prescriptions (Patient views theirs, Clinician views by patient or all)
   */
  public static async listPrescriptions(req: Request, res: Response): Promise<void> {
    const { patientId, status } = req.query;

    try {
      let sql = `
        SELECT pr.*, 
               p.healthcare_identifier, u_p.full_name as patient_name,
               c.staff_identifier, u_c.full_name as clinician_name, c.title as clinician_title,
               m.form as medication_form
        FROM prescriptions pr
        JOIN patients p ON pr.patient_id = p.id
        JOIN users u_p ON p.user_id = u_p.id
        JOIN clinicians c ON pr.clinician_id = c.id
        JOIN users u_c ON c.user_id = u_c.id
        LEFT JOIN medications m ON pr.medication_id = m.id
      `;
      const conditions: string[] = [];
      const params: any[] = [];

      if (req.user?.role === 'patient') {
        conditions.push(`pr.patient_id = ?`);
        params.push(req.user.patient_id);
      } else if (patientId) {
        conditions.push(`pr.patient_id = ?`);
        params.push(parseInt(patientId as string, 10));
      }

      if (status) {
        conditions.push(`pr.status = ?`);
        params.push(status);
      }

      if (conditions.length > 0) {
        sql += ` WHERE ` + conditions.join(' AND ');
      }

      sql += ` ORDER BY pr.created_at DESC`;

      const result = await db.query(sql, params);
      res.json({ prescriptions: result.rows });
    } catch (err: any) {
      console.error('[RX] listPrescriptions error:', err);
      res.status(500).json({ error: 'Server Error', message: err.message });
    }
  }

  /**
   * Issue New Prescription (Clinician only)
   */
  public static async createPrescription(req: Request, res: Response): Promise<void> {
    const { patient_id, medication_id, medication_name, dosage, frequency, start_date, end_date, refills_remaining, instructions } = req.body;

    if (!patient_id || !medication_name || !dosage || !frequency || !instructions) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Patient ID, medication name, dosage, frequency, and instructions are required.',
      });
      return;
    }

    const clinicianId = req.user?.clinician_id;
    if (!clinicianId) {
      res.status(403).json({ error: 'Forbidden', message: 'Staff profile required to issue prescriptions.' });
      return;
    }

    try {
      const pCheck = await db.query('SELECT id, allergies FROM patients WHERE id = ?', [patient_id]);
      if (pCheck.rows.length === 0) {
        res.status(404).json({ error: 'Not Found', message: 'Patient not found' });
        return;
      }

      const insertRes = await db.execute(
        `INSERT INTO prescriptions 
          (patient_id, clinician_id, medication_id, medication_name, dosage, frequency, start_date, end_date, refills_remaining, instructions, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          patient_id,
          clinicianId,
          medication_id || null,
          medication_name.trim(),
          dosage.trim(),
          frequency.trim(),
          start_date || new Date().toISOString().slice(0, 10),
          end_date || null,
          refills_remaining !== undefined ? parseInt(refills_remaining, 10) : 1,
          instructions.trim(),
          'active',
        ]
      );

      const rxId = insertRes.lastInsertId!;
      metricsService.recordPrescriptionIssued();

      // Notify patient automatically
      await db.execute(
        `INSERT INTO messages (patient_id, clinician_id, sender_type, subject, content, is_read, category)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          patient_id,
          clinicianId,
          'clinician',
          `New Prescription Authorised: ${medication_name}`,
          `A new electronic prescription for ${medication_name} (${dosage}, ${frequency}) has been issued. Instructions: ${instructions}.`,
          false,
          'prescription_update',
        ]
      );

      await AuditService.log({
        userId: req.user?.id,
        userRole: req.user?.role,
        action: 'PRESCRIPTION_ISSUED',
        resourceType: 'prescription',
        resourceId: rxId,
        ipAddress: req.ip,
        status: 'success',
        details: { patient_id, medication_name, dosage },
      });

      res.status(201).json({ message: 'Prescription issued successfully', prescriptionId: rxId });
    } catch (err: any) {
      console.error('[RX] createPrescription error:', err);
      res.status(500).json({ error: 'Server Error', message: err.message });
    }
  }

  /**
   * Update Prescription Status (e.g. Discontinue) - Clinician only
   */
  public static async updateStatus(req: Request, res: Response): Promise<void> {
    const rxId = parseInt(req.params.id, 10);
    const { status, notes } = req.body;

    if (isNaN(rxId)) {
      res.status(400).json({ error: 'Bad Request', message: 'Invalid prescription ID' });
      return;
    }

    const allowedStatuses = ['active', 'completed', 'discontinued'];
    if (!allowedStatuses.includes(status)) {
      res.status(400).json({ error: 'Validation Error', message: `Status must be: ${allowedStatuses.join(', ')}` });
      return;
    }

    try {
      const rxRes = await db.query('SELECT * FROM prescriptions WHERE id = ?', [rxId]);
      if (rxRes.rows.length === 0) {
        res.status(404).json({ error: 'Not Found', message: 'Prescription not found' });
        return;
      }

      await db.execute(
        'UPDATE prescriptions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, rxId]
      );

      await AuditService.log({
        userId: req.user?.id,
        userRole: req.user?.role,
        action: `PRESCRIPTION_STATUS_${status.toUpperCase()}`,
        resourceType: 'prescription',
        resourceId: rxId,
        ipAddress: req.ip,
        status: 'success',
        details: { newStatus: status, notes },
      });

      res.json({ message: `Prescription marked as ${status}` });
    } catch (err: any) {
      res.status(500).json({ error: 'Server Error', message: err.message });
    }
  }

  /**
   * Get Formulary Catalog
   */
  public static async listMedications(req: Request, res: Response): Promise<void> {
    try {
      const result = await db.query('SELECT * FROM medications ORDER BY name ASC');
      res.json({ medications: result.rows });
    } catch (err: any) {
      res.status(500).json({ error: 'Server Error', message: err.message });
    }
  }
}

export default PrescriptionController;
