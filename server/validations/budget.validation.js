import { body, param, query } from 'express-validator';
import { validateRequest } from './auth.validation.js';

const BUDGET_CATEGORIES = [
  'Housing',
  'Food & Dining',
  'Transportation',
  'Healthcare',
  'Shopping',
  'Entertainment',
  'Utilities',
  'Education',
  'Travel',
  'Insurance',
  'Personal Care',
  'Subscriptions',
  'Debt Payment',
  'Savings Transfer',
  'Other',
];

export const createOrUpdateBudgetValidation = [
  body('month')
    .notEmpty()
    .withMessage('Month is required')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be an integer between 1 and 12'),
  body('year')
    .notEmpty()
    .withMessage('Year is required')
    .isInt({ min: 2000 })
    .withMessage('Year must be a valid year starting from 2000'),
  body('monthlyLimit')
    .notEmpty()
    .withMessage('Monthly limit is required')
    .isFloat({ min: 0 })
    .withMessage('Monthly limit must be a positive number'),
  body('categoryBudgets')
    .optional()
    .isArray()
    .withMessage('Category budgets must be an array'),
  body('categoryBudgets.*.category')
    .if(body('categoryBudgets').exists())
    .notEmpty()
    .withMessage('Category is required for each category budget')
    .isIn(BUDGET_CATEGORIES)
    .withMessage('Invalid category specified'),
  body('categoryBudgets.*.limit')
    .if(body('categoryBudgets').exists())
    .notEmpty()
    .withMessage('Limit is required for each category budget')
    .isFloat({ min: 0 })
    .withMessage('Category limit must be a positive number'),
  body('alertsEnabled')
    .optional()
    .isBoolean()
    .withMessage('alertsEnabled must be a boolean'),
  body('alertThreshold')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Alert threshold must be an integer between 1 and 100'),
  validateRequest,
];

export const getBudgetQueryValidation = [
  query('month')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),
  query('year')
    .optional()
    .isInt({ min: 2000 })
    .withMessage('Year must be a valid year starting from 2000'),
  validateRequest,
];
