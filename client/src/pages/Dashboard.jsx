import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DashboardLayout from '../components/DashboardLayout';
import '../dashboard.css';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setUser(session.user);
                supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single()
                    .then(({ data }) => { if (data) setProfile(data); });
            }
        });
        const timer = setTimeout(() => setAnimate(true), 150);
        return () => clearTimeout(timer);
    }, []);

    const displayName = profile?.first_name || user?.email?.split('@')[0] || 'Teacher';

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <DashboardLayout>

        {/*  Page Header  */}
        <div className="page-header" id="page-header">
          <div className="page-header-left">
            <h1 className="page-title" id="dash-greeting">{getGreeting()}, {displayName} 👋</h1>
            <p className="page-subtitle">Here's what's happening in your classroom today.</p>
          </div>
          <div className="page-header-right">
            <Link to="/lessons" className="btn-secondary dash-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Lesson
            </Link>
            <Link to="/chat" className="btn-primary dash-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
              <span>✦</span> Ask AI
            </Link>
          </div>
        </div>

        {/*  KPI Cards  */}
        <div className="kpi-grid" id="kpi-grid">
          <div className="kpi-card" id="kpi-students">
            <div className="kpi-icon kpi-icon-purple">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="kpi-data">
              <div className="kpi-value">142</div>
              <div className="kpi-label">Total Students</div>
            </div>
            <div className="kpi-change positive">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15" /></svg>
              +12 this week
            </div>
          </div>

          <div className="kpi-card" id="kpi-lessons">
            <div className="kpi-icon kpi-icon-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <div className="kpi-data">
              <div className="kpi-value">38</div>
              <div className="kpi-label">Lessons Planned</div>
            </div>
            <div className="kpi-change positive">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15" /></svg>
              +5 this month
            </div>
          </div>

          <div className="kpi-card" id="kpi-graded">
            <div className="kpi-icon kpi-icon-green">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <div className="kpi-data">
              <div className="kpi-value">97%</div>
              <div className="kpi-label">Graded on Time</div>
            </div>
            <div className="kpi-change positive">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15" /></svg>
              AI Assisted
            </div>
          </div>

          <div className="kpi-card" id="kpi-time">
            <div className="kpi-icon kpi-icon-amber">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="kpi-data">
              <div className="kpi-value">8h</div>
              <div className="kpi-label">Time Saved This Week</div>
            </div>
            <div className="kpi-change positive">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15" /></svg>
              vs last week
            </div>
          </div>
        </div>

        {/*  Charts Row  */}
        <div className="charts-row" id="charts-row">
          <div className="chart-card chart-card-main" id="chart-performance">
            <div className="chart-card-header">
              <div>
                <h3 className="chart-title">Student Performance</h3>
                <p className="chart-subtitle">Weekly average scores — this month</p>
              </div>
              <div className="chart-controls">
                <button className="chart-ctrl active" data-period="month">Month</button>
                <button className="chart-ctrl" data-period="quarter">Quarter</button>
                <button className="chart-ctrl" data-period="year">Year</button>
              </div>
            </div>
            <div className="bar-chart" id="bar-chart">
              <div className="bar-chart-inner">
                {[{w:'72%',n:'Week 1',c:'var(--accent-1)'},{w:'81%',n:'Week 2',c:'var(--accent-1)'},{w:'68%',n:'Week 3',c:'var(--accent-1)'},{w:'89%',n:'Week 4',c:'#10b981'},{w:'76%',n:'Week 5',c:'var(--accent-1)'},{w:'93%',n:'Week 6',c:'#10b981'}].map((bar, i) => (
                  <div className="bar-group" key={i}>
                    <div className="bar-wrap">
                      <div className="bar-label-top">{bar.w}</div>
                      <div className={`bar ${animate ? 'animate' : ''}`} style={{ '--h': bar.w, '--c': bar.c }}><span className="bar-tooltip">{bar.w} avg</span></div>
                    </div>
                    <div className="bar-name">{bar.n}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="chart-card chart-card-side" id="chart-grades">
            <div className="chart-card-header">
              <div>
                <h3 className="chart-title">Grade Distribution</h3>
                <p className="chart-subtitle">Current term</p>
              </div>
            </div>
            <div className="donut-wrap">
              <svg className="donut-svg" viewBox="0 0 120 120" id="donut-svg">
                <circle className="donut-bg" cx="60" cy="60" r="45" />
                <circle className="donut-seg seg-a" cx="60" cy="60" r="45" strokeDasharray={animate ? "127 155" : "0 1000"} strokeDashoffset="0" />
                <circle className="donut-seg seg-b" cx="60" cy="60" r="45" strokeDasharray={animate ? "61 221" : "0 1000"} strokeDashoffset="-127" />
                <circle className="donut-seg seg-c" cx="60" cy="60" r="45" strokeDasharray={animate ? "39 243" : "0 1000"} strokeDashoffset="-188" />
                <circle className="donut-seg seg-d" cx="60" cy="60" r="45" strokeDasharray={animate ? "16 266" : "0 1000"} strokeDashoffset="-227" />
                <text x="60" y="55" className="donut-center-val">142</text>
                <text x="60" y="69" className="donut-center-label">students</text>
              </svg>
            </div>
            <div className="donut-legend">
              <div className="legend-item"><span className="legend-dot dot-a"></span><span className="legend-text">A (90–100%)</span><span className="legend-count">45</span></div>
              <div className="legend-item"><span className="legend-dot dot-b"></span><span className="legend-text">B (80–89%)</span><span className="legend-count">52</span></div>
              <div className="legend-item"><span className="legend-dot dot-c"></span><span className="legend-text">C (70–79%)</span><span className="legend-count">31</span></div>
              <div className="legend-item"><span className="legend-dot dot-d"></span><span className="legend-text">Below 70%</span><span className="legend-count">14</span></div>
            </div>
          </div>
        </div>

        {/*  Bottom Row  */}
        <div className="bottom-row" id="bottom-row">

          {/*  AI Suggestions  */}
          <div className="dash-card ai-card" id="ai-suggestions">
            <div className="card-header">
              <div className="card-title-group">
                <span className="card-icon-ai">✦</span>
                <h3 className="card-title">AI Suggestions</h3>
              </div>
              <span className="ai-live-badge"><span className="live-dot"></span>Live</span>
            </div>
            <div className="ai-list" id="ai-list">
              <div className="ai-item ai-item-warning" id="ai-1">
                <div className="ai-item-icon">⚠️</div>
                <div className="ai-item-content">
                  <div className="ai-item-title">3 students need support in Fractions</div>
                  <div className="ai-item-desc">Liam K., Sofia M., and James R. are scoring below 65%. Consider a targeted review session.</div>
                </div>
                <Link to="/students" className="ai-action-btn" style={{ textDecoration: 'none' }}>Review →</Link>
              </div>
              <div className="ai-item ai-item-info" id="ai-2">
                <div className="ai-item-icon">📋</div>
                <div className="ai-item-content">
                  <div className="ai-item-title">Monday's lesson plan is ready to review</div>
                  <div className="ai-item-desc">AI generated a 45-min plan on Long Division aligned to CCSS.Math.5.NBT.B.6.</div>
                </div>
                <Link to="/lessons" className="ai-action-btn" style={{ textDecoration: 'none' }}>Open →</Link>
              </div>
              <div className="ai-item ai-item-success" id="ai-3">
                <div className="ai-item-icon">🎉</div>
                <div className="ai-item-content">
                  <div className="ai-item-title">Class average up 14% this month</div>
                  <div className="ai-item-desc">Your differentiated assignments are working. Emma R. improved by 28%.</div>
                </div>
                <Link to="/analytics" className="ai-action-btn" style={{ textDecoration: 'none' }}>Details →</Link>
              </div>
              <div className="ai-item ai-item-info" id="ai-4">
                <div className="ai-item-icon">💬</div>
                <div className="ai-item-content">
                  <div className="ai-item-title">5 parent newsletters due this Friday</div>
                  <div className="ai-item-desc">AI can draft all 5 in under 30 seconds based on current progress data.</div>
                </div>
                <Link to="/chat" className="ai-action-btn" style={{ textDecoration: 'none' }}>Generate →</Link>
              </div>
            </div>
          </div>

          {/*  Right Column  */}
          <div className="right-col">
            {/*  Quick Actions  */}
            <div className="dash-card quick-actions-card" id="quick-actions">
              <div className="card-header">
                <h3 className="card-title">Quick Actions</h3>
              </div>
              <div className="quick-actions-grid">
                <Link to="/lessons" className="qa-btn" id="qa-lesson" style={{ textDecoration: 'none' }}><span className="qa-icon">📋</span><span>Generate Lesson</span></Link>
                <Link to="/grading" className="qa-btn" id="qa-grade" style={{ textDecoration: 'none' }}><span className="qa-icon">✅</span><span>Auto-Grade</span></Link>
                <Link to="/chat" className="qa-btn" id="qa-quiz" style={{ textDecoration: 'none' }}><span className="qa-icon">🧪</span><span>Create Quiz</span></Link>
                <Link to="/chat" className="qa-btn" id="qa-email" style={{ textDecoration: 'none' }}><span className="qa-icon">💬</span><span>Parent Email</span></Link>
              </div>
            </div>

            {/*  Students Table  */}
            <div className="dash-card students-card" id="students-card">
              <div className="card-header">
                <h3 className="card-title">Students at a Glance</h3>
                <Link to="/students" className="card-link">View all →</Link>
              </div>
              <div className="students-table-wrap">
                <table className="students-table" id="students-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Grade</th>
                      <th>Progress</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {img:1, name:'Emma Rodriguez', grade:'A', cls:'grade-a', w:'92%', status:'On Track', sb:'status-on-track'},
                      {img:12, name:'Liam Kowalski', grade:'C', cls:'grade-c', w:'61%', status:'Needs Help', sb:'status-needs-help', warn:true},
                      {img:5, name:'Sofia Martinez', grade:'B', cls:'grade-b', w:'78%', status:'On Track', sb:'status-on-track'},
                      {img:9, name:'James Reynolds', grade:'C', cls:'grade-c', w:'58%', status:'Needs Help', sb:'status-needs-help', warn:true},
                      {img:15, name:'Aisha Patel', grade:'A', cls:'grade-a', w:'96%', status:'Advanced', sb:'status-advanced'},
                    ].map((s, i) => (
                      <tr key={i}>
                        <td><div className="stu-name-cell"><img src={`https://i.pravatar.cc/28?img=${s.img}`} alt={s.name} className="stu-avatar" /><span>{s.name}</span></div></td>
                        <td><span className={`grade-badge ${s.cls}`}>{s.grade}</span></td>
                        <td><div className="progress-bar-wrap"><div className={`progress-bar${s.warn ? ' progress-bar-warn' : ''}`} style={{ '--w': s.w }}></div></div></td>
                        <td><span className={`status-badge ${s.sb}`}>{s.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        </DashboardLayout>
    );
};

export default Dashboard;