/**
 * PulseCare Health System - Appointment Management Controller
 * Handles consultation scheduling, status progression, and clinician availability.
 */

import { Request, Response } from 'express';
import db from '../../database/db.js';
import AuditService from '../services/audit.service.js';
import metricsService from '../services/metrics.service.js';

export class AppointmentController {
  /**
   * List appointments with contextual role filtering
   */
  public static async listAppointments(req: Request, res: Response): Promise<void> {
    const { status, patientId, timeframe } = req.query;

    try {
      let sql = `
        SELECT a.*, 
               p.healthcare_identifier, p.date_of_birth,
               u_p.full_name as patient_name, u_p.phone as patient_phone,
               c.staff_identifier, c.specialty, c.department, c.title as clinician_title,
               u_c.full_name as clinician_name
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN users u_p ON p.user_id = u_p.id
        JOIN clinicians c ON a.clinician_id = c.id
        JOIN users u_c ON c.user_id = u_c.id
      `;
      const params: any[] = [];
      const conditions: string[] = [];

      // Patient access restriction: patients only see their own appointments
      if (req.user?.role === 'patient') {
        conditions.push(`a.patient_id = ?`);
        params.push(req.user.patient_id);
      } else if (patientId) {
        conditions.push(`a.patient_id = ?`);
        params.push(parseInt(patientId as string, 10));
      }

      if (status) {
        conditions.push(`a.status = ?`);
        params.push(status);
      }

      if (conditions.length > 0) {
        sql += ` WHERE ` + conditions.join(' AND ');
      }

      // Order by appointment date
      sql += ` ORDER BY a.appointment_date DESC`;

      const result = await db.query(sql, params);

      // Post-filter for timeframe if requested
      let appointments = result.rows;
      const nowIso = new Date().toISOString();

      if (timeframe === 'upcoming') {
        appointments = appointments.filter((a) => a.appointment_date >= nowIso && a.status !== 'cancelled');
        appointments.sort((a, b) => a.appointment_date.localeCompare(b.appointment_date));
      } else if (timeframe === 'past') {
        appointments = appointments.filter((a) => a.appointment_date < nowIso || a.status === 'completed' || a.status === 'cancelled');
      }

      res.json({ appointments });
    } catch (err: any) {
      console.error('[APPT] listAppointments error:', err);
      res.status(500).json({ error: 'Server Error', message: err.message });
    }
  }

