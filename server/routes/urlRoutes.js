import express from 'express';
import { listUrls, createUrl, deleteUrl, updateUrl } from '../controllers/urlController.js';
import { getUrlAnalytics, exportAnalytics } from '../controllers/analyticsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to all URL routes
router.use(authenticateToken);

router.get('/', listUrls);
router.post('/', createUrl);
router.patch('/:id', updateUrl);
router.delete('/:id', deleteUrl);
router.get('/:id/analytics', getUrlAnalytics);
router.get('/:id/analytics/export', exportAnalytics);

export default router;
