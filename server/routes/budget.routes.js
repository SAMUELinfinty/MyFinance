import { Router } from 'express';
import {
  upsertBudget,
  getBudgetForMonth,
  getBudgetHistory,
} from '../controllers/budget.controller.js';
import {
  createOrUpdateBudgetValidation,
  getBudgetQueryValidation,
} from '../validations/budget.validation.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

// Secure all budget routes
router.use(verifyJWT);

// Routes
router.post('/', createOrUpdateBudgetValidation, upsertBudget);
router.get('/current', getBudgetQueryValidation, getBudgetForMonth);
router.get('/history', getBudgetHistory);

export default router;
