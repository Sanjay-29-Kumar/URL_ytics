import express from 'express';
import { register, login, getMe, updateMe } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, getMe);
router.put('/me', authenticateToken, updateMe);

export default router;
