import mongoose from 'mongoose';

const incomeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Income title is required'],
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
        'Salary',
        'Freelance',
        'Investments',
        'Business',
        'Rental',
        'Side Hustle',
        'Gift',
        'Other',
      ],
      default: 'Salary',
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
incomeSchema.index({ user: 1, date: -1 });

export const Income = mongoose.model('Income', incomeSchema);
