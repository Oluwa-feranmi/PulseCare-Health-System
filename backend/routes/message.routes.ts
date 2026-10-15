import { Router } from 'express';
import MessageController from '../controllers/message.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticateJWT, MessageController.listMessages);
router.post('/', authenticateJWT, MessageController.sendMessage);
router.put('/:id/read', authenticateJWT, MessageController.markAsRead);

export default router;
