import React from 'react';

const CATEGORY_COLORS = {
  Salary: '#10B981',      // Emerald
  Freelance: '#3B82F6',   // Blue
  Investments: '#8B5CF6', // Purple
  Business: '#F59E0B',    // Amber
  Rental: '#EC4899',       // Pink
  'Side Hustle': '#6366F1',// Indigo
  Gift: '#14B8A6',        // Teal
  Other: '#64748B',       // Slate
};

export const IncomeCharts = ({ reportData, currencySymbol = '$' }) => {
  if (!reportData) return null;

  const { categoryStats = [], monthlyTrend = [] } = reportData;

  // 1. Donut Chart SVG Calculations
  const total = categoryStats.reduce((sum, item) => sum + item.total, 0);
  const radius = 65;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;

  // 2. Bar Chart Max Value
  const maxTrendTotal = Math.max(...monthlyTrend.map((m) => m.total), 1);

  return (
    <div className="income-charts-grid">

      {/* CHART 1: Category Breakdown Donut */}
      <div className="chart-card-glass">
        <h4 className="chart-title">Income Distribution by Category</h4>
        {categoryStats.length === 0 ? (
          <div className="chart-empty-state">No income records for current month</div>
        ) : (
          <div className="donut-chart-container">
            <svg className="donut-svg" viewBox="0 0 160 160">
              <circle
                className="donut-bg"
                cx="80"
                cy="80"
                r={radius}
                strokeWidth="18"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
              />
              {categoryStats.map((cat, idx) => {
                const percent = total > 0 ? cat.total / total : 0;
                const strokeDasharray = `${percent * circumference} ${circumference}`;
                const strokeDashoffset = -cumulativePercent * circumference;
                cumulativePercent += percent;
                const strokeColor = CATEGORY_COLORS[cat.category] || '#6366F1';

                return (
                  <circle
                    key={idx}
                    cx="80"
                    cy="80"
                    r={radius}
                    strokeWidth="18"
                    fill="none"
                    stroke={strokeColor}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    transform="rotate(-90 80 80)"
                  />
                );
              })}
            </svg>
            <div className="donut-center-text">
              <span className="donut-total-val">{currencySymbol}{total.toLocaleString()}</span>
              <span className="donut-total-lbl">Total Income</span>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="chart-legend-list">
          {categoryStats.map((cat, idx) => (
            <div key={idx} className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: CATEGORY_COLORS[cat.category] || '#6366F1' }}></span>
              <span className="legend-label">{cat.category}</span>
              <span className="legend-pct">{cat.percentage}%</span>
              <strong className="legend-val">{currencySymbol}{cat.total.toLocaleString()}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* CHART 2: 6-Month Income Trend Bar Chart */}
      <div className="chart-card-glass">
        <h4 className="chart-title">6-Month Income Trend</h4>
        {monthlyTrend.length === 0 ? (
          <div className="chart-empty-state">No trend history available</div>
        ) : (
          <div className="bar-chart-container">
            <div className="bars-flex-wrapper">
              {monthlyTrend.map((m, idx) => {
                const barHeightPct = Math.max(8, (m.total / maxTrendTotal) * 100);
                return (
                  <div key={idx} className="bar-column">
                    <div className="bar-val-tooltip">{currencySymbol}{m.total.toLocaleString()}</div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ height: `${barHeightPct}%`, backgroundColor: '#10B981' }}
                      ></div>
                    </div>
                    <span className="bar-month-lbl">{m.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default IncomeCharts;
