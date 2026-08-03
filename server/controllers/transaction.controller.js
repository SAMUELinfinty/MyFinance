import { Transaction } from '../models/transaction.model.js';
import { Income } from '../models/income.model.js';
import { Expense } from '../models/expense.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * @desc    Get paginated transactions with search, filter, and sort
 * @route   GET /api/v1/transactions
 * @access  Private
 */
export const getTransactions = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const {
    search,
    type,
    category,
    paymentMethod,
    minAmount,
    maxAmount,
    startDate,
    endDate,
    sortBy = 'date',
    sortOrder = 'desc',
    page = 1,
    limit = 10,
  } = req.query;

  // Build match query
  const matchQuery = { user: userId };

  // Search by keyword in description or category
  if (search) {
    matchQuery.$or = [
      { description: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
      { notes: { $regex: search, $options: 'i' } },
    ];
  }

  // Filter by Type
  if (type && ['income', 'expense'].includes(type)) {
    matchQuery.type = type;
  }

  // Filter by Category
  if (category) {
    matchQuery.category = category;
  }

  // Filter by Payment Method
  if (paymentMethod) {
    matchQuery.paymentMethod = paymentMethod;
  }

  // Filter by Amount Range
  if (minAmount !== undefined || maxAmount !== undefined) {
    matchQuery.amount = {};
    if (minAmount !== undefined) matchQuery.amount.$gte = Number(minAmount);
    if (maxAmount !== undefined) matchQuery.amount.$lte = Number(maxAmount);
  }

  // Filter by Date Range
  if (startDate || endDate) {
    matchQuery.date = {};
    if (startDate) matchQuery.date.$gte = new Date(startDate);
    if (endDate) matchQuery.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
  }

  // Pagination setup
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  // Sorting
  const sortObj = {};
  const validSortFields = ['date', 'amount', 'category', 'type', 'createdAt'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'date';
  sortObj[sortField] = sortOrder === 'asc' ? 1 : -1;

  // Query DB
  const [transactions, totalCount] = await Promise.all([
    Transaction.find(matchQuery).sort(sortObj).skip(skip).limit(limitNum),
    Transaction.countDocuments(matchQuery),
  ]);

  const totalPages = Math.ceil(totalCount / limitNum);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        transactions,
        pagination: {
          currentPage: pageNum,
          totalPages,
          pageSize: limitNum,
          totalCount,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      },
      'Transactions retrieved successfully'
    )
  );
});

/**
 * @desc    Get single transaction by ID
 * @route   GET /api/v1/transactions/:id
 * @access  Private
 */
export const getTransactionById = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
  if (!transaction) {
    throw new ApiError(404, 'Transaction not found');
  }
  return res.status(200).json(new ApiResponse(200, transaction, 'Transaction details'));
});

/**
 * @desc    Create new transaction
 * @route   POST /api/v1/transactions
 * @access  Private
 */
export const createTransaction = asyncHandler(async (req, res) => {
  const { type, amount, category, description, paymentMethod, tags, notes, date } = req.body;

  const transaction = await Transaction.create({
    user: req.user._id,
    type,
    amount: Number(amount),
    category,
    description: description || '',
    paymentMethod: paymentMethod || 'Cash',
    tags: tags || [],
    notes: notes || '',
    date: date ? new Date(date) : new Date(),
  });

  // Synchronize with Income or Expense collection
  if (type === 'income') {
    await Income.create({
      user: req.user._id,
      amount: Number(amount),
      category,
      description: description || '',
      date: date ? new Date(date) : new Date(),
      source: category,
    });
  } else if (type === 'expense') {
    await Expense.create({
      user: req.user._id,
      amount: Number(amount),
      category,
      description: description || '',
      date: date ? new Date(date) : new Date(),
      paymentMethod: paymentMethod || 'Cash',
    });
  }

  return res
    .status(201)
    .json(new ApiResponse(201, transaction, 'Transaction created successfully'));
});

/**
 * @desc    Update existing transaction
 * @route   PUT /api/v1/transactions/:id
 * @access  Private
 */
export const updateTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const transaction = await Transaction.findOne({ _id: id, user: req.user._id });

  if (!transaction) {
    throw new ApiError(404, 'Transaction not found');
  }

  const allowedUpdates = ['type', 'amount', 'category', 'description', 'paymentMethod', 'tags', 'notes', 'date'];
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      transaction[field] = req.body[field];
    }
  });

  await transaction.save();

  return res
    .status(200)
    .json(new ApiResponse(200, transaction, 'Transaction updated successfully'));
});

/**
 * @desc    Delete transaction
 * @route   DELETE /api/v1/transactions/:id
 * @access  Private
 */
export const deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!transaction) {
    throw new ApiError(404, 'Transaction not found');
  }
  return res.status(200).json(new ApiResponse(200, {}, 'Transaction deleted successfully'));
});

/**
 * @desc    Bulk Delete Transactions
 * @route   POST /api/v1/transactions/bulk-delete
 * @access  Private
 */
export const bulkDeleteTransactions = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'Transaction IDs array required');
  }

  const result = await Transaction.deleteMany({
    _id: { $in: ids },
    user: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { deletedCount: result.deletedCount }, `${result.deletedCount} transactions deleted successfully`));
});

/**
 * @desc    Get categories list & summary stats
 * @route   GET /api/v1/transactions/categories
 * @access  Private
 */
export const getTransactionCategories = asyncHandler(async (req, res) => {
  const categories = await Transaction.distinct('category', { user: req.user._id });
  const defaultCategories = [
    'Salary', 'Freelance', 'Investments', 'Gift', 'Other Income',
    'Housing', 'Food & Dining', 'Transportation', 'Healthcare',
    'Shopping', 'Entertainment', 'Utilities', 'Education', 'Travel', 'Insurance'
  ];

  const merged = Array.from(new Set([...defaultCategories, ...categories]));
  return res.status(200).json(new ApiResponse(200, merged, 'Categories fetched'));
});
