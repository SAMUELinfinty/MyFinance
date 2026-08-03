import mongoose from 'mongoose';

const categoryBudgetSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: [
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
    ],
  },
  limit: {
    type: Number,
    required: true,
    min: [0, 'Category budget limit must be a positive number'],
  },
});

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
      min: 2000,
    },
    monthlyLimit: {
      type: Number,
      required: true,
      min: [0, 'Monthly budget limit must be a positive number'],
    },
    categoryBudgets: [categoryBudgetSchema],
    alertsEnabled: {
      type: Boolean,
      default: true,
    },
    alertThreshold: {
      type: Number,
      default: 85, // trigger alert at 85%
      min: 1,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique budget per user per month
budgetSchema.index({ user: 1, year: 1, month: 1 }, { unique: true });

export const Budget = mongoose.model('Budget', budgetSchema);
