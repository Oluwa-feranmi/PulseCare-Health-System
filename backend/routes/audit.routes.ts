import { Router } from 'express';
import AuditController from '../controllers/audit.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = Router();

router.get('/', authenticateJWT, requireRole('clinician', 'admin'), AuditController.listAuditLogs);

export default router;
