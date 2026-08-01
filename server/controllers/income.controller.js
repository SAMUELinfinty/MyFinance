import { Income } from '../models/income.model.js';
import { Transaction } from '../models/transaction.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * @desc    Create new income entry
 * @route   POST /api/v1/income
 * @access  Private
 */
export const createIncome = asyncHandler(async (req, res) => {
  const { title, amount, category, isRecurring, recurringFrequency, date, notes } = req.body;

  const income = await Income.create({
    user: req.user._id,
    title,
    amount: Number(amount),
    category,
    isRecurring: Boolean(isRecurring),
    recurringFrequency: isRecurring ? recurringFrequency || 'monthly' : 'one-time',
    date: date ? new Date(date) : new Date(),
    notes: notes || '',
  });

  // Mirror as Transaction record for global financial metrics
  await Transaction.create({
    user: req.user._id,
    type: 'income',
    amount: Number(amount),
    category,
    description: title,
    date: income.date,
  });

  return res.status(201).json(
    new ApiResponse(201, { income }, 'Income record created successfully')
  );
});

/**
 * @desc    Get paginated, filtered, & searched income records
 * @route   GET /api/v1/income
 * @access  Private
 */
export const getIncomes = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    category = '',
    isRecurring = '',
    startDate = '',
    endDate = '',
    sortBy = 'date',
    sortOrder = 'desc',
  } = req.query;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  // Build Query Filter
  const query = { user: req.user._id };

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { notes: { $regex: search, $options: 'i' } },
    ];
  }

  if (category) {
    query.category = category;
  }

  if (isRecurring !== '') {
    query.isRecurring = isRecurring === 'true';
  }

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
  }

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const [incomes, totalCount] = await Promise.all([
    Income.find(query).sort(sortOptions).skip(skip).limit(limitNum),
    Income.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalCount / limitNum) || 1;

  // Calculate overall query total sum
  const sumResult = await Income.aggregate([
    { $match: query },
    { $group: { _id: null, totalAmount: { $sum: '$amount' } } },
  ]);
  const queryTotalAmount = sumResult[0]?.totalAmount || 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        incomes,
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
      'Income records fetched successfully'
    )
  );
});

/**
 * @desc    Get single income details by ID
 * @route   GET /api/v1/income/:id
 * @access  Private
 */
export const getIncomeById = asyncHandler(async (req, res) => {
  const income = await Income.findOne({ _id: req.params.id, user: req.user._id });

  if (!income) {
    throw new ApiError(404, 'Income record not found');
  }

  return res.status(200).json(
    new ApiResponse(200, { income }, 'Income details fetched')
  );
});

/**
 * @desc    Update income entry
 * @route   PUT /api/v1/income/:id
 * @access  Private
 */
export const updateIncome = asyncHandler(async (req, res) => {
  const { title, amount, category, isRecurring, recurringFrequency, recurringStatus, date, notes } = req.body;

  let income = await Income.findOne({ _id: req.params.id, user: req.user._id });

  if (!income) {
    throw new ApiError(404, 'Income record not found');
  }

  if (title !== undefined) income.title = title;
  if (amount !== undefined) income.amount = Number(amount);
  if (category !== undefined) income.category = category;
  if (isRecurring !== undefined) income.isRecurring = Boolean(isRecurring);
  if (recurringFrequency !== undefined) income.recurringFrequency = recurringFrequency;
  if (recurringStatus !== undefined) income.recurringStatus = recurringStatus;
  if (date !== undefined) income.date = new Date(date);
  if (notes !== undefined) income.notes = notes;

  await income.save();

  return res.status(200).json(
    new ApiResponse(200, { income }, 'Income record updated successfully')
  );
});

/**
 * @desc    Delete income entry
 * @route   DELETE /api/v1/income/:id
 * @access  Private
 */
export const deleteIncome = asyncHandler(async (req, res) => {
  const income = await Income.findOneAndDelete({ _id: req.params.id, user: req.user._id });

  if (!income) {
    throw new ApiError(404, 'Income record not found');
  }

  return res.status(200).json(
    new ApiResponse(200, {}, 'Income record deleted successfully')
  );
});

/**
 * @desc    Get Monthly Income Report & Category Breakdown
 * @route   GET /api/v1/income/report
 * @access  Private
 */
export const getIncomeReport = asyncHandler(async (req, res) => {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // 1. Current Month Total Income
  const monthIncomes = await Income.find({
    user: req.user._id,
    date: { $gte: currentMonthStart, $lte: currentMonthEnd },
  });

  const totalMonthlyIncome = monthIncomes.reduce((sum, item) => sum + item.amount, 0);

  // 2. Category Breakdown Aggregation
  const categoryBreakdown = await Income.aggregate([
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
    percentage: totalMonthlyIncome > 0 ? ((cat.total / totalMonthlyIncome) * 100).toFixed(1) : 0,
  }));

  // 3. Historical 6-Month Trend
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const monthlyTrendsRaw = await Income.aggregate([
    {
      $match: {
        user: req.user._id,
        date: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
        },
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
    const found = monthlyTrendsRaw.find((item) => item._id.year === yr && item._id.month === m);
    monthlyTrend.push({
      label: `${monthNames[m - 1]} ${yr}`,
      total: found ? found.total : 0,
    });
  }

  // 4. Active Recurring Projection
  const recurringIncomes = await Income.find({
    user: req.user._id,
    isRecurring: true,
    recurringStatus: 'active',
  });

  const projectedMonthlyRecurring = recurringIncomes.reduce((sum, item) => {
    if (item.recurringFrequency === 'monthly') return sum + item.amount;
    if (item.recurringFrequency === 'weekly') return sum + item.amount * 4.33;
    if (item.recurringFrequency === 'yearly') return sum + item.amount / 12;
    return sum + item.amount;
  }, 0);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalMonthlyIncome,
        categoryStats,
        monthlyTrend,
        projectedMonthlyRecurring: Math.round(projectedMonthlyRecurring),
        recurringCount: recurringIncomes.length,
      },
      'Income report generated successfully'
    )
  );
});

/**
 * @desc    Toggle recurring income status (Active / Paused)
 * @route   PATCH /api/v1/income/:id/toggle-recurring
 * @access  Private
 */
export const toggleRecurringStatus = asyncHandler(async (req, res) => {
  const income = await Income.findOne({ _id: req.params.id, user: req.user._id });

  if (!income) {
    throw new ApiError(404, 'Income record not found');
  }

  if (!income.isRecurring) {
    throw new ApiError(400, 'This income record is not configured as recurring');
  }

  income.recurringStatus = income.recurringStatus === 'active' ? 'paused' : 'active';
  await income.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      { income },
      `Recurring income ${income.recurringStatus === 'active' ? 'activated' : 'paused'}`
    )
  );
});
