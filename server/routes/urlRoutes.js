import express from 'express';
import { listUrls, createUrl, deleteUrl } from '../controllers/urlController.js';
import { getUrlAnalytics } from '../controllers/analyticsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to all URL routes
router.use(authenticateToken);

router.get('/', listUrls);
router.post('/', createUrl);
router.delete('/:id', deleteUrl);
router.get('/:id/analytics', getUrlAnalytics);

export default router;
