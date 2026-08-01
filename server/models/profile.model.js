import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    bio: {
      type: String,
      maxlength: [250, 'Bio cannot exceed 250 characters'],
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    jobTitle: {
      type: String,
      default: 'Member',
    },
    location: {
      type: String,
      default: '',
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY'],
    },
    // Financial Targets for Health Score calculation
    monthlyIncomeGoal: {
      type: Number,
      default: 5000,
      min: [0, 'Goal must be non-negative'],
    },
    savingsTarget: {
      type: Number,
      default: 1500,
      min: [0, 'Target must be non-negative'],
    },
    emergencyFundGoal: {
      type: Number,
      default: 10000,
      min: [0, 'Goal must be non-negative'],
    },
    // User Preferences & Settings
    settings: {
      theme: {
        type: String,
        enum: ['dark', 'light', 'system'],
        default: 'dark',
      },
      emailAlerts: {
        type: Boolean,
        default: true,
      },
      monthlyReports: {
        type: Boolean,
        default: true,
      },
      securityAlerts: {
        type: Boolean,
        default: true,
      },
      twoFactorEnabled: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

export const UserProfile = mongoose.model('UserProfile', profileSchema);
