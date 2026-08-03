import { Router } from 'express';
import {
  createGoal,
  getGoals,
  updateGoal,
  deleteGoal,
} from '../controllers/savingsGoal.controller.js';
import {
  createSavingsGoalValidation,
  updateSavingsGoalValidation,
  savingsGoalIdValidation,
} from '../validations/savingsGoal.validation.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

// Protect all savings routes
router.use(verifyJWT);

router.post('/', createSavingsGoalValidation, createGoal);
router.get('/', getGoals);
router.put('/:id', updateSavingsGoalValidation, updateGoal);
router.delete('/:id', savingsGoalIdValidation, deleteGoal);

export default router;
