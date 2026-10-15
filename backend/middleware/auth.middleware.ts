/**
 * PulseCare Health System - Authentication Middleware
 * Validates JWT Bearer tokens and hydrates user identity + clinical context.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import db from '../../database/db.js';
import { AuditService } from '../services/audit.service.js';

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: 'patient' | 'clinician' | 'admin';
  full_name: string;
  patient_id?: number;
  clinician_id?: number;
  healthcare_identifier?: string;
  staff_identifier?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      requestId?: string;
    }
  }
}

export async function authenticateJWT(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid authentication credentials. Please provide a valid Bearer token.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    let decoded: { id: number; email: string; role: string } | null = null;
    let verifyError: any = null;

    // Verify against active secret or candidate secrets for zero-downtime secret rollover
    for (const secret of config.jwt.candidateSecrets) {
      try {
        decoded = jwt.verify(token, secret) as { id: number; email: string; role: string };
        break;
      } catch (err: any) {
        verifyError = err;
      }
    }

    if (!decoded) {
      throw verifyError || new Error('Invalid token');
    }

    // Fetch up-to-date user details and linked clinical profile
    const userResult = await db.query('SELECT id, email, role, full_name FROM users WHERE id = ?', [decoded.id]);
    if (userResult.rows.length === 0) {
      res.status(401).json({ error: 'Unauthorized', message: 'User account no longer exists.' });
      return;
    }

    const user = userResult.rows[0];
    const authUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    };

    if (user.role === 'patient') {
      const patientRes = await db.query('SELECT id, healthcare_identifier FROM patients WHERE user_id = ?', [user.id]);
      if (patientRes.rows.length > 0) {
        authUser.patient_id = patientRes.rows[0].id;
        authUser.healthcare_identifier = patientRes.rows[0].healthcare_identifier;
      }
    } else if (user.role === 'clinician') {
      const clinicianRes = await db.query('SELECT id, staff_identifier FROM clinicians WHERE user_id = ?', [user.id]);
      if (clinicianRes.rows.length > 0) {
        authUser.clinician_id = clinicianRes.rows[0].id;
        authUser.staff_identifier = clinicianRes.rows[0].staff_identifier;
      }
    }

    req.user = authUser;
    next();
  } catch (err: any) {
    AuditService.log({
      action: 'AUTH_TOKEN_INVALID',
      resourceType: 'auth',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'failure',
      details: { reason: err.message },
    });

    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication token is expired or signature is invalid.',
    });
  }
}
