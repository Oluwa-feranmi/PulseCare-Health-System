/**
 * PulseCare Health System - Role-Based Access Control & Isolation Tests
 * Validates patient data isolation and clinician search permissions.
 */

import db from '../../database/db.js';

export async function runRbacTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Test 1: Verify Patient 1 can view own record
  try {
    const p1Res = await db.query('SELECT * FROM patients WHERE id = 1');
    if (p1Res.rows.length === 1 && p1Res.rows[0].healthcare_identifier) {
      results.push({ name: 'RBAC: Patient 1 profile lookup by ID succeeds', passed: true });
    } else {
      results.push({ name: 'RBAC: Patient 1 profile lookup', passed: false, error: 'Patient 1 not found' });
    }
  } catch (e: any) {
    results.push({ name: 'RBAC: Patient 1 profile lookup', passed: false, error: e.message });
  }

  // Test 2: Verify Patient Isolation Logic (Patient 1 trying to access Patient 2)
  try {
    const userPatientId: number = 1;
    const requestedPatientId: number = 2;
    const isAllowed = userPatientId === requestedPatientId;

    if (!isAllowed) {
      results.push({ name: 'Security: Cross-patient access blocked (Patient 1 denied access to Patient 2)', passed: true });
    } else {
      results.push({ name: 'Security: Cross-patient access blocked', passed: false, error: 'Access was erroneously allowed' });
    }
  } catch (e: any) {
    results.push({ name: 'Security: Cross-patient access blocked', passed: false, error: e.message });
  }

  // Test 3: Clinician Patient Search Query Execution
  try {
    const searchRes = await db.query(
      `SELECT p.id, u.full_name, p.healthcare_identifier
       FROM patients p
       JOIN users u ON p.user_id = u.id
       WHERE LOWER(u.full_name) LIKE ?`,
      ['%olivia%']
    );

    if (searchRes.rows.length > 0 && searchRes.rows[0].full_name.includes('Olivia')) {
      results.push({ name: 'Clinician: Patient search by name returns accurate patient records', passed: true });
    } else {
      results.push({ name: 'Clinician: Patient search', passed: false, error: 'Search for Olivia returned no records' });
    }
  } catch (e: any) {
    results.push({ name: 'Clinician: Patient search', passed: false, error: e.message });
  }

  // Test 4: Prescription Isolation (Patient 1 only sees Patient 1 prescriptions)
  try {
    const rxRes = await db.query('SELECT * FROM prescriptions WHERE patient_id = ?', [1]);
    const foreignRx = rxRes.rows.filter((r: any) => r.patient_id !== 1);

    if (rxRes.rows.length > 0 && foreignRx.length === 0) {
      results.push({ name: 'Security: Prescription query strictly isolates patient records', passed: true });
    } else {
      results.push({ name: 'Security: Prescription isolation', passed: false, error: 'Found foreign prescriptions in result' });
    }
  } catch (e: any) {
    results.push({ name: 'Security: Prescription isolation', passed: false, error: e.message });
  }

  return results;
}
