import { Router } from 'express';
import AuthController from '../controllers/auth.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/me', authenticateJWT, AuthController.me);
router.get('/demo-accounts', AuthController.getDemoAccounts);

export default router;
