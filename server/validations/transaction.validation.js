import { body, query } from 'express-validator';
import { validateRequest } from './auth.validation.js';

export const createTransactionValidation = [
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['income', 'expense'])
    .withMessage('Type must be income or expense'),
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ gt: 0 })
    .withMessage('Amount must be a positive number'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('description').optional().trim(),
  body('paymentMethod')
    .optional()
    .isIn(['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'UPI', 'Crypto', 'Other']),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  validateRequest,
];

export const updateTransactionValidation = [
  body('type').optional().isIn(['income', 'expense']),
  body('amount').optional().isFloat({ gt: 0 }),
  body('category').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('paymentMethod')
    .optional()
    .isIn(['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'UPI', 'Crypto', 'Other']),
  body('date').optional().isISO8601(),
  validateRequest,
];

export const bulkDeleteValidation = [
  body('ids').isArray({ min: 1 }).withMessage('IDs must be a non-empty array'),
  validateRequest,
];
