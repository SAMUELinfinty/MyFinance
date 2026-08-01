import fs from 'fs';
import path from 'path';
import { UserProfile } from '../models/profile.model.js';
import { User } from '../models/user.model.js';
import { Transaction } from '../models/transaction.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Calculate dynamic Financial Health Score (0 - 100)
 */
export const calculateFinancialHealthScore = (monthlyIncome, monthlyExpense, savingsTarget = 1500) => {
  if (monthlyIncome <= 0) {
    return {
      score: 0,
      rating: 'Needs Attention',
      color: '#EF4444',
      breakdown: {
        savingsRateScore: 0,
        expenseRatioScore: 0,
        goalProgressScore: 0,
        stabilityScore: 0,
      },
      tips: ['Log your monthly income to activate your Financial Health Score.'],
    };
  }

  const netSavings = monthlyIncome - monthlyExpense;
  const savingsRate = Math.max(0, netSavings / monthlyIncome);
  const expenseRatio = monthlyExpense / monthlyIncome;

  // 1. Savings Rate Score (0 - 35 points)
  // Target benchmark: 20%+ savings rate gets full 35 points
  const savingsRateScore = Math.min(35, Math.round((savingsRate / 0.20) * 35));

  // 2. Expense Ratio Score (0 - 35 points)
  // Ideal: <= 50% of income spent. 100%+ spent gets 0 points.
  let expenseRatioScore = 0;
  if (expenseRatio <= 0.50) {
    expenseRatioScore = 35;
  } else if (expenseRatio < 1.0) {
    expenseRatioScore = Math.round((1 - expenseRatio) / 0.50 * 35);
  }

  // 3. Goal Progress Score (0 - 15 points)
  const goalRatio = Math.max(0, netSavings / (savingsTarget || 1));
  const goalProgressScore = Math.min(15, Math.round(goalRatio * 15));

  // 4. Financial Stability Score (0 - 15 points)
  // Evaluates cash buffer surplus
  const stabilityScore = netSavings > 0 ? (netSavings >= monthlyIncome * 0.1 ? 15 : 10) : 0;

  const totalScore = Math.min(100, Math.max(0, savingsRateScore + expenseRatioScore + goalProgressScore + stabilityScore));

  let rating = 'Needs Attention';
  let color = '#EF4444'; // Red

  if (totalScore >= 80) {
    rating = 'Excellent';
    color = '#10B981'; // Emerald Green
  } else if (totalScore >= 65) {
    rating = 'Good';
    color = '#3B82F6'; // Blue
  } else if (totalScore >= 50) {
    rating = 'Fair';
    color = '#F59E0B'; // Amber
  }

  const tips = [];
  if (savingsRate < 0.20) {
    tips.push(`Your savings rate is ${(savingsRate * 100).toFixed(1)}%. Aim to save at least 20% of monthly income.`);
  }
  if (expenseRatio > 0.60) {
    tips.push(`You are spending ${(expenseRatio * 100).toFixed(1)}% of your income. Consider reducing discretionary costs.`);
  }
  if (netSavings < savingsTarget) {
    tips.push(`You are $${(savingsTarget - netSavings).toFixed(0)} short of your monthly savings target of $${savingsTarget}.`);
  }
  if (tips.length === 0) {
    tips.push('Outstanding financial discipline! Keep maintaining your current savings and budget habits.');
  }

  return {
    score: totalScore,
    rating,
    color,
    metrics: {
      savingsRatePct: Math.round(savingsRate * 100),
      expenseRatioPct: Math.round(expenseRatio * 100),
      netSavings,
    },
    breakdown: {
      savingsRateScore,
      expenseRatioScore,
      goalProgressScore,
      stabilityScore,
    },
    tips,
  };
};

/**
 * @desc    Get Current User Profile & Financial Summary
 * @route   GET /api/v1/profile
 * @access  Private
 */
