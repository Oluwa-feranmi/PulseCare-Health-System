import { Router } from 'express';
import AppointmentController from '../controllers/appointment.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

const router = Router();

// List appointments (role filtered)
router.get('/', authenticateJWT, AppointmentController.listAppointments);

// List available clinicians
router.get('/clinicians', authenticateJWT, AppointmentController.listClinicians);

// Create / book appointment
router.post('/', authenticateJWT, AppointmentController.createAppointment);

// Update status (e.g. cancel, confirm, complete)
router.put('/:id/status', authenticateJWT, AppointmentController.updateStatus);

export default router;
