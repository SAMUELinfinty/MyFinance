import mongoose from 'mongoose';

const savingsGoalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Savings goal title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    targetAmount: {
      type: Number,
      required: [true, 'Target amount is required'],
      min: [0.01, 'Target amount must be greater than zero'],
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: [0, 'Current savings amount cannot be negative'],
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline is required'],
    },
    category: {
      type: String,
      enum: [
        'Emergency Fund',
        'Retirement',
        'Travel',
        'Vehicle',
        'Home',
        'Education',
        'Gadgets',
        'Other',
      ],
      default: 'Other',
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    notificationsEnabled: {
      type: Boolean,
      default: true,
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

export const SavingsGoal = mongoose.model('SavingsGoal', savingsGoalSchema);
