import { Router } from 'express';
import PrescriptionController from '../controllers/prescription.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = Router();

router.get('/', authenticateJWT, PrescriptionController.listPrescriptions);
router.get('/medications', authenticateJWT, PrescriptionController.listMedications);
router.post('/', authenticateJWT, requireRole('clinician', 'admin'), PrescriptionController.createPrescription);
router.put('/:id/status', authenticateJWT, requireRole('clinician', 'admin'), PrescriptionController.updateStatus);

export default router;
