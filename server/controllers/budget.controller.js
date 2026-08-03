import { Budget } from '../models/budget.model.js';
import { Expense } from '../models/expense.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * @desc    Create or Update Budget for a month/year
 * @route   POST /api/v1/budget
 * @access  Private
 */
export const upsertBudget = asyncHandler(async (req, res) => {
  const { month, year, monthlyLimit, categoryBudgets, alertsEnabled, alertThreshold } = req.body;

  const budget = await Budget.findOneAndUpdate(
    { user: req.user._id, month, year },
    {
      monthlyLimit: Number(monthlyLimit),
      categoryBudgets: categoryBudgets || [],
      alertsEnabled: alertsEnabled !== undefined ? Boolean(alertsEnabled) : true,
      alertThreshold: alertThreshold !== undefined ? Number(alertThreshold) : 85,
    },
    { new: true, upsert: true, runValidators: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { budget }, 'Budget saved successfully'));
});

/**
 * @desc    Get Budget and Details/Progress for a specific month and year
 * @route   GET /api/v1/budget/current
 * @access  Private
 */
export const getBudgetForMonth = asyncHandler(async (req, res) => {
  const currentDate = new Date();
  const month = req.query.month ? parseInt(req.query.month, 10) : currentDate.getMonth() + 1;
  const year = req.query.year ? parseInt(req.query.year, 10) : currentDate.getFullYear();

  // Find the budget settings
  const budget = await Budget.findOne({ user: req.user._id, month, year });

  // Calculate actual expenses for this month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const expenses = await Expense.find({
    user: req.user._id,
    date: { $gte: startDate, $lte: endDate },
  });

  // Calculate aggregate expense details
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const spentByCategory = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  let categoryProgress = [];
  let remaining = 0;
  let overallAlertTriggered = false;
  let alertPercentage = 85;

  if (budget) {
    alertPercentage = budget.alertThreshold;
    remaining = budget.monthlyLimit - totalSpent;
    overallAlertTriggered =
      budget.alertsEnabled && totalSpent >= (budget.monthlyLimit * alertPercentage) / 100;

    // Map budget category limits to actual spend
    categoryProgress = budget.categoryBudgets.map((catBud) => {
      const spent = spentByCategory[catBud.category] || 0;
      const percentage = catBud.limit > 0 ? (spent / catBud.limit) * 100 : 0;
      return {
        category: catBud.category,
        limit: catBud.limit,
        spent,
        percentage,
        alertTriggered: budget.alertsEnabled && spent >= (catBud.limit * alertPercentage) / 100,
      };
    });

    // Add categories that have expenses but no budget limit set
    Object.keys(spentByCategory).forEach((cat) => {
      if (!budget.categoryBudgets.some((b) => b.category === cat)) {
        categoryProgress.push({
          category: cat,
          limit: 0,
          spent: spentByCategory[cat],
          percentage: 100, // infinite / unbudgeted
          alertTriggered: budget.alertsEnabled, // Always alert for unbudgeted category spend if alerts are on
        });
      }
    });
  } else {
    // No budget is configured yet, list categories with spending
    categoryProgress = Object.keys(spentByCategory).map((cat) => ({
      category: cat,
      limit: 0,
      spent: spentByCategory[cat],
      percentage: 100,
      alertTriggered: false,
    }));
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        budget: budget || null,
        totalSpent,
        remaining,
        alertThreshold: alertPercentage,
        overallAlertTriggered,
        categoryProgress,
      },
      'Budget details retrieved successfully'
    )
  );
});

/**
 * @desc    Get Budget vs Expense History for last 6 months
 * @route   GET /api/v1/budget/history
 * @access  Private
 */
export const getBudgetHistory = asyncHandler(async (req, res) => {
  const history = [];
  const currentDate = new Date();

  // Retrieve last 6 months details
  for (let i = 5; i >= 0; i--) {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const month = targetDate.getMonth() + 1;
    const year = targetDate.getFullYear();

    const budget = await Budget.findOne({ user: req.user._id, month, year });
    const monthlyLimit = budget ? budget.monthlyLimit : 0;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const expenses = await Expense.find({
      user: req.user._id,
      date: { $gte: startDate, $lte: endDate },
    });

    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    history.push({
      label: `${monthNames[month - 1]} ${year}`,
      month,
      year,
      budgetLimit: monthlyLimit,
      actualSpent: totalSpent,
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { history }, 'Budget history retrieved successfully'));
});
