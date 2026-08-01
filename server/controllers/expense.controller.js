import fs from 'fs';
import path from 'path';
import { Expense } from '../models/expense.model.js';
import { Transaction } from '../models/transaction.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * @desc    Create new expense entry
 * @route   POST /api/v1/expenses
 * @access  Private
 */
export const createExpense = asyncHandler(async (req, res) => {
  const {
    title,
    amount,
    category,
    isRecurring,
    recurringFrequency,
    date,
    paymentMethod,
    notes,
  } = req.body;

  const expenseDate = date ? new Date(date) : new Date();

  const expense = await Expense.create({
    user: req.user._id,
    title,
    amount: Number(amount),
    category,
    isRecurring: Boolean(isRecurring),
    recurringFrequency: isRecurring ? recurringFrequency || 'monthly' : 'one-time',
    date: expenseDate,
    paymentMethod: paymentMethod || 'Other',
    notes: notes || '',
  });

  // Mirror as Transaction record for global financial metrics
  await Transaction.create({
    user: req.user._id,
    type: 'expense',
    amount: Number(amount),
    category,
    description: title,
    date: expenseDate,
  });

  return res.status(201).json(
    new ApiResponse(201, { expense }, 'Expense created successfully')
  );
});

/**
 * @desc    Get paginated, filtered, & searched expenses
 * @route   GET /api/v1/expenses
 * @access  Private
 */
export const getExpenses = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    category = '',
    isRecurring = '',
    paymentMethod = '',
    startDate = '',
    endDate = '',
    sortBy = 'date',
    sortOrder = 'desc',
  } = req.query;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const query = { user: req.user._id };

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { notes: { $regex: search, $options: 'i' } },
    ];
  }

  if (category) query.category = category;
  if (paymentMethod) query.paymentMethod = paymentMethod;
  if (isRecurring !== '') query.isRecurring = isRecurring === 'true';

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate)
      query.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
  }

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const [expenses, totalCount] = await Promise.all([
    Expense.find(query).sort(sortOptions).skip(skip).limit(limitNum),
    Expense.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalCount / limitNum) || 1;

  const sumResult = await Expense.aggregate([
    { $match: query },
    { $group: { _id: null, totalAmount: { $sum: '$amount' } } },
  ]);
  const queryTotalAmount = sumResult[0]?.totalAmount || 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        expenses,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalCount,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
        queryTotalAmount,
      },
      'Expenses fetched successfully'
    )
  );
});

/**
 * @desc    Get single expense by ID
 * @route   GET /api/v1/expenses/:id
 * @access  Private
 */
export const getExpenseById = asyncHandler(async (req, res) => {
  const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });

  if (!expense) {
    throw new ApiError(404, 'Expense not found');
  }

  return res.status(200).json(
    new ApiResponse(200, { expense }, 'Expense details fetched')
  );
});

/**
 * @desc    Update expense entry
 * @route   PUT /api/v1/expenses/:id
 * @access  Private
 */
export const updateExpense = asyncHandler(async (req, res) => {
  const {
    title,
    amount,
    category,
    isRecurring,
    recurringFrequency,
    recurringStatus,
    date,
    paymentMethod,
    notes,
  } = req.body;

  const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });

  if (!expense) {
    throw new ApiError(404, 'Expense not found');
  }

  if (title !== undefined) expense.title = title;
  if (amount !== undefined) expense.amount = Number(amount);
  if (category !== undefined) expense.category = category;
  if (isRecurring !== undefined) expense.isRecurring = Boolean(isRecurring);
  if (recurringFrequency !== undefined) expense.recurringFrequency = recurringFrequency;
  if (recurringStatus !== undefined) expense.recurringStatus = recurringStatus;
  if (date !== undefined) expense.date = new Date(date);
  if (paymentMethod !== undefined) expense.paymentMethod = paymentMethod;
  if (notes !== undefined) expense.notes = notes;

  await expense.save();

  return res.status(200).json(
    new ApiResponse(200, { expense }, 'Expense updated successfully')
  );
});

/**
 * @desc    Delete expense entry
 * @route   DELETE /api/v1/expenses/:id
 * @access  Private
 */
export const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!expense) {
    throw new ApiError(404, 'Expense not found');
  }

  // Clean up receipt file if it exists
  if (expense.receipt?.filename) {
    const receiptPath = path.join(process.cwd(), 'uploads', 'receipts', expense.receipt.filename);
    if (fs.existsSync(receiptPath)) {
      try { fs.unlinkSync(receiptPath); } catch { /* ignore */ }
    }
  }

  return res.status(200).json(
    new ApiResponse(200, {}, 'Expense deleted successfully')
  );
});

