import { Router } from 'express';
import HealthController from '../controllers/health.controller.js';

const router = Router();

// Liveness probe (shallow)
router.get('/health', HealthController.liveness);

// Readiness probe (deep - database verification)
router.get('/health/ready', HealthController.readiness);

// Application metrics (CloudWatch EMF summary)
router.get('/api/metrics', HealthController.metrics);

export default router;
