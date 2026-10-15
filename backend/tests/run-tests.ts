/**
 * PulseCare Health System - Master Test Suite Runner
 * Usage: npm test  (or npx tsx backend/tests/run-tests.ts)
 */

import db from '../../database/db.js';
import { runSeeds } from '../../database/seed.js';
import { runAuthTests } from './auth.test.js';
import { runRbacTests } from './rbac.test.js';
import { runAppointmentTests } from './appointment.test.js';

async function main() {
  console.log('================================================================');
  console.log(' PulseCare Health System - Automated Test Suite');
  console.log('================================================================');
  console.log('[TEST] Bootstrapping test database environment...');

  await db.initialize();
  await runSeeds();

  const startTime = Date.now();
  const allResults: { suite: string; name: string; passed: boolean; error?: string }[] = [];

  // 1. Run Auth Tests
  console.log('\n[TEST SUITE] Authentication & Security:');
  const authResults = await runAuthTests();
  authResults.forEach((r) => {
    allResults.push({ suite: 'Auth', ...r });
    console.log(`  ${r.passed ? '✓ PASS' : '✗ FAIL'}: ${r.name}`);
    if (r.error) console.log(`         Error: ${r.error}`);
  });

  // 2. Run RBAC Tests
  console.log('\n[TEST SUITE] Role-Based Access Control & Patient Isolation:');
  const rbacResults = await runRbacTests();
  rbacResults.forEach((r) => {
    allResults.push({ suite: 'RBAC', ...r });
    console.log(`  ${r.passed ? '✓ PASS' : '✗ FAIL'}: ${r.name}`);
    if (r.error) console.log(`         Error: ${r.error}`);
  });

  // 3. Run Appointment Tests
  console.log('\n[TEST SUITE] Appointments, Clinical Logic & Health Probes:');
  const apptResults = await runAppointmentTests();
  apptResults.forEach((r) => {
    allResults.push({ suite: 'Appointments', ...r });
    console.log(`  ${r.passed ? '✓ PASS' : '✗ FAIL'}: ${r.name}`);
    if (r.error) console.log(`         Error: ${r.error}`);
  });

  const duration = Date.now() - startTime;
  const passedCount = allResults.filter((r) => r.passed).length;
  const failedCount = allResults.filter((r) => !r.passed).length;

  console.log('\n================================================================');
  console.log(` Test Run Completed in ${duration}ms`);
  console.log(` Passed: ${passedCount} | Failed: ${failedCount} | Total: ${allResults.length}`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('[TEST] Fatal test runner error:', err);
  process.exit(1);
});
