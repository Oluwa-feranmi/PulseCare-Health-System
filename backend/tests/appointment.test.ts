/**
 * PulseCare Health System - Appointment & Clinical Logic Tests
 * Validates booking workflow, status progression, and health checks.
 */

import db from '../../database/db.js';

export async function runAppointmentTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Test 1: Book Appointment
  let createdApptId: number | undefined;
  try {
    const insertRes = await db.execute(
      `INSERT INTO appointments (patient_id, clinician_id, appointment_date, duration_minutes, reason, appointment_type, status, clinic_location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [1, 1, '2026-10-15T14:30:00', 30, 'Automated Integration Test Consultation', 'in_person', 'scheduled', 'Suite 1A']
    );

    createdApptId = insertRes.lastInsertId;
    if (createdApptId) {
      results.push({ name: 'Appointments: Successfully created and scheduled clinical appointment', passed: true });
    } else {
      results.push({ name: 'Appointments: Create appointment', passed: false, error: 'No insert ID returned' });
    }
  } catch (e: any) {
    results.push({ name: 'Appointments: Create appointment', passed: false, error: e.message });
  }

  // Test 2: Cancel Appointment
  try {
    if (createdApptId) {
      await db.execute('UPDATE appointments SET status = ? WHERE id = ?', ['cancelled', createdApptId]);
      const checkRes = await db.query('SELECT status FROM appointments WHERE id = ?', [createdApptId]);
      if (checkRes.rows[0]?.status === 'cancelled') {
        results.push({ name: 'Appointments: Successfully updated status to cancelled', passed: true });
      } else {
        results.push({ name: 'Appointments: Cancel appointment', passed: false, error: 'Status did not update' });
      }
    }
  } catch (e: any) {
    results.push({ name: 'Appointments: Cancel appointment', passed: false, error: e.message });
  }

  // Test 3: Health Readiness Probe
  try {
    const health = await db.checkHealth();
    if (health.status === 'healthy' && health.latencyMs >= 0) {
      results.push({ name: `Health Check: Database readiness probe responded (${health.type}, ${health.latencyMs}ms)`, passed: true });
    } else {
      results.push({ name: 'Health Check: Database readiness probe', passed: false, error: 'Database reported unhealthy' });
    }
  } catch (e: any) {
    results.push({ name: 'Health Check: Database readiness probe', passed: false, error: e.message });
  }

  // Test 4: Audit Log Persistence
  try {
    const auditRes = await db.query('SELECT count(*) as count FROM audit_logs');
    if (Number(auditRes.rows[0]?.count) > 0) {
      results.push({ name: 'Audit: Regulatory compliance audit logs persisted in relational table', passed: true });
    } else {
      results.push({ name: 'Audit: Regulatory compliance audit logs', passed: false, error: 'No audit logs found' });
    }
  } catch (e: any) {
    results.push({ name: 'Audit: Regulatory compliance audit logs', passed: false, error: e.message });
  }

  return results;
}