/**
 * @desc    Upload receipt for an expense
 * @route   POST /api/v1/expenses/:id/receipt
 * @access  Private
 */
export const uploadReceipt = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Please select a receipt file to upload');
  }

  const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });

  if (!expense) {
    // Clean up uploaded orphan file
    fs.unlinkSync(req.file.path);
    throw new ApiError(404, 'Expense not found');
  }

  // Delete old receipt if present
  if (expense.receipt?.filename) {
    const oldPath = path.join(process.cwd(), 'uploads', 'receipts', expense.receipt.filename);
    if (fs.existsSync(oldPath)) {
      try { fs.unlinkSync(oldPath); } catch { /* ignore */ }
    }
  }

  expense.receipt = {
    filename: req.file.filename,
    url: `/uploads/receipts/${req.file.filename}`,
    mimetype: req.file.mimetype,
  };

  await expense.save();

  return res.status(200).json(
    new ApiResponse(200, { receipt: expense.receipt }, 'Receipt uploaded successfully')
  );
});

/**
 * @desc    Get Monthly Expense Report & Category Breakdown
 * @route   GET /api/v1/expenses/report
 * @access  Private
 */
export const getExpenseReport = asyncHandler(async (req, res) => {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // 1. Current Month Total
  const currentMonthAgg = await Expense.aggregate([
    {
      $match: {
        user: req.user._id,
        date: { $gte: currentMonthStart, $lte: currentMonthEnd },
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);

  const totalMonthlyExpense = currentMonthAgg[0]?.total || 0;
  const totalTransactionCount = currentMonthAgg[0]?.count || 0;

  // 2. Category Breakdown (current month)
  const categoryBreakdown = await Expense.aggregate([
    {
      $match: {
        user: req.user._id,
        date: { $gte: currentMonthStart, $lte: currentMonthEnd },
      },
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
  ]);

  const categoryStats = categoryBreakdown.map((cat) => ({
    category: cat._id,
    total: cat.total,
    count: cat.count,
    percentage:
      totalMonthlyExpense > 0
        ? ((cat.total / totalMonthlyExpense) * 100).toFixed(1)
        : 0,
  }));

  // 3. Payment Method Breakdown
  const paymentBreakdown = await Expense.aggregate([
    {
      $match: {
        user: req.user._id,
        date: { $gte: currentMonthStart, $lte: currentMonthEnd },
      },
    },
    { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);

  // 4. 6-Month Historical Trend
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const monthlyTrendsRaw = await Expense.aggregate([
    {
      $match: {
        user: req.user._id,
        date: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: { year: { $year: '$date' }, month: { $month: '$date' } },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yr = d.getFullYear();
    const m = d.getMonth() + 1;
    const found = monthlyTrendsRaw.find((it) => it._id.year === yr && it._id.month === m);
    monthlyTrend.push({ label: `${monthNames[m - 1]} ${yr}`, total: found ? found.total : 0 });
  }

  // 5. Recurring Expense Monthly Projection
  const recurringExpenses = await Expense.find({
    user: req.user._id,
    isRecurring: true,
    recurringStatus: 'active',
  });

  const projectedMonthlyRecurring = recurringExpenses.reduce((sum, item) => {
    if (item.recurringFrequency === 'monthly') return sum + item.amount;
    if (item.recurringFrequency === 'weekly') return sum + item.amount * 4.33;
    if (item.recurringFrequency === 'yearly') return sum + item.amount / 12;
    return sum + item.amount;
  }, 0);

  // 6. Largest Single Expense
  const largest = await Expense.findOne({ user: req.user._id, date: { $gte: currentMonthStart, $lte: currentMonthEnd } })
    .sort({ amount: -1 })
    .lean();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalMonthlyExpense,
        totalTransactionCount,
        categoryStats,
        paymentBreakdown,
        monthlyTrend,
        projectedMonthlyRecurring: Math.round(projectedMonthlyRecurring),
        recurringCount: recurringExpenses.length,
        largestExpense: largest || null,
      },
      'Expense report generated successfully'
    )
  );
});

/**
 * @desc    Toggle recurring expense status (Active / Paused)
 * @route   PATCH /api/v1/expenses/:id/toggle-recurring
 * @access  Private
 */
export const toggleRecurringStatus = asyncHandler(async (req, res) => {
  const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });

  if (!expense) {
    throw new ApiError(404, 'Expense not found');
  }

  if (!expense.isRecurring) {
    throw new ApiError(400, 'This expense is not configured as recurring');
  }

  expense.recurringStatus = expense.recurringStatus === 'active' ? 'paused' : 'active';
  await expense.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      { expense },
      `Recurring expense ${expense.recurringStatus === 'active' ? 'activated' : 'paused'}`
    )
  );
});
