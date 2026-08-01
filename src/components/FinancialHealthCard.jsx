import React from 'react';

export const FinancialHealthCard = ({ healthData }) => {
  if (!healthData) return null;

  const { score, rating, color, breakdown, metrics, tips } = healthData;

  // SVG Gauge calculations
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="health-card-glass">
      <div className="health-card-header">
        <div>
          <h3 className="health-card-title">Financial Health Score</h3>
          <p className="health-card-subtitle">Real-time evaluation based on cash flow & savings goals</p>
        </div>
        <span className="health-rating-badge" style={{ backgroundColor: `${color}20`, color, borderColor: `${color}40` }}>
          {rating}
        </span>
      </div>

      <div className="health-card-body">
        {/* Circular SVG Score Gauge */}
        <div className="gauge-container">
          <svg className="gauge-svg" viewBox="0 0 180 180">
            <circle
              className="gauge-bg"
              cx="90"
              cy="90"
              r={radius}
              strokeWidth="14"
            />
            <circle
              className="gauge-progress"
              cx="90"
              cy="90"
              r={radius}
              strokeWidth="14"
              stroke={color}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 90 90)"
            />
          </svg>
          <div className="gauge-center-text">
            <span className="score-number" style={{ color }}>{score}</span>
            <span className="score-max">/ 100</span>
          </div>
        </div>

        {/* Breakdown Progress Bars */}
        <div className="health-breakdown-list">
          <div className="breakdown-item">
            <div className="breakdown-label-row">
              <span>Savings Rate Benchmark (20% Target)</span>
              <strong>{breakdown.savingsRateScore} / 35 pts</strong>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${(breakdown.savingsRateScore / 35) * 100}%`, backgroundColor: '#10B981' }}
              ></div>
            </div>
            <small className="breakdown-detail">Current Savings Rate: {metrics?.savingsRatePct || 0}%</small>
          </div>

          <div className="breakdown-item">
            <div className="breakdown-label-row">
              <span>Expense Control Ratio (&lt;50% Ideal)</span>
              <strong>{breakdown.expenseRatioScore} / 35 pts</strong>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${(breakdown.expenseRatioScore / 35) * 100}%`, backgroundColor: '#3B82F6' }}
              ></div>
            </div>
            <small className="breakdown-detail">Current Expense Ratio: {metrics?.expenseRatioPct || 0}% of income</small>
          </div>

          <div className="breakdown-item">
            <div className="breakdown-label-row">
              <span>Savings Target Progress</span>
              <strong>{breakdown.goalProgressScore} / 15 pts</strong>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${(breakdown.goalProgressScore / 15) * 100}%`, backgroundColor: '#8B5CF6' }}
              ></div>
            </div>
          </div>

          <div className="breakdown-item">
            <div className="breakdown-label-row">
              <span>Financial Stability & Buffer</span>
              <strong>{breakdown.stabilityScore} / 15 pts</strong>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${(breakdown.stabilityScore / 15) * 100}%`, backgroundColor: '#F59E0B' }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Tips Section */}
      {tips && tips.length > 0 && (
        <div className="health-tips-box">
          <h4 className="tips-title">💡 Personalized Recommendations</h4>
          <ul className="tips-list">
            {tips.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FinancialHealthCard;
