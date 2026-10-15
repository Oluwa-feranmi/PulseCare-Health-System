/**
 * PulseCare Health System - Role-Based Access Control (RBAC) Middleware
 * Enforces strict boundaries between Patient Portal and Clinician/Staff Portal.
 * Guarantees that patients can only access their own clinical charts and appointments.
 */

import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/audit.service.js';

export function requireRole(...allowedRoles: Array<'patient' | 'clinician' | 'admin'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      AuditService.log({
        userId: req.user.id,
        userRole: req.user.role,
        action: 'RBAC_ACCESS_DENIED',
        resourceType: req.baseUrl + req.path,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'denied',
        details: { requiredRoles: allowedRoles, currentRole: req.user.role },
      });

      res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. This action requires one of the following roles: [${allowedRoles.join(', ')}].`,
      });
      return;
    }

    next();
  };
}

/**
 * Ensures that if a user is a patient, they can only view or modify their own record.
 * Clinicians are permitted to access any registered patient record for clinical care.
 */
export function requireSelfOrClinician(getPatientIdFromReq: (req: Request) => number | undefined) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
      return;
    }

    // Clinicians and Admins have authorized clinical access
    if (req.user.role === 'clinician' || req.user.role === 'admin') {
      return next();
    }

    // Patients can only access their own patient ID
    const targetPatientId = getPatientIdFromReq(req);
    if (!targetPatientId || req.user.patient_id !== targetPatientId) {
      AuditService.log({
        userId: req.user.id,
        userRole: req.user.role,
        action: 'PATIENT_ISOLATION_VIOLATION_BLOCKED',
        resourceType: 'patient_record',
        resourceId: targetPatientId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'denied',
        details: { attemptedPatientId: targetPatientId, userPatientId: req.user.patient_id },
      });

      res.status(403).json({
        error: 'Forbidden',
        message: 'Security Violation: You are not authorized to view or access other patients’ medical records.',
      });
      return;
    }

    next();
  };
}
