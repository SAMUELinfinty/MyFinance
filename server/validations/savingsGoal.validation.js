import { body, param } from 'express-validator';
import { validateRequest } from './auth.validation.js';

const SAVINGS_CATEGORIES = [
  'Emergency Fund',
  'Retirement',
  'Travel',
  'Vehicle',
  'Home',
  'Education',
  'Gadgets',
  'Other',
];

export const createSavingsGoalValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('targetAmount')
    .notEmpty()
    .withMessage('Target amount is required')
    .isFloat({ gt: 0 })
    .withMessage('Target amount must be greater than zero'),
  body('currentAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Current savings amount cannot be negative'),
  body('deadline')
    .notEmpty()
    .withMessage('Deadline is required')
    .isISO8601()
    .withMessage('Invalid date format for deadline'),
  body('category')
    .optional()
    .isIn(SAVINGS_CATEGORIES)
    .withMessage('Invalid category'),
  body('notificationsEnabled')
    .optional()
    .isBoolean()
    .withMessage('notificationsEnabled must be a boolean'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
  validateRequest,
];

export const updateSavingsGoalValidation = [
  param('id').isMongoId().withMessage('Invalid savings goal ID'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('targetAmount')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Target amount must be greater than zero'),
  body('currentAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Current savings amount cannot be negative'),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for deadline'),
  body('category')
    .optional()
    .isIn(SAVINGS_CATEGORIES)
    .withMessage('Invalid category'),
  body('notificationsEnabled')
    .optional()
    .isBoolean()
    .withMessage('notificationsEnabled must be a boolean'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
  validateRequest,
];

export const savingsGoalIdValidation = [
  param('id').isMongoId().withMessage('Invalid savings goal ID'),
  validateRequest,
];
