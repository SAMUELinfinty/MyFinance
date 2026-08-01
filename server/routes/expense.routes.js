import { Router } from 'express';
import {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  uploadReceipt,
  getExpenseReport,
  toggleRecurringStatus,
} from '../controllers/expense.controller.js';
import {
  createExpenseValidation,
  updateExpenseValidation,
  expenseIdValidation,
  expenseQueryValidation,
} from '../validations/expense.validation.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { uploadReceiptMiddleware } from '../middleware/receiptUpload.middleware.js';

const router = Router();

// Protect all expense routes
router.use(verifyJWT);

router.post('/', createExpenseValidation, createExpense);
router.get('/', expenseQueryValidation, getExpenses);
router.get('/report', getExpenseReport);
router.get('/:id', expenseIdValidation, getExpenseById);
router.put('/:id', updateExpenseValidation, updateExpense);
router.delete('/:id', expenseIdValidation, deleteExpense);
router.post('/:id/receipt', expenseIdValidation, uploadReceiptMiddleware, uploadReceipt);
router.patch('/:id/toggle-recurring', expenseIdValidation, toggleRecurringStatus);

export default router;