export const getProfile = asyncHandler(async (req, res) => {
  let profile = await UserProfile.findOne({ user: req.user._id });

  if (!profile) {
    profile = await UserProfile.create({ user: req.user._id });
  }

  // Calculate current month financial totals
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const transactions = await Transaction.find({
    user: req.user._id,
    date: { $gte: startOfMonth, $lte: endOfMonth },
  });

  let monthlyIncome = 0;
  let monthlyExpense = 0;

  transactions.forEach((tx) => {
    if (tx.type === 'income') monthlyIncome += tx.amount;
    if (tx.type === 'expense') monthlyExpense += tx.amount;
  });

  // If no transactions exist, check overall transactions or offer defaults
  const totalTxCount = await Transaction.countDocuments({ user: req.user._id });
  if (totalTxCount === 0) {
    // Seed virtual baseline metrics for empty users for seamless presentation
    monthlyIncome = profile.monthlyIncomeGoal || 5000;
    monthlyExpense = Math.round(monthlyIncome * 0.55);
  }

  const netSavings = monthlyIncome - monthlyExpense;
  const savingsRate = monthlyIncome > 0 ? ((netSavings / monthlyIncome) * 100).toFixed(1) : 0;

  const financialHealth = calculateFinancialHealthScore(
    monthlyIncome,
    monthlyExpense,
    profile.savingsTarget
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: req.user,
        profile,
        summary: {
          monthlyIncome,
          monthlyExpense,
          netSavings,
          savingsRate: Number(savingsRate),
          currency: profile.currency,
        },
        financialHealth,
      },
      'User profile and summary fetched successfully'
    )
  );
});

/**
 * @desc    Update User Profile & Settings
 * @route   PUT /api/v1/profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, bio, phone, jobTitle, location, currency, monthlyIncomeGoal, savingsTarget, settings } = req.body;

  // Update base User model fields
  if (name) {
    await User.findByIdAndUpdate(req.user._id, { name });
  }

  let profile = await UserProfile.findOne({ user: req.user._id });

  if (!profile) {
    profile = new UserProfile({ user: req.user._id });
  }

  if (bio !== undefined) profile.bio = bio;
  if (phone !== undefined) profile.phone = phone;
  if (jobTitle !== undefined) profile.jobTitle = jobTitle;
  if (location !== undefined) profile.location = location;
  if (currency !== undefined) profile.currency = currency;
  if (monthlyIncomeGoal !== undefined) profile.monthlyIncomeGoal = Number(monthlyIncomeGoal);
  if (savingsTarget !== undefined) profile.savingsTarget = Number(savingsTarget);

  if (settings) {
    profile.settings = {
      ...profile.settings.toObject(),
      ...settings,
    };
  }

  await profile.save();

  const updatedUser = await User.findById(req.user._id).select('-refreshTokens -password');

  return res.status(200).json(
    new ApiResponse(
      200,
      { user: updatedUser, profile },
      'Profile updated successfully'
    )
  );
});

/**
 * @desc    Upload Profile Avatar Picture
 * @route   POST /api/v1/profile/avatar
 * @access  Private
 */
export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Please select an image file to upload');
  }

  const user = await User.findById(req.user._id);

  // If user already had a local avatar, delete old file
  if (user.avatar && user.avatar.startsWith('/uploads/avatars/')) {
    const oldPath = path.join(process.cwd(), user.avatar);
    if (fs.existsSync(oldPath)) {
      try {
        fs.unlinkSync(oldPath);
      } catch {
        // Ignore deletion errors
      }
    }
  }

  // Generate public relative static URL path
  const relativeAvatarUrl = `/uploads/avatars/${req.file.filename}`;
  user.avatar = relativeAvatarUrl;
  await user.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      { avatar: relativeAvatarUrl, user },
      'Profile avatar updated successfully'
    )
  );
});

/**
 * @desc    Seed Demo Transactions for Summary Testing
 * @route   POST /api/v1/profile/seed-demo
 * @access  Private
 */
export const seedDemoTransactions = asyncHandler(async (req, res) => {
  await Transaction.deleteMany({ user: req.user._id });

  const now = new Date();
  const demoItems = [
    { type: 'income', amount: 4500, category: 'Salary', description: 'Monthly Tech Lead Salary', date: now },
    { type: 'income', amount: 850, category: 'Freelance', description: 'Web Design Project', date: now },
    { type: 'expense', amount: 1400, category: 'Housing', description: 'Apartment Rent', date: now },
    { type: 'expense', amount: 350, category: 'Groceries', description: 'Organic Supermarket', date: now },
    { type: 'expense', amount: 180, category: 'Utilities', description: 'Electricity & Internet', date: now },
    { type: 'expense', amount: 220, category: 'Dining Out', description: 'Restaurants & Coffee', date: now },
    { type: 'expense', amount: 120, category: 'Entertainment', description: 'Subscriptions & Movies', date: now },
  ];

  const docs = demoItems.map((item) => ({ ...item, user: req.user._id }));
  await Transaction.insertMany(docs);

  return res.status(201).json(
    new ApiResponse(201, {}, 'Demo financial transactions seeded successfully!')
  );
});
