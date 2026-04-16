import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import DashboardLayout from '../components/DashboardLayout';
import '../grading.css';

const scoreColor = (s) => s >= 90 ? '#10b981' : s >= 80 ? '#3b82f6' : s >= 70 ? '#f59e0b' : '#ef4444';
const gradeLabel = (s) => s >= 90 ? 'A' : s >= 80 ? 'B' : s >= 70 ? 'C' : s >= 60 ? 'D' : 'F';

// ── Create Bulk Assignment Modal ───────────────────────────────────────────────────
const CreateAssignmentModal = ({ students, onClose, onSaved }) => {
  const [title, setTitle] = useState('');
  const [rubric, setRubric] = useState('');
  const [entries, setEntries] = useState([{ id: Date.now(), student_id: '', submission: '', grading: false, result: null, error: null, saved: false }]);
  const [savingAll, setSavingAll] = useState(false);
  const [globalError, setGlobalError] = useState(null);

  const fileInputRef = useRef(null);
  const [activeUploadId, setActiveUploadId] = useState(null);

  const addEntry = () => {
    setEntries([...entries, { id: Date.now(), student_id: '', submission: '', grading: false, result: null, error: null, saved: false }]);
  };

  const removeEntry = (id) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const updateEntry = (id, field, value) => {
    setEntries(entries.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const triggerUpload = (id) => {
    setActiveUploadId(id);
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !activeUploadId) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      setEntries(entries.map(ent => ent.id === activeUploadId ? { ...ent, submission: (ent.submission ? ent.submission + '\n\n' : '') + text } : ent));
      setActiveUploadId(null);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAutoGrade = async (entry) => {
    if (!title || !entry.submission) {
      updateEntry(entry.id, 'error', 'Assignment title and submission text are required.');
      return;
    }
    updateEntry(entry.id, 'error', null);
    updateEntry(entry.id, 'grading', true);
    
    try {
      const res = await fetch('http://localhost:3000/api/ai/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, submission: entry.submission, rubric }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        updateEntry(entry.id, 'error', data.error || 'Failed to auto-grade.');
      } else {
        updateEntry(entry.id, 'result', data);
      }
    } catch {
      updateEntry(entry.id, 'error', 'Could not reach the AI server.');
    } finally {
      updateEntry(entry.id, 'grading', false);
    }
  };

  const handleSaveAll = async () => {
    if (!title) { setGlobalError('Assignment title is required.'); return; }
    setGlobalError(null);
    setSavingAll(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setGlobalError('Not signed in.'); setSavingAll(false); return; }

    const records = entries.map(ent => ({
      teacher_id: session.user.id,
      student_id: ent.student_id || null,
      title: title,
      submission_text: ent.submission || null,
      score: ent.result?.score ?? null,
      ai_feedback: ent.result?.feedback ?? null,
      graded_at: ent.result?.score != null ? new Date().toISOString() : null,
    }));

    const { error: dbErr } = await supabase.from('assignments').insert(records);

    setSavingAll(false);
    if (dbErr) { setGlobalError(dbErr.message); return; }
    onSaved();
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--overlay, rgba(0,0,0,0.7))', backdropFilter:'blur(6px)', padding:'1rem' }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, width:'100%', maxWidth:700, maxHeight:'90vh', overflowY:'auto', padding:'2rem', boxShadow:'0 32px 80px rgba(0,0,0,0.5)' }}>
        
        {/* Hidden File Input */}
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept=".txt,.md,.js,.json,.html,.css,.csv" />

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
          <div>
            <h2 style={{ color:'var(--text-primary)', fontWeight:800, fontSize:'1.25rem', margin:0 }}>✦ Auto-Grade Assignments</h2>
            <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem', margin:'4px 0 0' }}>Add submissions for one or more students to grade them separately.</p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-secondary)', fontSize:'1.25rem' }}>✕</button>
        </div>

        {globalError && <div style={{ padding:'10px 14px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, color:'#ef4444', marginBottom:'1rem', fontSize:'0.875rem' }}>{globalError}</div>}

        <div style={{ display:'grid', gap:'1rem', marginBottom:'1.5rem' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            <div className="form-group">
              <label className="form-label">Assignment Title <span style={{ color:'#ef4444' }}>*</span></label>
              <input className="form-input" type="text" placeholder="e.g. Chapter 5 Essay" value={title} onChange={e => setTitle(e.target.value)} style={{ padding:'10px 14px' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Rubric (optional)</label>
              <input className="form-input" type="text" placeholder="e.g. 10 pts for accuracy" value={rubric} onChange={e => setRubric(e.target.value)} style={{ padding:'10px 14px' }} />
            </div>
          </div>
        </div>

        <div style={{ paddingBottom:'1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--card-bg-10, rgba(255,255,255,0.1))', paddingBottom: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>Student Submissions</h3>
            <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={addEntry}>+ Add Student</button>
          </div>

          {entries.map((entry, index) => (
            <div key={entry.id} style={{ background:'var(--card-bg-2, rgba(255,255,255,0.02))', border:'1px solid var(--border)', borderRadius:12, padding:'1rem', marginBottom:'1rem' }}>
              <div style={{ display:'flex', gap:'1rem', marginBottom:'0.75rem', flexWrap:'wrap' }}>
                <div style={{ flex:1, minWidth:200 }}>
                  <select className="form-input" value={entry.student_id} onChange={e => updateEntry(entry.id, 'student_id', e.target.value)} style={{ padding:'8px 12px' }}>
                    <option value="">— Select a student —</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                  </select>
                </div>
                {entries.length > 1 && (
                  <button className="btn-secondary" style={{ padding: '8px 12px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }} onClick={() => removeEntry(entry.id)}>Remove</button>
                )}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Submission Text</div>
                <button 
                  className="ai-action-btn" 
                  style={{ background: 'var(--card-bg-6, rgba(255,255,255,0.06))', border: '1px solid var(--border)', padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => triggerUpload(entry.id)}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                  Attach File
                </button>
              </div>
              <textarea className="form-input" placeholder="Paste student answer..." value={entry.submission} onChange={e => updateEntry(entry.id, 'submission', e.target.value)}
                style={{ padding:'10px 14px', minHeight:80, resize:'vertical', lineHeight:1.6, marginBottom:'0.75rem' }} />

              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <button 
                  className="btn-primary" 
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }} 
                  onClick={() => handleAutoGrade(entry)} disabled={entry.grading || !title || !entry.submission}
                >
                  {entry.grading ? 'Grading...' : '✦ Auto-Grade Separately'}
                </button>
              </div>

              {entry.error && <div style={{ marginTop: '0.5rem', color: '#ef4444', fontSize: '0.8rem' }}>{entry.error}</div>}
              
              {entry.result && (
                <div style={{ marginTop:'1rem', padding:'1rem', background:'rgba(139,92,246,0.08)', border:'1px solid rgba(139,92,246,0.2)', borderRadius:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'0.5rem' }}>
                    <div style={{ fontSize:'1.75rem', fontWeight:900, color: scoreColor(entry.result.score), lineHeight:1 }}>{entry.result.score}%</div>
                    <div style={{ flex:1, height:6, background:'var(--card-bg-10, rgba(255,255,255,0.1))', borderRadius:99 }}>
                      <div style={{ height:'100%', width:`${entry.result.score}%`, background: scoreColor(entry.result.score), borderRadius:99 }}></div>
                    </div>
                  </div>
                  <div style={{ fontSize:'0.75rem', fontWeight:700, color:'#a78bfa', marginBottom:4 }}>✦ AI Feedback</div>
                  <div style={{ color:'var(--text-primary)', fontSize:'0.85rem', lineHeight:1.5 }}>{entry.result.feedback}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
          <button onClick={onClose} className="btn-secondary" style={{ padding:'10px 20px' }}>Cancel</button>
          <button onClick={handleSaveAll} className="btn-primary" style={{ padding:'10px 24px', background: 'var(--grad-primary)', border: 'none' }} disabled={savingAll || !title}>
            {savingAll ? 'Saving All…' : '✓ Save All Assignments'}
          </button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
};

// ── Assignment Review Modal ───────────────────────────────────────────────────
const ReviewModal = ({ assignment, onClose, onDeleted, onUpdated }) => {
  const [submission, setSubmission] = useState(assignment.submission_text || '');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const handleDelete = async () => {
    if (!window.confirm('Delete this assignment?')) return;
    await supabase.from('assignments').delete().eq('id', assignment.id);
    onDeleted();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setSubmission(prev => (prev ? prev + '\n\n' : '') + evt.target.result);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveSubmission = async () => {
    setSaving(true);
    const { error } = await supabase.from('assignments').update({ submission_text: submission }).eq('id', assignment.id);
    setSaving(false);
    if (!error && onUpdated) onUpdated();
  };

  const score = assignment.score;
  const studentName = assignment.students
    ? `${assignment.students.first_name} ${assignment.students.last_name}`
    : 'No student assigned';

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--overlay, rgba(0,0,0,0.7))', backdropFilter:'blur(6px)', padding:'1rem' }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, width:'100%', maxWidth:560, maxHeight:'90vh', overflowY:'auto', padding:'2rem', boxShadow:'0 32px 80px rgba(0,0,0,0.5)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem' }}>
          <div>
            <h2 style={{ color:'var(--text-primary)', fontWeight:800, fontSize:'1.25rem', margin:0 }}>{assignment.title}</h2>
            <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem', margin:'4px 0 0' }}>👤 {studentName}</p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-secondary)', fontSize:'1.25rem', marginLeft:12 }}>✕</button>
        </div>

        {score != null && (
          <div style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'1rem 1.25rem', background:'rgba(139,92,246,0.08)', border:'1px solid rgba(139,92,246,0.25)', borderRadius:12, marginBottom:'1.25rem' }}>
            <div style={{ textAlign:'center', minWidth:60 }}>
              <div style={{ fontSize:'2rem', fontWeight:900, color: scoreColor(score), lineHeight:1 }}>{score}%</div>
              <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)' }}>{gradeLabel(score)}</div>
            </div>
            <div style={{ flex:1, height:8, background:'var(--card-bg-10, rgba(255,255,255,0.1))', borderRadius:99, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${score}%`, background: scoreColor(score), borderRadius:99 }}></div>
            </div>
          </div>
        )}

        {assignment.ai_feedback && (
          <div style={{ marginBottom:'1.25rem' }}>
            <div style={{ fontSize:'0.75rem', fontWeight:700, color:'#a78bfa', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>✦ AI Feedback</div>
            <div style={{ color:'var(--text-primary)', fontSize:'0.875rem', lineHeight:1.7, padding:'12px 16px', background:'var(--card-bg-4, rgba(255,255,255,0.04))', borderRadius:10, border:'1px solid var(--border)' }}>
              {assignment.ai_feedback}
            </div>
          </div>
        )}

        <div style={{ marginBottom:'1.25rem' }}>
          {assignment.content && (
            <div style={{ marginBottom:'1.25rem' }}>
              <div style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Assignment Questions</div>
              
              {assignment.content.isManual ? (
                <div style={{ padding: '1rem 1.25rem', background: 'var(--card-bg-2, rgba(255,255,255,0.02))', borderRadius: 10, border: '1px solid var(--card-bg-8, rgba(255,255,255,0.08))' }}>
                  <div style={{ color: 'var(--text-primary)', fontSize: '0.875rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{assignment.content.text}</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {assignment.content.instructions && (
                    <div style={{ padding: '0.75rem 1rem', background: 'rgba(139,92,246,0.06)', borderRadius: 10, border: '1px solid rgba(139,92,246,0.2)' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Instructions</div>
                      <div style={{ color: 'var(--text-primary)', fontSize: '0.85rem', lineHeight: 1.6 }}>{assignment.content.instructions}</div>
                    </div>
                  )}
                  {assignment.content.questions && assignment.content.questions.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {assignment.content.questions.map((q, i) => (
                        <div key={i} style={{ padding: '10px 14px', background: 'var(--card-bg-2, rgba(255,255,255,0.02))', borderRadius: 8, border: '1px solid var(--card-bg-8, rgba(255,255,255,0.08))' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{i + 1}. {q.question}</div>
                          {q.options && q.options.length > 0 && (
                            <ul style={{ margin: '4px 0 0 0', paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                              {q.options.map((opt, j) => <li key={j}>{opt}</li>)}
                            </ul>
                          )}
                          <div style={{ marginTop: 6, fontSize: '0.75rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', display: 'inline-block', padding: '2px 8px', borderRadius: '4px' }}>
                            Answer: {q.answer}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <div style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Student Submission / Answers</div>
            <button 
              className="ai-action-btn" 
              style={{ background: 'var(--card-bg-6, rgba(255,255,255,0.06))', border: '1px solid var(--border)', padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => fileRef.current?.click()}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
              </svg>
              Attach File
            </button>
            <input type="file" ref={fileRef} onChange={handleFileUpload} style={{ display: 'none' }} accept=".txt,.md,.js,.json,.html,.css,.csv" />
          </div>
          <textarea 
            style={{ width:'100%', color:'var(--text-primary)', fontSize:'0.875rem', lineHeight:1.7, padding:'12px 16px', background:'var(--card-bg-3, rgba(255,255,255,0.03))', borderRadius:10, border:'1px solid var(--border)', minHeight:120, resize:'vertical', fontFamily:'inherit' }}
            value={submission}
            onChange={(e) => setSubmission(e.target.value)}
            placeholder="Manually write the answers here or attach a file..."
          />
          {submission !== (assignment.submission_text || '') && (
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:8 }}>
              <button onClick={handleSaveSubmission} className="btn-primary" style={{ padding:'6px 14px', fontSize:'0.8125rem', border:'none', cursor:'pointer' }}>
                {saving ? 'Saving...' : 'Save Answers'}
              </button>
            </div>
          )}
        </div>

        <div style={{ display:'flex', gap:'0.75rem', justifyContent:'space-between' }}>
          <button onClick={handleDelete} style={{ padding:'10px 16px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, color:'#ef4444', cursor:'pointer', fontSize:'0.875rem' }}>🗑 Delete</button>
          <button onClick={onClose} className="btn-primary" style={{ padding:'10px 24px' }}>Close</button>
        </div>
      </div>
    </div>
  );
};

// ── Main Grading Page ─────────────────────────────────────────────────────────
const Grading = () => {
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [reviewItem, setReviewItem] = useState(null);
  const [gradingRowId, setGradingRowId] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const [asgn, studs] = await Promise.all([
      supabase.from('assignments').select('*, students(first_name, last_name)').eq('teacher_id', session.user.id).order('created_at', { ascending: false }),
      supabase.from('students').select('id, first_name, last_name').eq('teacher_id', session.user.id).order('last_name'),
    ]);
    setAssignments(asgn.data || []);
    setStudents(studs.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const refresh = () => { setShowCreate(false); setReviewItem(null); fetchAll(); };

  const handleRowAutoGrade = async (assignment) => {
    if (!assignment.submission_text) {
      alert("This assignment doesn't have a submission text to grade.");
      return;
    }
    
    setGradingRowId(assignment.id);
    try {
      const res = await fetch('http://localhost:3000/api/ai/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: assignment.title, 
          submission: assignment.submission_text, 
          rubric: '' 
        }),
      });
      const data = await res.json();
      
      if (!res.ok || data.error) {
        alert(data.error || 'Failed to auto-grade. Please try again.');
        return;
      }

      const { error: dbErr } = await supabase.from('assignments')
        .update({
          score: data.score,
          ai_feedback: data.feedback,
          graded_at: new Date().toISOString()
        })
        .eq('id', assignment.id);

      if (dbErr) {
        alert(dbErr.message);
        return;
      }
      
      refresh();
    } catch {
      alert('Could not reach the AI server. Make sure the backend is running.');
    } finally {
      setGradingRowId(null);
    }
  };

  const formatDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <DashboardLayout pageTitle="Grading" pageSubtitle="Review and manage AI-assisted grading for your class.">
      {showCreate && <CreateAssignmentModal students={students} onClose={() => setShowCreate(false)} onSaved={refresh} />}
      {reviewItem && <ReviewModal assignment={reviewItem} onClose={() => setReviewItem(null)} onDeleted={refresh} onUpdated={refresh} />}

      {/* Action Bar */}
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'1.5rem', gap:'0.75rem' }}>
        <button className="btn-primary dash-btn" style={{ display:'inline-flex', alignItems:'center', gap:6 }} onClick={() => setShowCreate(true)}>
          <span>✦</span> Auto-Grade with AI
        </button>
        <button className="btn-secondary dash-btn" onClick={() => setShowCreate(true)}>+ New Assignment</button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign:'center', color:'var(--text-secondary)', padding:'3rem' }}>Loading assignments…</div>
      ) : assignments.length === 0 ? (
        <div className="dash-card" style={{ textAlign:'center', padding:'3rem 2rem' }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>✅</div>
          <h3 style={{ color:'var(--text-primary)', marginBottom:'0.5rem' }}>No assignments yet</h3>
          <p style={{ color:'var(--text-secondary)', marginBottom:'1.5rem', maxWidth:360, margin:'0 auto 1.5rem' }}>
            Create an assignment, paste a student's submission, and let AI provide feedback and a score.
          </p>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>✦ Auto-Grade with AI</button>
        </div>
      ) : (
        <div style={{ display:'grid', gap:'1rem' }}>
          {assignments.map(a => {
            const studentName = a.students ? `${a.students.first_name} ${a.students.last_name}` : null;
            return (
              <div key={a.id} className="dash-card" style={{ padding:'1.25rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'1rem' }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                    <span style={{ fontWeight:700, color:'var(--text-primary)', fontSize:'1rem' }}>{a.title}</span>
                    {a.ai_feedback && <span style={{ fontSize:'0.7rem', padding:'2px 8px', borderRadius:20, background:'rgba(139,92,246,0.15)', color:'#a78bfa', fontWeight:600 }}>✦ AI Graded</span>}
                  </div>
                  <div style={{ fontSize:'0.875rem', color:'var(--text-secondary)', display:'flex', gap:'1rem', flexWrap:'wrap' }}>
                    {studentName && <span>👤 {studentName}</span>}
                    <span>📅 {formatDate(a.created_at)}</span>
                  </div>
                  {a.ai_feedback && (
                    <div style={{ fontSize:'0.8125rem', color:'#a78bfa', marginTop:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:400 }}>
                      ✦ {a.ai_feedback.slice(0, 100)}{a.ai_feedback.length > 100 ? '…' : ''}
                    </div>
                  )}
                </div>
                <div style={{ textAlign:'right', flexShrink:0, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
                  {a.score != null && (
                    <div style={{ fontSize:'1.75rem', fontWeight:900, color: scoreColor(a.score), lineHeight:1 }}>{a.score}%</div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                    <button 
                      className="ai-action-btn" 
                      onClick={() => handleRowAutoGrade(a)} 
                      disabled={gradingRowId === a.id || !a.submission_text}
                      title={!a.submission_text ? "No submission text to grade" : "Auto-grade this submission"}
                      style={{ opacity: !a.submission_text ? 0.5 : 1 }}
                    >
                      {gradingRowId === a.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ display:'inline-block', width:12, height:12, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}></span> Grading...
                        </div>
                      ) : '✦ Auto-Grade'}
                    </button>
                    <button className="ai-action-btn" onClick={() => setReviewItem(a)}>Review →</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Grading;
