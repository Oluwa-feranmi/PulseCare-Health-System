/**
 * PulseCare Health System - Clinical Encounter Notes Controller
 * Handles electronic health record (EHR) SOAP clinical documentation:
 * Subjective, Objective, Assessment, and Plan.
 */

import { Request, Response } from 'express';
import db from '../../database/db.js';
import AuditService from '../services/audit.service.js';
import metricsService from '../services/metrics.service.js';

export class ClinicalNotesController {
  /**
   * List Clinical Notes for a Patient
   * Clinicians can view all notes (including confidential).
   * Patients can view only their non-confidential consultation summaries.
   */
  public static async listNotes(req: Request, res: Response): Promise<void> {
    const patientId = parseInt(req.params.patientId, 10);

    if (isNaN(patientId)) {
      res.status(400).json({ error: 'Bad Request', message: 'Invalid patient ID' });
      return;
    }

    // Role verification
    if (req.user?.role === 'patient' && req.user.patient_id !== patientId) {
      res.status(403).json({ error: 'Forbidden', message: 'You cannot view other patients’ clinical notes.' });
      return;
    }

    try {
      let sql = `
        SELECT cn.*,
               c.staff_identifier, c.specialty, c.title as clinician_title,
               u_c.full_name as clinician_name
        FROM clinical_notes cn
        JOIN clinicians c ON cn.clinician_id = c.id
        JOIN users u_c ON c.user_id = u_c.id
        WHERE cn.patient_id = ?
      `;
      const params: any[] = [patientId];

      if (req.user?.role === 'patient') {
        sql += ` AND cn.is_confidential = ?`;
        params.push(false);
      }

      sql += ` ORDER BY cn.created_at DESC`;

      const result = await db.query(sql, params);

      await AuditService.log({
        userId: req.user?.id,
        userRole: req.user?.role,
        action: 'CLINICAL_NOTES_ACCESSED',
        resourceType: 'clinical_notes',
        resourceId: patientId,
        ipAddress: req.ip,
        status: 'success',
        details: { patient_id: patientId, count: result.rows.length },
      });

      res.json({ notes: result.rows });
    } catch (err: any) {
      console.error('[NOTES] listNotes error:', err);
      res.status(500).json({ error: 'Server Error', message: err.message });
    }
  }

  /**
   * Create New Clinical Encounter SOAP Note (Clinician only)
   */
  public static async createNote(req: Request, res: Response): Promise<void> {
    const patientId = parseInt(req.params.patientId, 10);
    const { appointment_id, encounter_type, subjective, objective, assessment, plan, is_confidential } = req.body;

    if (isNaN(patientId)) {
      res.status(400).json({ error: 'Bad Request', message: 'Invalid patient ID' });
      return;
    }

    if (!subjective || !objective || !assessment || !plan) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'All SOAP fields (Subjective, Objective, Assessment, Plan) are required for clinical documentation.',
      });
      return;
    }

    const clinicianId = req.user?.clinician_id;
    if (!clinicianId) {
      res.status(403).json({ error: 'Forbidden', message: 'Only verified clinicians can document clinical notes.' });
      return;
    }

    try {
      const insertRes = await db.execute(
        `INSERT INTO clinical_notes 
          (patient_id, clinician_id, appointment_id, encounter_type, subjective, objective, assessment, plan, is_confidential)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          patientId,
          clinicianId,
          appointment_id || null,
          encounter_type || 'consultation',
          subjective.trim(),
          objective.trim(),
          assessment.trim(),
          plan.trim(),
          Boolean(is_confidential),
        ]
      );

      const noteId = insertRes.lastInsertId!;
      metricsService.recordClinicalNoteCreated();

      await AuditService.log({
        userId: req.user?.id,
        userRole: req.user?.role,
        action: 'CLINICAL_NOTE_CREATED',
        resourceType: 'clinical_note',
        resourceId: noteId,
        ipAddress: req.ip,
        status: 'success',
        details: { patient_id: patientId, encounter_type },
      });

      res.status(201).json({ message: 'Clinical SOAP note recorded successfully', noteId });
    } catch (err: any) {
      console.error('[NOTES] createNote error:', err);
      res.status(500).json({ error: 'Server Error', message: err.message });
    }
  }
}

export default ClinicalNotesController;
