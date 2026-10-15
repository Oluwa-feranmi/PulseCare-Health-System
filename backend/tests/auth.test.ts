/**
 * PulseCare Health System - Authentication & Security Tests
 * Validates registration, password hashing, login, and JWT validation.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../../database/db.js';
import config from '../config/index.js';

export async function runAuthTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Test 1: Password Hashing Quality
  try {
    const rawPass = 'SecureHealthcarePass123!';
    const hash = await bcrypt.hash(rawPass, 10);
    const match = await bcrypt.compare(rawPass, hash);
    const wrongMatch = await bcrypt.compare('WrongPassword', hash);

    if (match && !wrongMatch && hash.startsWith('$2')) {
      results.push({ name: 'Security: bcrypt password hashing and verification', passed: true });
    } else {
      results.push({ name: 'Security: bcrypt password hashing', passed: false, error: 'Password hash verification failed' });
    }
  } catch (e: any) {
    results.push({ name: 'Security: bcrypt password hashing', passed: false, error: e.message });
  }

  // Test 2: Seed Users Exist with Roles
  try {
    const res = await db.query('SELECT role, count(*) as c FROM users GROUP BY role');
    const roles = res.rows.map((r: any) => r.role);
    if (roles.includes('clinician') && roles.includes('patient')) {
      results.push({ name: 'Database: Seeded user accounts for clinician and patient exist', passed: true });
    } else {
      results.push({ name: 'Database: Seeded user accounts', passed: false, error: `Missing roles: ${JSON.stringify(roles)}` });
    }
  } catch (e: any) {
    results.push({ name: 'Database: Seeded user accounts', passed: false, error: e.message });
  }

  // Test 3: JWT Sign and Verify
  try {
    const payload = { id: 999, email: 'test@example.com', role: 'patient' };
    const token = jwt.sign(payload, config.jwt.secret, { expiresIn: '1h' });
    const decoded = jwt.verify(token, config.jwt.secret) as any;

    if (decoded.id === 999 && decoded.role === 'patient') {
      results.push({ name: 'Auth: JWT token generation and signature verification', passed: true });
    } else {
      results.push({ name: 'Auth: JWT token verification', passed: false, error: 'Decoded payload mismatch' });
    }
  } catch (e: any) {
    results.push({ name: 'Auth: JWT token verification', passed: false, error: e.message });
  }

  // Test 4: Rejection of Tampered JWT
  try {
    const token = jwt.sign({ id: 1, role: 'patient' }, config.jwt.secret);
    const tampered = token.slice(0, -5) + 'abcde';
    let failed = false;
    try {
      jwt.verify(tampered, config.jwt.secret);
    } catch {
      failed = true;
    }

    if (failed) {
      results.push({ name: 'Security: Tampered JWT token rejected with signature error', passed: true });
    } else {
      results.push({ name: 'Security: Tampered JWT rejected', passed: false, error: 'Tampered token was accepted' });
    }
  } catch (e: any) {
    results.push({ name: 'Security: Tampered JWT rejected', passed: false, error: e.message });
  }

  // Test 5: Candidate Secrets Rollover Support
  try {
    const legacySecret = 'pulsecare-development-secret-key-32-chars-long!!';
    const legacyToken = jwt.sign({ id: 1, role: 'clinician' }, legacySecret, { expiresIn: '1h' });
    let verifiedLegacy = false;
    for (const secret of config.jwt.candidateSecrets) {
      try {
        const dec = jwt.verify(legacyToken, secret) as any;
        if (dec.id === 1) {
          verifiedLegacy = true;
          break;
        }
      } catch {}
    }

    if (verifiedLegacy) {
      results.push({ name: 'Security: Candidate secrets rollover verification succeeds', passed: true });
    } else {
      results.push({ name: 'Security: Candidate secrets rollover', passed: false, error: 'Failed to verify token across candidate secrets' });
    }
  } catch (e: any) {
    results.push({ name: 'Security: Candidate secrets rollover', passed: false, error: e.message });
  }

  return results;
}
