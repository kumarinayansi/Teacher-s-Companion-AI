import DashboardLayout from '../components/DashboardLayout';
import '../analytics.css';

const barData = [
  { week: 'Week 1', score: 72, color: 'var(--accent-1)' },
  { week: 'Week 2', score: 81, color: 'var(--accent-1)' },
  { week: 'Week 3', score: 68, color: 'var(--accent-1)' },
  { week: 'Week 4', score: 89, color: '#10b981' },
  { week: 'Week 5', score: 76, color: 'var(--accent-1)' },
  { week: 'Week 6', score: 93, color: '#10b981' },
];

const Analytics = () => (
  <DashboardLayout pageTitle="Analytics" pageSubtitle="Understand class-wide performance trends and learning gaps.">
    <div style={{ display: 'grid', gap: '1.5rem' }}>

      {/* KPI Row */}
      <div className="kpi-grid">
        {[
          { label: 'Class Average', value: '79.8%', change: '+5.2% this month', icon: '📊', cls: 'kpi-icon-purple' },
          { label: 'Assignments Graded', value: '124', change: '+18 this week', icon: '✅', cls: 'kpi-icon-green' },
          { label: 'Students On Track', value: '87%', change: '+3% since last term', icon: '🎯', cls: 'kpi-icon-blue' },
          { label: 'Needs Intervention', value: '14', change: '-2 from last week', icon: '⚠️', cls: 'kpi-icon-amber' },
        ].map((kpi, i) => (
          <div key={i} className="kpi-card">
            <div className={`kpi-icon ${kpi.cls}`} style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{kpi.icon}</div>
            <div className="kpi-data">
              <div className="kpi-value">{kpi.value}</div>
              <div className="kpi-label">{kpi.label}</div>
            </div>
            <div className="kpi-change positive">{kpi.change}</div>
          </div>
        ))}
      </div>

      {/* Performance Chart */}
      <div className="chart-card chart-card-main">
        <div className="chart-card-header">
          <div>
            <h3 className="chart-title">Weekly Performance Trend</h3>
            <p className="chart-subtitle">Class average scores over the last 6 weeks</p>
          </div>
        </div>
        <div className="bar-chart">
          <div className="bar-chart-inner">
            {barData.map((bar, i) => (
              <div className="bar-group" key={i}>
                <div className="bar-wrap">
                  <div className="bar-label-top">{bar.score}%</div>
                  <div className="bar" style={{ '--h': `${bar.score}%`, '--c': bar.color }}>
                    <span className="bar-tooltip">{bar.score}% avg</span>
                  </div>
                </div>
                <div className="bar-name">{bar.week}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grade Distribution */}
      <div className="chart-card">
        <div className="chart-card-header">
          <h3 className="chart-title">Grade Distribution</h3>
          <p className="chart-subtitle">Current term breakdown</p>
        </div>
        <div className="donut-legend" style={{ padding: '1rem 0' }}>
          {[
            { label: 'A (90–100%)', count: 45, cls: 'dot-a' },
            { label: 'B (80–89%)', count: 52, cls: 'dot-b' },
            { label: 'C (70–79%)', count: 31, cls: 'dot-c' },
            { label: 'Below 70%', count: 14, cls: 'dot-d' },
          ].map((item, i) => (
            <div key={i} className="legend-item">
              <span className={`legend-dot ${item.cls}`}></span>
              <span className="legend-text">{item.label}</span>
              <span className="legend-count">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  </DashboardLayout>
);

export default Analytics;
