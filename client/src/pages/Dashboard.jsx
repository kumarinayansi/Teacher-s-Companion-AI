import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DashboardLayout from '../components/DashboardLayout';
import '../dashboard.css';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [animate, setAnimate] = useState(false);
    
    // Live Data States
    const [students, setStudents] = useState([]);
    const [lessonsCount, setLessonsCount] = useState(0);
    const [aiSuggestions, setAiSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setUser(session.user);
                fetchDashboardData(session.user.id);
            } else {
                setLoading(false);
            }
        });
        const timer = setTimeout(() => setAnimate(true), 150);
        return () => clearTimeout(timer);
    }, []);

    const fetchDashboardData = async (userId) => {
        try {
            // Profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            if (profileData) setProfile(profileData);

            // Students
            const { data: studentsData, error: studentsError } = await supabase
                .from('students')
                .select('*')
                .eq('teacher_id', userId);
            
            if (!studentsError && studentsData) {
                setStudents(studentsData);
            }

            // Lessons Count
            const { count: lessonsCount, error: lessonsError } = await supabase
                .from('lessons')
                .select('*', { count: 'exact', head: true })
                .eq('teacher_id', userId);
            
            if (!lessonsError && lessonsCount !== null) {
                setLessonsCount(lessonsCount);
            }

            // AI Suggestions
            const { data: aiData, error: aiError } = await supabase
                .from('ai_suggestions')
                .select('*')
                .eq('teacher_id', userId)
                .eq('is_read', false)
                .order('created_at', { ascending: false })
                .limit(4);

            if (!aiError && aiData) {
                setAiSuggestions(aiData);
            }

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const displayName = profile?.first_name || user?.email?.split('@')[0] || 'Teacher';

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    // Calculate derived data
    const totalStudents = students.length;
    
    let gradeA = 0, gradeB = 0, gradeC = 0, gradeD = 0;
    let totalGrade = 0;
    let gradedStudents = 0;

    students.forEach(s => {
        const grade = parseFloat(s.overall_grade);
        if (!isNaN(grade)) {
            totalGrade += grade;
            gradedStudents++;
            if (grade >= 90) gradeA++;
            else if (grade >= 80) gradeB++;
            else if (grade >= 70) gradeC++;
            else gradeD++;
        }
    });

    const averageGrade = gradedStudents > 0 ? (totalGrade / gradedStudents).toFixed(1) : 0;
    const avgGradePercent = gradedStudents > 0 ? `${averageGrade}%` : 'N/A';

    // Donut chart calculations
    const donutTotal = gradedStudents || 1; // Prevent division by zero
    const pctA = Math.round((gradeA / donutTotal) * 100) || 0;
    const pctB = Math.round((gradeB / donutTotal) * 100) || 0;
    const pctC = Math.round((gradeC / donutTotal) * 100) || 0;
    const pctD = Math.round((gradeD / donutTotal) * 100) || 0;

    // Convert percentages to stroke-dasharray (circumference is ~283 for r=45)
    // 2 * Math.PI * 45 ≈ 282.74
    const circ = 282.74;
    const lenA = (pctA / 100) * circ;
    const lenB = (pctB / 100) * circ;
    const lenC = (pctC / 100) * circ;
    const lenD = (pctD / 100) * circ;
    
    const offsetB = -lenA;
    const offsetC = offsetB - lenB;
    const offsetD = offsetC - lenC;

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
              <div className="kpi-value">{totalStudents}</div>
              <div className="kpi-label">Total Students</div>
            </div>
            <div className="kpi-change positive">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15" /></svg>
              Active
            </div>
          </div>

          <div className="kpi-card" id="kpi-lessons">
            <div className="kpi-icon kpi-icon-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <div className="kpi-data">
              <div className="kpi-value">{lessonsCount}</div>
              <div className="kpi-label">Lessons Planned</div>
            </div>
            <div className="kpi-change positive">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15" /></svg>
              Saved
            </div>
          </div>

          <div className="kpi-card" id="kpi-graded">
            <div className="kpi-icon kpi-icon-green">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <div className="kpi-data">
              <div className="kpi-value">{avgGradePercent}</div>
              <div className="kpi-label">Class Average</div>
            </div>
            <div className="kpi-change positive">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15" /></svg>
              Across Subjects
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
                <circle className="donut-seg seg-a" cx="60" cy="60" r="45" strokeDasharray={animate ? `${lenA} ${circ}` : `0 ${circ}`} strokeDashoffset="0" />
                <circle className="donut-seg seg-b" cx="60" cy="60" r="45" strokeDasharray={animate ? `${lenB} ${circ}` : `0 ${circ}`} strokeDashoffset={offsetB} />
                <circle className="donut-seg seg-c" cx="60" cy="60" r="45" strokeDasharray={animate ? `${lenC} ${circ}` : `0 ${circ}`} strokeDashoffset={offsetC} />
                <circle className="donut-seg seg-d" cx="60" cy="60" r="45" strokeDasharray={animate ? `${lenD} ${circ}` : `0 ${circ}`} strokeDashoffset={offsetD} />
                <text x="60" y="55" className="donut-center-val">{gradedStudents}</text>
                <text x="60" y="69" className="donut-center-label">students</text>
              </svg>
            </div>
            <div className="donut-legend">
              <div className="legend-item"><span className="legend-dot dot-a"></span><span className="legend-text">A (90–100%)</span><span className="legend-count">{gradeA}</span></div>
              <div className="legend-item"><span className="legend-dot dot-b"></span><span className="legend-text">B (80–89%)</span><span className="legend-count">{gradeB}</span></div>
              <div className="legend-item"><span className="legend-dot dot-c"></span><span className="legend-text">C (70–79%)</span><span className="legend-count">{gradeC}</span></div>
              <div className="legend-item"><span className="legend-dot dot-d"></span><span className="legend-text">Below 70%</span><span className="legend-count">{gradeD}</span></div>
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
              {aiSuggestions.length > 0 ? (
                aiSuggestions.map((s, idx) => {
                  let icon = '💡';
                  let itemClass = 'ai-item-info';
                  if (s.type === 'warning') { icon = '⚠️'; itemClass = 'ai-item-warning'; }
                  if (s.type === 'success') { icon = '🎉'; itemClass = 'ai-item-success'; }
                  if (s.type === 'error') { icon = '🚨'; itemClass = 'ai-item-warning'; }
                  return (
                    <div className={`ai-item ${itemClass}`} key={s.id || idx}>
                      <div className="ai-item-icon">{icon}</div>
                      <div className="ai-item-content">
                        <div className="ai-item-title">{s.title}</div>
                        <div className="ai-item-desc">{s.description}</div>
                      </div>
                      <Link to="/students" className="ai-action-btn" style={{ textDecoration: 'none' }}>Review →</Link>
                    </div>
                  );
                })
              ) : (
                <>
                  <div className="ai-item ai-item-warning" id="ai-1">
                    <div className="ai-item-icon">⚠️</div>
                    <div className="ai-item-content">
                      <div className="ai-item-title">Welcome to Teacher's Companion AI</div>
                      <div className="ai-item-desc">Add some students and start grading assignments to see intelligent AI suggestions here.</div>
                    </div>
                    <Link to="/students" className="ai-action-btn" style={{ textDecoration: 'none' }}>Add →</Link>
                  </div>
                  <div className="ai-item ai-item-info" id="ai-2">
                    <div className="ai-item-icon">📋</div>
                    <div className="ai-item-content">
                      <div className="ai-item-title">Create your first lesson plan</div>
                      <div className="ai-item-desc">Try generating a comprehensive lesson plan using AI in seconds.</div>
                    </div>
                    <Link to="/lessons" className="ai-action-btn" style={{ textDecoration: 'none' }}>Open →</Link>
                  </div>
                </>
              )}
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
                    {students.length > 0 ? students.slice(0, 5).map((s, i) => {
                      let gradeLetter = 'N/A';
                      let gradeClass = '';
                      const grade = parseFloat(s.overall_grade);
                      if (!isNaN(grade)) {
                          if (grade >= 90) { gradeLetter = 'A'; gradeClass = 'grade-a'; }
                          else if (grade >= 80) { gradeLetter = 'B'; gradeClass = 'grade-b'; }
                          else if (grade >= 70) { gradeLetter = 'C'; gradeClass = 'grade-c'; }
                          else { gradeLetter = 'D'; gradeClass = 'grade-c'; }
                      }
                      
                      let statusClass = 'status-on-track';
                      let warn = false;
                      if (s.status === 'Needs Help') { statusClass = 'status-needs-help'; warn = true; }
                      else if (s.status === 'Advanced') { statusClass = 'status-advanced'; }

                      return (
                        <tr key={s.id || i}>
                          <td><div className="stu-name-cell"><img src={s.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.first_name + ' ' + s.last_name)}&background=random`} alt={s.first_name} className="stu-avatar" /><span>{s.first_name} {s.last_name}</span></div></td>
                          <td><span className={`grade-badge ${gradeClass}`}>{gradeLetter}</span></td>
                          <td><div className="progress-bar-wrap"><div className={`progress-bar${warn ? ' progress-bar-warn' : ''}`} style={{ '--w': `${grade || 0}%` }}></div></div></td>
                          <td><span className={`status-badge ${statusClass}`}>{s.status || 'On Track'}</span></td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '1rem' }}>No students found.</td>
                      </tr>
                    )}
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