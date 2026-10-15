import { Router } from 'express';
import PatientController from '../controllers/patient.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = Router();

// Clinician search
router.get('/', authenticateJWT, requireRole('clinician', 'admin'), PatientController.listPatients);

// Patient medical summary (for current logged-in patient)
router.get('/me/summary', authenticateJWT, requireRole('patient'), PatientController.getMySummary);

// View patient profile (clinician or matching patient)
router.get('/:id', authenticateJWT, PatientController.getPatientById);

// Update patient profile (clinician or matching patient)
router.put('/:id', authenticateJWT, PatientController.updatePatient);

export default router;
