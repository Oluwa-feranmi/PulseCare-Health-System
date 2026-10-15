import { Router } from 'express';
import ExportController from '../controllers/export.controller.js';

const router = Router();

// Stream full source code ZIP archive
router.get('/zip', ExportController.downloadZip);

export default router;
