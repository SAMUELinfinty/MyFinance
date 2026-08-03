import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboard.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

// Secure dashboard routes
router.use(verifyJWT);

router.get('/summary', getDashboardSummary);

export default router;
