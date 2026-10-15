/**
 * PulseCare Health System - Authentication Controller
 * Handles user registration, secure credential verification, JWT token issuance,
 * and current session introspection.
 */

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import db from '../../database/db.js';
import AuditService from '../services/audit.service.js';
import metricsService from '../services/metrics.service.js';

export class AuthController {
  public static async register(req: Request, res: Response): Promise<void> {
    const { email, password, full_name, phone, date_of_birth, gender, address, emergency_contact_name, emergency_contact_phone } = req.body;

    // Strict validation
    if (!email || !password || !full_name) {
      res.status(400).json({ error: 'Validation Error', message: 'Email, password, and full name are required.' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Validation Error', message: 'Password must be at least 8 characters long.' });
      return;
    }

    // Check existing email
    const existing = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'Conflict', message: 'An account with this email address already exists.' });
      return;
    }

    try {
      const passwordHash = await bcrypt.hash(password, 10);
      const userRes = await db.execute(
        'INSERT INTO users (email, password_hash, role, full_name, phone) VALUES (?, ?, ?, ?, ?)',
        [email.toLowerCase().trim(), passwordHash, 'patient', full_name.trim(), phone || null]
      );
      const userId = userRes.lastInsertId!;

      // Generate a fictional UK-style 10-digit healthcare ID (e.g. 491 820 4421)
      const randomPart1 = Math.floor(100 + Math.random() * 900);
      const randomPart2 = Math.floor(100 + Math.random() * 900);
      const randomPart3 = Math.floor(1000 + Math.random() * 9000);
      const healthcareIdentifier = `${randomPart1} ${randomPart2} ${randomPart3}`;

      const patientRes = await db.execute(
        `INSERT INTO patients (user_id, healthcare_identifier, date_of_birth, gender, blood_type, address, 
          emergency_contact_name, emergency_contact_phone, allergies, medical_conditions, gp_surgery_name)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          healthcareIdentifier,
          date_of_birth || '1990-01-01',
          gender || 'Not Specified',
          'Unknown',
          address || '10 Kensington Gardens, London W8 4PX',
          emergency_contact_name || 'Emergency Contact',
          emergency_contact_phone || '+44 7700 900000',
          'None reported',
          'None recorded',
          'St. Mary Clinical Practice',
        ]
      );
      const patientId = patientRes.lastInsertId!;

      // Issue JWT
      const token = jwt.sign(
        { id: userId, email: email.toLowerCase().trim(), role: 'patient' },
        config.jwt.secret,
        { expiresIn: '8h' }
      );

      await AuditService.log({
        userId,
        userRole: 'patient',
        action: 'PATIENT_REGISTER',
        resourceType: 'user',
        resourceId: userId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'success',
        details: { email: email.toLowerCase().trim(), healthcareIdentifier },
      });

      metricsService.recordAuthSuccess();

      res.status(201).json({
        message: 'Patient registration successful',
        token,
        user: {
          id: userId,
          email: email.toLowerCase().trim(),
          role: 'patient',
          full_name: full_name.trim(),
          patient_id: patientId,
          healthcare_identifier: healthcareIdentifier,
        },
      });
    } catch (err: any) {
      console.error('[AUTH] Registration failure:', err);
      res.status(500).json({ error: 'Registration Failed', message: err.message });
    }
  }

  public static async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Validation Error', message: 'Email and password are required.' });
      return;
    }

    try {
      const userRes = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
      if (userRes.rows.length === 0) {
        metricsService.recordAuthFailure();
        await AuditService.log({
          action: 'AUTH_LOGIN_FAILED',
          resourceType: 'auth',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          status: 'failure',
          details: { email: email.toLowerCase().trim(), reason: 'User not found' },
        });

        res.status(401).json({ error: 'Unauthorized', message: 'Invalid email address or password.' });
        return;
      }

      const user = userRes.rows[0];
      const isMatch = await bcrypt.compare(password, user.password_hash);

      if (!isMatch) {
        metricsService.recordAuthFailure();
        await AuditService.log({
          userId: user.id,
          userRole: user.role,
          action: 'AUTH_LOGIN_FAILED',
          resourceType: 'auth',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          status: 'failure',
          details: { email: email.toLowerCase().trim(), reason: 'Password mismatch' },
        });

        res.status(401).json({ error: 'Unauthorized', message: 'Invalid email address or password.' });
        return;
      }

      // Fetch role context
      let patientId: number | undefined;
      let healthcareIdentifier: string | undefined;
      let clinicianId: number | undefined;
      let staffIdentifier: string | undefined;

      if (user.role === 'patient') {
        const pRes = await db.query('SELECT id, healthcare_identifier FROM patients WHERE user_id = ?', [user.id]);
        if (pRes.rows.length > 0) {
          patientId = pRes.rows[0].id;
          healthcareIdentifier = pRes.rows[0].healthcare_identifier;
        }
      } else if (user.role === 'clinician') {
        const cRes = await db.query('SELECT id, staff_identifier FROM clinicians WHERE user_id = ?', [user.id]);
        if (cRes.rows.length > 0) {
          clinicianId = cRes.rows[0].id;
          staffIdentifier = cRes.rows[0].staff_identifier;
        }
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwt.secret,
        { expiresIn: '8h' }
      );

      await AuditService.log({
        userId: user.id,
        userRole: user.role,
        action: 'AUTH_LOGIN_SUCCESS',
        resourceType: 'auth',
        resourceId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'success',
      });

      metricsService.recordAuthSuccess();

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          full_name: user.full_name,
          phone: user.phone,
          patient_id: patientId,
          healthcare_identifier: healthcareIdentifier,
          clinician_id: clinicianId,
          staff_identifier: staffIdentifier,
        },
      });
    } catch (err: any) {
      console.error('[AUTH] Login error:', err);
      res.status(500).json({ error: 'Server Error', message: err.message });
    }
  }

  public static async me(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const userRes = await db.query('SELECT id, email, role, full_name, phone, created_at FROM users WHERE id = ?', [req.user.id]);
      if (userRes.rows.length === 0) {
        res.status(404).json({ error: 'Not Found', message: 'User not found' });
        return;
      }

      const user = userRes.rows[0];
      let patientData = null;
      let clinicianData = null;

      if (user.role === 'patient') {
        const pRes = await db.query('SELECT * FROM patients WHERE user_id = ?', [user.id]);
        if (pRes.rows.length > 0) patientData = pRes.rows[0];
      } else if (user.role === 'clinician') {
        const cRes = await db.query('SELECT * FROM clinicians WHERE user_id = ?', [user.id]);
        if (cRes.rows.length > 0) clinicianData = cRes.rows[0];
      }

      res.json({
        user: {
          ...user,
          patient: patientData,
          clinician: clinicianData,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Server Error', message: err.message });
    }
  }

  public static async getDemoAccounts(req: Request, res: Response): Promise<void> {
    // Provide demo user credentials to facilitate quick portfolio evaluation
    res.json({
      demoAccounts: [
        {
          role: 'clinician',
          name: 'Dr. Eleanor Harrison (Lead GP)',
          email: 'dr.harrison@pulsecare.nhs.uk',
          password: 'Password123!',
          description: 'Consultant GP with full clinician portal access: search patients, write SOAP notes, issue prescriptions.',
        },
        {
          role: 'clinician',
          name: 'Dr. Tariq Patel (Cardiologist)',
          email: 'dr.patel@pulsecare.nhs.uk',
          password: 'Password123!',
          description: 'Cardiovascular specialist for clinical reviews and appointment scheduling.',
        },
        {
          role: 'patient',
          name: 'Olivia Reed (Patient)',
          email: 'olivia.reed@example.com',
          password: 'Password123!',
          description: 'Patient with asthma history, active prescriptions, upcoming appointments, and secure clinic messages.',
        },
        {
          role: 'patient',
          name: 'Marcus Chen (Patient)',
          email: 'marcus.chen@example.com',
          password: 'Password123!',
          description: 'Patient managing Type 2 Diabetes, ongoing prescriptions, and past clinical consultations.',
        },
      ],
    });
  }
}

export default AuthController;