  /**
   * Book / Create an Appointment
   */
  public static async createAppointment(req: Request, res: Response): Promise<void> {
    const { clinician_id, appointment_date, reason, appointment_type, clinic_location, notes } = req.body;
    let targetPatientId = req.body.patient_id;

    // If booking as a patient, patient_id is forced to current user's patient_id
    if (req.user?.role === 'patient') {
      targetPatientId = req.user.patient_id;
    }

    if (!targetPatientId || !clinician_id || !appointment_date || !reason) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Patient ID, clinician ID, appointment date, and reason are required.',
      });
      return;
    }

    try {
      // Validate patient existence
      const pCheck = await db.query('SELECT id FROM patients WHERE id = ?', [targetPatientId]);
      if (pCheck.rows.length === 0) {
        res.status(404).json({ error: 'Not Found', message: 'Patient not found' });
        return;
      }

      // Validate clinician existence
      const cCheck = await db.query('SELECT c.id, c.room_location, u.full_name FROM clinicians c JOIN users u ON c.user_id = u.id WHERE c.id = ?', [clinician_id]);
      if (cCheck.rows.length === 0) {
        res.status(404).json({ error: 'Not Found', message: 'Clinician not found' });
        return;
      }

      const location = clinic_location || cCheck.rows[0].room_location || 'PulseCare Health Suite';

      const insertRes = await db.execute(
        `INSERT INTO appointments (patient_id, clinician_id, appointment_date, duration_minutes, reason, appointment_type, status, clinic_location, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          targetPatientId,
          clinician_id,
          appointment_date,
          30,
          reason.trim(),
          appointment_type || 'in_person',
          'confirmed',
          location,
          notes || null,
        ]
      );

      const apptId = insertRes.lastInsertId!;
      metricsService.recordAppointmentBooked();

      // Automatically create a confirmation notification message for the patient
      await db.execute(
        `INSERT INTO messages (patient_id, clinician_id, sender_type, subject, content, is_read, category)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          targetPatientId,
          clinician_id,
          'system',
          'Appointment Booking Confirmed',
          `Your appointment with ${cCheck.rows[0].full_name} for "${reason.trim()}" on ${new Date(appointment_date).toLocaleString()} has been confirmed at ${location}.`,
          false,
          'appointment_reminder',
        ]
      );

      await AuditService.log({
        userId: req.user?.id,
        userRole: req.user?.role,
        action: 'APPOINTMENT_CREATED',
        resourceType: 'appointment',
        resourceId: apptId,
        ipAddress: req.ip,
        status: 'success',
        details: { patient_id: targetPatientId, clinician_id, appointment_date },
      });

      res.status(201).json({
        message: 'Appointment booked successfully',
        appointmentId: apptId,
      });
    } catch (err: any) {
      console.error('[APPT] createAppointment error:', err);
      res.status(500).json({ error: 'Server Error', message: err.message });
    }
  }

  /**
   * Update Appointment Status (Cancel, Confirm, Complete)
   */
  public static async updateStatus(req: Request, res: Response): Promise<void> {
    const apptId = parseInt(req.params.id, 10);
    const { status, notes } = req.body;

    if (isNaN(apptId)) {
      res.status(400).json({ error: 'Bad Request', message: 'Invalid appointment ID' });
      return;
    }

    const validStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Validation Error', message: `Status must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    try {
      const apptRes = await db.query('SELECT * FROM appointments WHERE id = ?', [apptId]);
      if (apptRes.rows.length === 0) {
        res.status(404).json({ error: 'Not Found', message: 'Appointment not found' });
        return;
      }

      const appt = apptRes.rows[0];

      // If user is a patient, they can only cancel their own appointment
      if (req.user?.role === 'patient') {
        if (appt.patient_id !== req.user.patient_id) {
          res.status(403).json({ error: 'Forbidden', message: 'You cannot alter another patient’s appointment.' });
          return;
        }
        if (status !== 'cancelled') {
          res.status(403).json({ error: 'Forbidden', message: 'Patients are only permitted to cancel appointments.' });
          return;
        }
      }

      await db.execute(
        `UPDATE appointments 
         SET status = ?, notes = COALESCE(?, notes), updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [status, notes || null, apptId]
      );

      if (status === 'cancelled') {
        metricsService.recordAppointmentCancelled();
      }

      await AuditService.log({
        userId: req.user?.id,
        userRole: req.user?.role,
        action: `APPOINTMENT_STATUS_${status.toUpperCase()}`,
        resourceType: 'appointment',
        resourceId: apptId,
        ipAddress: req.ip,
        status: 'success',
        details: { previousStatus: appt.status, newStatus: status },
      });

      res.json({ message: `Appointment status updated to ${status}` });
    } catch (err: any) {
      res.status(500).json({ error: 'Server Error', message: err.message });
    }
  }

  /**
   * List Available Clinicians for Appointment Booking
   */
  public static async listClinicians(req: Request, res: Response): Promise<void> {
    try {
      const result = await db.query(`
        SELECT c.id, c.staff_identifier, c.specialty, c.department, c.title, c.room_location,
               u.full_name, u.email, u.phone
        FROM clinicians c
        JOIN users u ON c.user_id = u.id
        ORDER BY u.full_name ASC
      `);

      res.json({ clinicians: result.rows });
    } catch (err: any) {
      res.status(500).json({ error: 'Server Error', message: err.message });
    }
  }
}

export default AppointmentController;
