import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
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
      default: 'Other',
      index: true,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringFrequency: {
      type: String,
      enum: ['one-time', 'weekly', 'monthly', 'yearly'],
      default: 'one-time',
    },
    recurringStatus: {
      type: String,
      enum: ['active', 'paused'],
      default: 'active',
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'UPI', 'Other'],
      default: 'Other',
    },
    receipt: {
      filename: { type: String, default: '' },
      url: { type: String, default: '' },
      mimetype: { type: String, default: '' },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user date queries
expenseSchema.index({ user: 1, date: -1 });

export const Expense = mongoose.model('Expense', expenseSchema);
