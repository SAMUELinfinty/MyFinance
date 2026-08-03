import React from 'react';

const CATEGORY_COLORS = {
  Housing: '#3B82F6',        // Blue
  'Food & Dining': '#F59E0B', // Amber
  Transportation: '#10B981', // Emerald
  Healthcare: '#EF4444',     // Red
  Shopping: '#EC4899',       // Pink
  Entertainment: '#8B5CF6',  // Purple
  Utilities: '#06B6D4',      // Cyan
  Education: '#6366F1',      // Indigo
  Travel: '#14B8A6',         // Teal
  Insurance: '#F97316',      // Orange
  'Personal Care': '#D946EF', // Magenta
  Subscriptions: '#84CC16',  // Lime
  'Debt Payment': '#64748B',  // Slate
  'Savings Transfer': '#059669', // Emerald dark
  Other: '#475569',          // Slate dark
};

export const BudgetCharts = ({ categoryProgress = [], historyData = [], currencySymbol = '$' }) => {
  // 1. History Trend Chart Max Value
  const maxVal = Math.max(
    ...historyData.map((h) => Math.max(h.budgetLimit, h.actualSpent)),
    100
  );

  return (
    <div className="income-charts-grid">
      {/* CHART 1: Category Budget vs Actuals */}
      <div className="chart-card-glass">
        <h4 className="chart-title">Category Spent vs Limit</h4>
        {categoryProgress.length === 0 ? (
          <div className="chart-empty-state">No category budgets or expenses this month</div>
        ) : (
          <div className="chart-legend-list" style={{ marginTop: 0, gap: '1rem' }}>
            {categoryProgress.map((item, idx) => {
              const color = CATEGORY_COLORS[item.category] || '#6366F1';
              const progressPct = Math.min(100, item.percentage);
              const barColor = item.alertTriggered ? '#EF4444' : progressPct > 90 ? '#F59E0B' : color;

              return (
                <div key={idx} className="category-chart-row" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="legend-dot" style={{ backgroundColor: color, margin: 0 }}></span>
                      <strong>{item.category}</strong>
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                      {currencySymbol}{item.spent.toLocaleString()} / {item.limit > 0 ? `${currencySymbol}${item.limit.toLocaleString()}` : 'Unbudgeted'}
                    </span>
                  </div>
                  <div className="bar-track" style={{ height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                    <div
                      style={{
                        width: `${progressPct}%`,
                        height: '100%',
                        backgroundColor: barColor,
                        borderRadius: '4px',
                        transition: 'width 0.4s ease-in-out',
                      }}
                    ></div>
                  </div>
                  <span style={{ fontSize: '0.75rem', alignSelf: 'flex-end', color: item.alertTriggered ? '#EF4444' : 'rgba(255,255,255,0.5)' }}>
                    {item.percentage.toFixed(0)}% Utilized
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CHART 2: Budget vs Actuals Trend (6 Months) */}
      <div className="chart-card-glass">
        <h4 className="chart-title">Budget Limit vs Spending Trend</h4>
        {historyData.length === 0 ? (
          <div className="chart-empty-state">No historical data available</div>
        ) : (
          <div className="bar-chart-container" style={{ minHeight: '220px' }}>
            <div className="bars-flex-wrapper" style={{ alignItems: 'end', gap: '1.25rem' }}>
              {historyData.map((h, idx) => {
                const limitHeightPct = (h.budgetLimit / maxVal) * 100;
                const spentHeightPct = (h.actualSpent / maxVal) * 100;

                return (
                  <div key={idx} className="bar-column-dual" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ display: 'flex', gap: '4px', height: '150px', alignItems: 'end', width: '100%' }}>
                      {/* Budget Bar */}
                      <div className="bar-track" style={{ flex: 1, height: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: '3px 3px 0 0', display: 'flex', alignItems: 'end', overflow: 'visible', position: 'relative' }}>
                        <div
                          className="bar-fill-budget"
                          style={{
                            height: `${Math.max(4, limitHeightPct)}%`,
                            width: '100%',
                            background: 'linear-gradient(180deg, #3B82F6 0%, #1D4ED8 100%)',
                            borderRadius: '3px 3px 0 0',
                          }}
                          title={`Budget: ${currencySymbol}${h.budgetLimit}`}
                        ></div>
                      </div>
                      {/* Spent Bar */}
                      <div className="bar-track" style={{ flex: 1, height: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: '3px 3px 0 0', display: 'flex', alignItems: 'end', overflow: 'visible', position: 'relative' }}>
                        <div
                          className="bar-fill-spent"
                          style={{
                            height: `${Math.max(4, spentHeightPct)}%`,
                            width: '100%',
                            background: h.actualSpent > h.budgetLimit && h.budgetLimit > 0
                              ? 'linear-gradient(180deg, #EF4444 0%, #B91C1C 100%)'
                              : 'linear-gradient(180deg, #10B981 0%, #047857 100%)',
                            borderRadius: '3px 3px 0 0',
                          }}
                          title={`Spent: ${currencySymbol}${h.actualSpent}`}
                        ></div>
                      </div>
                    </div>
                    <span className="bar-month-lbl" style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>{h.label}</span>
                  </div>
                );
              })}
            </div>
            {/* History Legend */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1rem', fontSize: '0.85rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '12px', height: '12px', background: '#3B82F6', borderRadius: '2px' }}></span>
                Budget Limit
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '12px', height: '12px', background: '#10B981', borderRadius: '2px' }}></span>
                Spent (Under Limit)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '12px', height: '12px', background: '#EF4444', borderRadius: '2px' }}></span>
                Spent (Over Limit)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetCharts;
