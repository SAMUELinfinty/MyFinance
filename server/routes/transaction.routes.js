import { Router } from 'express';
import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  bulkDeleteTransactions,
  getTransactionCategories,
} from '../controllers/transaction.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import {
  createTransactionValidation,
  updateTransactionValidation,
  bulkDeleteValidation,
} from '../validations/transaction.validation.js';

const router = Router();

// Protect all transaction endpoints
router.use(verifyJWT);

router.get('/', getTransactions);
router.get('/categories', getTransactionCategories);
router.get('/:id', getTransactionById);
router.post('/', createTransactionValidation, createTransaction);
router.put('/:id', updateTransactionValidation, updateTransaction);
router.delete('/:id', deleteTransaction);
router.post('/bulk-delete', bulkDeleteValidation, bulkDeleteTransactions);

export default router;
