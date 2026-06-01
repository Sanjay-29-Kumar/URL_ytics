import express from 'express';
import authRoutes from './authRoutes.js';
import urlRoutes from './urlRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/urls', urlRoutes);

export default router;
