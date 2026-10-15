import { Router } from 'express';
import ClinicalNotesController from '../controllers/clinicalNotes.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = Router();

// View notes for patient
router.get('/patient/:patientId', authenticateJWT, ClinicalNotesController.listNotes);

// Create new SOAP note (clinician only)
router.post('/patient/:patientId', authenticateJWT, requireRole('clinician', 'admin'), ClinicalNotesController.createNote);

export default router;
