import { Income } from '../models/income.model.js';
import { Expense } from '../models/expense.model.js';
import { SavingsGoal } from '../models/savingsGoal.model.js';
import { Transaction } from '../models/transaction.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * @desc    Get deep analytics summary with filtering
 * @route   GET /api/v1/analytics/summary
 * @access  Private
 */
export const getAnalyticsSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const now = new Date();

  // Parse filter params
  const filterYear = req.query.year ? parseInt(req.query.year, 10) : now.getFullYear();
  const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(filterYear, 0, 1);
  const endDate = req.query.endDate
    ? new Date(new Date(req.query.endDate).setHours(23, 59, 59, 999))
    : new Date(filterYear, 11, 31, 23, 59, 59, 999);

  // ── 1. Income vs Expense (filtered range) ──
  const [incomeAgg, expenseAgg] = await Promise.all([
    Income.aggregate([
      { $match: { user: userId, date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Expense.aggregate([
      { $match: { user: userId, date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
  ]);

  const totalIncome = incomeAgg[0]?.total || 0;
  const totalExpense = expenseAgg[0]?.total || 0;
  const incomeCount = incomeAgg[0]?.count || 0;
  const expenseCount = expenseAgg[0]?.count || 0;
  const netSavings = totalIncome - totalExpense;

  // ── 2. Monthly Trends (12 months of filterYear) ──
  const monthlyTrends = [];
  for (let m = 0; m < 12; m++) {
    const mStart = new Date(filterYear, m, 1);
    const mEnd = new Date(filterYear, m + 1, 0, 23, 59, 59, 999);

    const [mInc, mExp] = await Promise.all([
      Income.aggregate([
        { $match: { user: userId, date: { $gte: mStart, $lte: mEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: { user: userId, date: { $gte: mStart, $lte: mEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    monthlyTrends.push({
      label: MONTH_NAMES[m],
      month: m + 1,
      income: mInc[0]?.total || 0,
      expense: mExp[0]?.total || 0,
      savings: (mInc[0]?.total || 0) - (mExp[0]?.total || 0),
    });
  }

  // ── 3. Yearly Trends (last 3 years + current) ──
  const yearlyTrends = [];
  for (let y = filterYear - 2; y <= filterYear; y++) {
    const yStart = new Date(y, 0, 1);
    const yEnd = new Date(y, 11, 31, 23, 59, 59, 999);

    const [yInc, yExp] = await Promise.all([
      Income.aggregate([
        { $match: { user: userId, date: { $gte: yStart, $lte: yEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: { user: userId, date: { $gte: yStart, $lte: yEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    yearlyTrends.push({
      year: y,
      income: yInc[0]?.total || 0,
      expense: yExp[0]?.total || 0,
      savings: (yInc[0]?.total || 0) - (yExp[0]?.total || 0),
    });
  }

  // ── 4. Expense Categories Breakdown (filtered range) ──
  const categoryBreakdown = await Expense.aggregate([
    { $match: { user: userId, date: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);

  const totalCatExpense = categoryBreakdown.reduce((s, c) => s + c.total, 0);
  const expenseCategories = categoryBreakdown.map((c) => ({
    category: c._id,
    total: c.total,
    count: c.count,
    percentage: totalCatExpense > 0 ? Math.round((c.total / totalCatExpense) * 100) : 0,
  }));

  // ── 5. Savings Growth Timeline ──
  const savingsGoals = await SavingsGoal.find({ user: userId }).sort({ createdAt: 1 });
  const savingsTimeline = savingsGoals.map((g) => ({
    title: g.title,
    target: g.targetAmount,
    current: g.currentAmount,
    percentage: g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0,
    isCompleted: g.isCompleted,
    deadline: g.deadline,
  }));
  const totalSavingsTarget = savingsGoals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSavingsCurrent = savingsGoals.reduce((s, g) => s + g.currentAmount, 0);

  // ── 6. Financial Health Score ──
  // Use current month data for health score
  const cmStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const cmEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [cmInc, cmExp] = await Promise.all([
    Income.aggregate([
      { $match: { user: userId, date: { $gte: cmStart, $lte: cmEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Expense.aggregate([
      { $match: { user: userId, date: { $gte: cmStart, $lte: cmEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const monthlyIncome = cmInc[0]?.total || 0;
  const monthlyExpense = cmExp[0]?.total || 0;
  const healthScore = calculateHealthScore(monthlyIncome, monthlyExpense);

  return res.status(200).json(
    new ApiResponse(200, {
      incomeVsExpense: { totalIncome, totalExpense, netSavings, incomeCount, expenseCount },
      monthlyTrends,
      yearlyTrends,
      expenseCategories,
      savingsGrowth: { timeline: savingsTimeline, totalTarget: totalSavingsTarget, totalCurrent: totalSavingsCurrent },
      financialHealth: healthScore,
      filterApplied: { startDate, endDate, year: filterYear },
    }, 'Analytics summary retrieved successfully')
  );
});

/**
 * Financial Health Score calculator (0-100)
 */
function calculateHealthScore(monthlyIncome, monthlyExpense) {
  if (monthlyIncome <= 0) {
    return { score: 0, rating: 'Needs Attention', color: '#EF4444', tips: ['Log your monthly income to activate Financial Health Score.'] };
  }

  const net = monthlyIncome - monthlyExpense;
  const savingsRate = Math.max(0, net / monthlyIncome);
  const expenseRatio = monthlyExpense / monthlyIncome;

  const savingsRateScore = Math.min(35, Math.round((savingsRate / 0.20) * 35));
  let expenseRatioScore = 0;
  if (expenseRatio <= 0.50) expenseRatioScore = 35;
  else if (expenseRatio < 1.0) expenseRatioScore = Math.round(((1 - expenseRatio) / 0.50) * 35);

  const goalScore = Math.min(15, net > 0 ? 15 : 0);
  const stabilityScore = net >= monthlyIncome * 0.1 ? 15 : net > 0 ? 10 : 0;

  const score = Math.min(100, Math.max(0, savingsRateScore + expenseRatioScore + goalScore + stabilityScore));

  let rating, color;
  if (score >= 80) { rating = 'Excellent'; color = '#10B981'; }
  else if (score >= 60) { rating = 'Good'; color = '#3B82F6'; }
  else if (score >= 40) { rating = 'Fair'; color = '#F59E0B'; }
  else { rating = 'Needs Attention'; color = '#EF4444'; }

  const tips = [];
  if (savingsRate < 0.1) tips.push('Aim to save at least 10% of your monthly income.');
  if (expenseRatio > 0.8) tips.push('Your expenses exceed 80% of income — look for areas to cut.');
  if (score >= 70) tips.push('Great financial discipline! Consider increasing investment allocations.');
  if (tips.length === 0) tips.push('Keep tracking your finances consistently.');

  return { score, rating, color, savingsRate: Math.round(savingsRate * 100), expenseRatio: Math.round(expenseRatio * 100), tips };
}

/**
 * @desc    Export transactions as CSV
 * @route   GET /api/v1/analytics/export/csv
 * @access  Private
 */
export const exportCSV = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(new Date().getFullYear(), 0, 1);
  const endDate = req.query.endDate ? new Date(new Date(req.query.endDate).setHours(23, 59, 59, 999)) : new Date();

  const transactions = await Transaction.find({
    user: userId,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: -1 });

  // Build CSV
  const header = 'Date,Type,Category,Description,Amount\n';
  const rows = transactions.map((t) =>
    `"${new Date(t.date).toISOString().split('T')[0]}","${t.type}","${t.category}","${(t.description || '').replace(/"/g, '""')}",${t.amount}`
  ).join('\n');

  const csv = header + rows;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=myfinance_transactions_${Date.now()}.csv`);
  return res.status(200).send(csv);
});

/**
 * @desc    Export transactions as Excel (XLSX via simple XML SpreadsheetML)
 * @route   GET /api/v1/analytics/export/excel
 * @access  Private
 */
export const exportExcel = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(new Date().getFullYear(), 0, 1);
  const endDate = req.query.endDate ? new Date(new Date(req.query.endDate).setHours(23, 59, 59, 999)) : new Date();

  const transactions = await Transaction.find({
    user: userId,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: -1 });

  // Build XML SpreadsheetML (opens natively in Excel)
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Transactions">
<Table>
<Row>
  <Cell><Data ss:Type="String">Date</Data></Cell>
  <Cell><Data ss:Type="String">Type</Data></Cell>
  <Cell><Data ss:Type="String">Category</Data></Cell>
  <Cell><Data ss:Type="String">Description</Data></Cell>
  <Cell><Data ss:Type="String">Amount</Data></Cell>
</Row>`;

  transactions.forEach((t) => {
    const d = new Date(t.date).toISOString().split('T')[0];
    const desc = (t.description || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    xml += `
<Row>
  <Cell><Data ss:Type="String">${d}</Data></Cell>
  <Cell><Data ss:Type="String">${t.type}</Data></Cell>
  <Cell><Data ss:Type="String">${t.category}</Data></Cell>
  <Cell><Data ss:Type="String">${desc}</Data></Cell>
  <Cell><Data ss:Type="Number">${t.amount}</Data></Cell>
</Row>`;
  });

  xml += `
</Table>
</Worksheet>
</Workbook>`;

  res.setHeader('Content-Type', 'application/vnd.ms-excel');
  res.setHeader('Content-Disposition', `attachment; filename=myfinance_transactions_${Date.now()}.xls`);
  return res.status(200).send(xml);
});

/**
 * @desc    Export summary report as PDF (simple HTML-based PDF)
 * @route   GET /api/v1/analytics/export/pdf
 * @access  Private
 */
export const exportPDF = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(new Date().getFullYear(), 0, 1);
  const endDate = req.query.endDate ? new Date(new Date(req.query.endDate).setHours(23, 59, 59, 999)) : new Date();

  const [incomeAgg, expenseAgg] = await Promise.all([
    Income.aggregate([
      { $match: { user: userId, date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Expense.aggregate([
      { $match: { user: userId, date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
  ]);

  const totalIncome = incomeAgg[0]?.total || 0;
  const totalExpense = expenseAgg[0]?.total || 0;

  const categoryBreakdown = await Expense.aggregate([
    { $match: { user: userId, date: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
    { $sort: { total: -1 } },
  ]);

  const recentTransactions = await Transaction.find({
    user: userId,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: -1 }).limit(20);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>MyFinance Report</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1e293b; }
    h1 { color: #0f172a; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
    h2 { color: #334155; margin-top: 30px; }
    .meta { color: #64748b; margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
    th { background: #f1f5f9; font-weight: 600; }
    .summary-grid { display: flex; gap: 20px; margin: 20px 0; }
    .summary-box { flex: 1; padding: 20px; border-radius: 10px; background: #f8fafc; border: 1px solid #e2e8f0; }
    .summary-box h3 { margin: 0 0 5px 0; color: #64748b; font-size: 14px; text-transform: uppercase; }
    .summary-box .val { font-size: 28px; font-weight: 700; }
    .income { color: #10b981; }
    .expense { color: #ef4444; }
    .net { color: #3b82f6; }
  </style>
</head>
<body>
  <h1>💎 MyFinance Financial Report</h1>
  <p class="meta">Period: ${startDate.toLocaleDateString()} — ${endDate.toLocaleDateString()} | Generated: ${new Date().toLocaleString()}</p>

  <div class="summary-grid">
    <div class="summary-box"><h3>Total Income</h3><div class="val income">$${totalIncome.toLocaleString()}</div></div>
    <div class="summary-box"><h3>Total Expenses</h3><div class="val expense">$${totalExpense.toLocaleString()}</div></div>
    <div class="summary-box"><h3>Net Savings</h3><div class="val net">$${(totalIncome - totalExpense).toLocaleString()}</div></div>
  </div>

  <h2>Expense Categories</h2>
  <table>
    <tr><th>Category</th><th>Amount</th></tr>
    ${categoryBreakdown.map((c) => `<tr><td>${c._id}</td><td>$${c.total.toLocaleString()}</td></tr>`).join('')}
  </table>

  <h2>Recent Transactions (up to 20)</h2>
  <table>
    <tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th>Amount</th></tr>
    ${recentTransactions.map((t) =>
      `<tr><td>${new Date(t.date).toLocaleDateString()}</td><td>${t.type}</td><td>${t.category}</td><td>${t.description || '-'}</td><td>$${t.amount.toLocaleString()}</td></tr>`
    ).join('')}
  </table>

  <p style="margin-top:40px; color:#94a3b8; font-size:12px;">This report was automatically generated by MyFinance.</p>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Disposition', `attachment; filename=myfinance_report_${Date.now()}.html`);
  return res.status(200).send(html);
});
