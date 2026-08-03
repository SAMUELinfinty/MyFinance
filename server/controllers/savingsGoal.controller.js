import { SavingsGoal } from '../models/savingsGoal.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * @desc    Create new savings goal
 * @route   POST /api/v1/savings
 * @access  Private
 */
export const createGoal = asyncHandler(async (req, res) => {
  const { title, targetAmount, currentAmount, deadline, category, notificationsEnabled, notes } = req.body;

  const current = Number(currentAmount) || 0;
  const target = Number(targetAmount);

  const goal = await SavingsGoal.create({
    user: req.user._id,
    title,
    targetAmount: target,
    currentAmount: current,
    deadline: new Date(deadline),
    category: category || 'Other',
    isCompleted: current >= target,
    notificationsEnabled: notificationsEnabled !== undefined ? Boolean(notificationsEnabled) : true,
    notes: notes || '',
  });

  return res.status(201).json(
    new ApiResponse(201, { goal }, 'Savings goal created successfully')
  );
});

/**
 * @desc    Get all savings goals with summary statistics
 * @route   GET /api/v1/savings
 * @access  Private
 */
export const getGoals = asyncHandler(async (req, res) => {
  const goals = await SavingsGoal.find({ user: req.user._id }).sort({ deadline: 1 });

  // Calculate summary metrics
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalCurrent = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalRemaining = Math.max(0, totalTarget - totalCurrent);
  const completedCount = goals.filter((g) => g.isCompleted).length;
  const activeCount = goals.length - completedCount;

  // Generate alerts/notifications:
  // We can flag if any active goal is within 30 days of the deadline and not completed
  const alerts = [];
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  goals.forEach((g) => {
    if (!g.isCompleted && g.notificationsEnabled) {
      const deadlineDate = new Date(g.deadline);
      if (deadlineDate <= now) {
        alerts.push({
          type: 'overdue',
          message: `Goal "${g.title}" deadline has passed! Target was $${g.targetAmount.toLocaleString()}.`,
          goalId: g._id,
        });
      } else if (deadlineDate <= thirtyDaysFromNow) {
        const daysLeft = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
        alerts.push({
          type: 'approaching_deadline',
          message: `Goal "${g.title}" is approaching deadline! Only ${daysLeft} days left to save $${(g.targetAmount - g.currentAmount).toLocaleString()}.`,
          goalId: g._id,
        });
      }
    }
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        goals,
        summary: {
          totalTarget,
          totalCurrent,
          totalRemaining,
          completedCount,
          activeCount,
        },
        alerts,
      },
      'Savings goals retrieved successfully'
    )
  );
});

/**
 * @desc    Update savings goal details
 * @route   PUT /api/v1/savings/:id
 * @access  Private
 */
export const updateGoal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, targetAmount, currentAmount, deadline, category, notificationsEnabled, notes } = req.body;

  const goal = await SavingsGoal.findOne({ _id: id, user: req.user._id });
  if (!goal) {
    throw new ApiError(404, 'Savings goal not found or unauthorized');
  }

  if (title) goal.title = title;
  if (category) goal.category = category;
  if (deadline) goal.deadline = new Date(deadline);
  if (notes !== undefined) goal.notes = notes;
  if (notificationsEnabled !== undefined) goal.notificationsEnabled = Boolean(notificationsEnabled);

  if (targetAmount !== undefined) {
    goal.targetAmount = Number(targetAmount);
  }
  if (currentAmount !== undefined) {
    goal.currentAmount = Number(currentAmount);
  }

  // Update completed status dynamically
  goal.isCompleted = goal.currentAmount >= goal.targetAmount;

  await goal.save();

  return res.status(200).json(
    new ApiResponse(200, { goal }, 'Savings goal updated successfully')
  );
});

/**
 * @desc    Delete savings goal
 * @route   DELETE /api/v1/savings/:id
 * @access  Private
 */
export const deleteGoal = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const goal = await SavingsGoal.findOneAndDelete({ _id: id, user: req.user._id });
  if (!goal) {
    throw new ApiError(404, 'Savings goal not found or unauthorized');
  }

  return res.status(200).json(
    new ApiResponse(200, null, 'Savings goal deleted successfully')
  );
});
