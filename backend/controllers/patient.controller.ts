/**
 * PulseCare Health System - Patient Management Controller
 * Handles patient demographics, clinical search, and medical summaries.
 * Strictly enforces patient data isolation.
 */

import { Request, Response } from 'express';
import db from '../../database/db.js';
import AuditService from '../services/audit.service.js';

export class PatientController {
  /**
   * Search / List Patients (Clinician / Staff only)
   */
  public static async listPatients(req: Request, res: Response): Promise<void> {
    const search = ((req.query.search as string) || '').trim().toLowerCase();

    try {
      let sql = `
        SELECT p.id, p.user_id, p.healthcare_identifier, p.date_of_birth, p.gender, p.blood_type,
               p.address, p.emergency_contact_name, p.emergency_contact_phone, p.allergies,
               p.medical_conditions, p.gp_surgery_name, u.full_name, u.email, u.phone
        FROM patients p
        JOIN users u ON p.user_id = u.id
      `;
      const params: any[] = [];

      if (search) {
        sql += ` WHERE LOWER(u.full_name) LIKE ? OR p.healthcare_identifier LIKE ? OR p.date_of_birth LIKE ?`;
        const wildSearch = `%${search}%`;
        params.push(wildSearch, wildSearch, wildSearch);
      }

      sql += ` ORDER BY u.full_name ASC LIMIT 50`;

      const result = await db.query(sql, params);

      await AuditService.log({
        userId: req.user?.id,
        userRole: req.user?.role,
        action: 'PATIENT_SEARCH_PERFORMED',
        resourceType: 'patients_list',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'success',
        details: { search_term: search, results_count: result.rows.length },
      });

      res.json({ patients: result.rows });
    } catch (err: any) {
      console.error('[PATIENT] listPatients error:', err);
      res.status(500).json({ error: 'Server Error', message: err.message });
    }
  }

  /**
   * Get Individual Patient Details
   * Accessible by Clinicians OR by the specific Patient themself
   */
  public static async getPatientById(req: Request, res: Response): Promise<void> {
    const patientId = parseInt(req.params.id, 10);
    if (isNaN(patientId)) {
      res.status(400).json({ error: 'Bad Request', message: 'Invalid patient ID' });
      return;
    }

    // Patient isolation check: patients can only access their own profile
    if (req.user?.role === 'patient' && req.user.patient_id !== patientId) {
      await AuditService.log({
        userId: req.user.id,
        userRole: req.user.role,
        action: 'PATIENT_ISOLATION_VIOLATION_BLOCKED',
        resourceType: 'patient_profile',
        resourceId: patientId,
        ipAddress: req.ip,
        status: 'denied',
      });
      res.status(403).json({ error: 'Forbidden', message: 'You are not permitted to view other patients’ records.' });
      return;
    }

    try {
      const sql = `
        SELECT p.*, u.full_name, u.email, u.phone
        FROM patients p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = ?
      `;
      const result = await db.query(sql, [patientId]);

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Not Found', message: 'Patient not found' });
        return;
      }

      const patient = result.rows[0];

      // Audit chart access
      await AuditService.log({
        userId: req.user?.id,
        userRole: req.user?.role,
        action: 'PATIENT_CHART_ACCESSED',
        resourceType: 'patient_chart',
        resourceId: patientId,
        ipAddress: req.ip,
        status: 'success',
      });

      res.json({ patient });
    } catch (err: any) {
      res.status(500).json({ error: 'Server Error', message: err.message });
    }
  }

  /**
   * Get Logged-in Patient Medical Summary
   */
  public static async getMySummary(req: Request, res: Response): Promise<void> {
    if (!req.user || req.user.role !== 'patient' || !req.user.patient_id) {
      res.status(403).json({ error: 'Forbidden', message: 'Only registered patients can access this summary.' });
      return;
    }

    const patientId = req.user.patient_id;

    try {
      const patientRes = await db.query(
        `SELECT p.*, u.full_name, u.email, u.phone FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = ?`,
        [patientId]
      );

      if (patientRes.rows.length === 0) {
        res.status(404).json({ error: 'Not Found', message: 'Patient profile not found' });
        return;
      }

      // Upcoming appointments count
      const upcomingRes = await db.query(
        `SELECT COUNT(*) as count FROM appointments WHERE patient_id = ? AND status IN ('scheduled', 'confirmed')`,
        [patientId]
      );

      // Active prescriptions count
      const rxRes = await db.query(
        `SELECT COUNT(*) as count FROM prescriptions WHERE patient_id = ? AND status = 'active'`,
        [patientId]
      );

      // Unread messages count
      const msgRes = await db.query(
        `SELECT COUNT(*) as count FROM messages WHERE patient_id = ? AND is_read = ?`,
        [patientId, false]
      );

      res.json({
        profile: patientRes.rows[0],
        counts: {
          upcomingAppointments: Number(upcomingRes.rows[0]?.count || 0),
          activePrescriptions: Number(rxRes.rows[0]?.count || 0),
          unreadMessages: Number(msgRes.rows[0]?.count || 0),
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Server Error', message: err.message });
    }
  }

  /**
   * Update Patient Contact & Emergency Info
   */
  public static async updatePatient(req: Request, res: Response): Promise<void> {
    const patientId = parseInt(req.params.id, 10);
    if (isNaN(patientId)) {
      res.status(400).json({ error: 'Bad Request', message: 'Invalid patient ID' });
      return;
    }

    // Role check
    if (req.user?.role === 'patient' && req.user.patient_id !== patientId) {
      res.status(403).json({ error: 'Forbidden', message: 'Cannot modify another patient record' });
      return;
    }

    const { phone, address, emergency_contact_name, emergency_contact_phone, allergies, medical_conditions } = req.body;

    try {
      // Find patient
      const pRes = await db.query('SELECT user_id FROM patients WHERE id = ?', [patientId]);
      if (pRes.rows.length === 0) {
        res.status(404).json({ error: 'Not Found', message: 'Patient record not found' });
        return;
      }

      const userId = pRes.rows[0].user_id;

      if (phone) {
        await db.execute('UPDATE users SET phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [phone, userId]);
      }

      await db.execute(
        `UPDATE patients 
         SET address = COALESCE(?, address),
             emergency_contact_name = COALESCE(?, emergency_contact_name),
             emergency_contact_phone = COALESCE(?, emergency_contact_phone),
             allergies = COALESCE(?, allergies),
             medical_conditions = COALESCE(?, medical_conditions),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [address || null, emergency_contact_name || null, emergency_contact_phone || null, allergies || null, medical_conditions || null, patientId]
      );

      await AuditService.log({
        userId: req.user?.id,
        userRole: req.user?.role,
        action: 'PATIENT_PROFILE_UPDATED',
        resourceType: 'patient',
        resourceId: patientId,
        ipAddress: req.ip,
        status: 'success',
      });

      res.json({ message: 'Patient profile updated successfully' });
    } catch (err: any) {
      res.status(500).json({ error: 'Server Error', message: err.message });
    }
  }
}

export default PatientController;
