import { body, param, query } from 'express-validator';
import { validateRequest } from './auth.validation.js';

export const createIncomeValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ gt: 0 })
    .withMessage('Amount must be greater than zero'),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn([
      'Salary',
      'Freelance',
      'Investments',
      'Business',
      'Rental',
      'Side Hustle',
      'Gift',
      'Other',
    ])
    .withMessage('Invalid category'),
  body('isRecurring').optional().isBoolean(),
  body('recurringFrequency')
    .optional()
    .isIn(['one-time', 'weekly', 'monthly', 'yearly'])
    .withMessage('Invalid recurring frequency'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  validateRequest,
];

export const updateIncomeValidation = [
  param('id').isMongoId().withMessage('Invalid income ID'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('amount')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Amount must be greater than zero'),
  body('category')
    .optional()
    .isIn([
      'Salary',
      'Freelance',
      'Investments',
      'Business',
      'Rental',
      'Side Hustle',
      'Gift',
      'Other',
    ])
    .withMessage('Invalid category'),
  body('isRecurring').optional().isBoolean(),
  body('recurringFrequency')
    .optional()
    .isIn(['one-time', 'weekly', 'monthly', 'yearly']),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  validateRequest,
];

export const incomeIdValidation = [
  param('id').isMongoId().withMessage('Invalid income ID'),
  validateRequest,
];

export const incomeQueryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  validateRequest,
];
