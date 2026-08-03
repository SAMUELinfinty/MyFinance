import { Income } from '../models/income.model.js';
import { Expense } from '../models/expense.model.js';
import { SavingsGoal } from '../models/savingsGoal.model.js';
import { Budget } from '../models/budget.model.js';
import { Transaction } from '../models/transaction.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * @desc    Get aggregated dashboard summary statistics
 * @route   GET /api/v1/dashboard/summary
 * @access  Private
 */
export const getDashboardSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
  const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

  // 1. Total balance: aggregate all income and all expense transactions
  const [incomeSumResult, expenseSumResult] = await Promise.all([
    Income.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Expense.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const totalIncomeAllTime = incomeSumResult[0]?.total || 0;
  const totalExpenseAllTime = expenseSumResult[0]?.total || 0;
  const totalBalance = totalIncomeAllTime - totalExpenseAllTime;

  // 2. Current Month Income & Expenses
  const [monthlyIncomeResult, monthlyExpenseResult] = await Promise.all([
    Income.aggregate([
      { $match: { user: userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Expense.aggregate([
      { $match: { user: userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const monthlyIncome = monthlyIncomeResult[0]?.total || 0;
  const monthlyExpenses = monthlyExpenseResult[0]?.total || 0;

  // 3. Savings: sum currentAmount of all user savings goals
  const savingsGoals = await SavingsGoal.find({ user: userId });
  const totalSavings = savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);

  // 4. Budget Progress: Limit vs spent
  const budget = await Budget.findOne({ user: userId, month: currentMonth, year: currentYear });
  const budgetLimit = budget ? budget.monthlyLimit : 0;
  const budgetProgressPct = budgetLimit > 0 ? Math.min(100, (monthlyExpenses / budgetLimit) * 100) : 0;

  // 5. Recent Transactions: 8 combined transactions
  const recentTransactions = await Transaction.find({ user: userId })
    .sort({ date: -1 })
    .limit(8);

  // 6. Expense Categories Breakdown (Current Month)
  const categoryBreakdown = await Expense.aggregate([
    { $match: { user: userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
    { $sort: { total: -1 } },
  ]);

  // Map category data with percentage
  const totalExpenseThisMonth = categoryBreakdown.reduce((sum, item) => sum + item.total, 0);
  const expenseCategories = categoryBreakdown.map((item) => ({
    category: item._id,
    total: item.total,
    percentage: totalExpenseThisMonth > 0 ? Math.round((item.total / totalExpenseThisMonth) * 100) : 0,
  }));

  // 7. Top Spending: top 5 highest expenses for current month
  const topSpending = await Expense.find({
    user: userId,
    date: { $gte: startOfMonth, $lte: endOfMonth },
  })
    .sort({ amount: -1 })
    .limit(5);

  // 8. Past 6 Months income vs expense trends
  const monthlyTrends = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 5; i >= 0; i--) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = targetDate.getMonth() + 1;
    const y = targetDate.getFullYear();

    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59, 999);

    const [incRes, expRes] = await Promise.all([
      Income.aggregate([
        { $match: { user: userId, date: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: { user: userId, date: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    monthlyTrends.push({
      label: `${monthNames[m - 1]} ${y}`,
      income: incRes[0]?.total || 0,
      expense: expRes[0]?.total || 0,
    });
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalBalance,
        monthlyIncome,
        monthlyExpenses,
        totalSavings,
        budget: {
          limit: budgetLimit,
          spent: monthlyExpenses,
          percentage: budgetProgressPct,
          alertsEnabled: budget ? budget.alertsEnabled : false,
          alertThreshold: budget ? budget.alertThreshold : 85,
        },
        recentTransactions,
        expenseCategories,
        topSpending,
        monthlyTrends,
      },
      'Dashboard summary retrieved successfully'
    )
  );
});
