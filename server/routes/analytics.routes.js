import { Router } from 'express';
import {
  getAnalyticsSummary,
  exportCSV,
  exportExcel,
  exportPDF,
} from '../controllers/analytics.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

// Protect all analytics routes
router.use(verifyJWT);

router.get('/summary', getAnalyticsSummary);
router.get('/export/csv', exportCSV);
router.get('/export/excel', exportExcel);
router.get('/export/pdf', exportPDF);

export default router;
