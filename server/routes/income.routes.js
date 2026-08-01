import { Router } from 'express';
import {
  createIncome,
  getIncomes,
  getIncomeById,
  updateIncome,
  deleteIncome,
  getIncomeReport,
  toggleRecurringStatus,
} from '../controllers/income.controller.js';
import {
  createIncomeValidation,
  updateIncomeValidation,
  incomeIdValidation,
  incomeQueryValidation,
} from '../validations/income.validation.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

// Protect all income routes with JWT verification
router.use(verifyJWT);

router.post('/', createIncomeValidation, createIncome);
router.get('/', incomeQueryValidation, getIncomes);
router.get('/report', getIncomeReport);
router.get('/:id', incomeIdValidation, getIncomeById);
router.put('/:id', updateIncomeValidation, updateIncome);
router.delete('/:id', incomeIdValidation, deleteIncome);
router.patch('/:id/toggle-recurring', incomeIdValidation, toggleRecurringStatus);

export default router;
