import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import DashboardLayout from '../components/DashboardLayout';

// ─── Create / Generate Modal ─────────────────────────────────────────────────
const CreateModal = ({ onClose, onSaved, initialData, students }) => {
  const [mode, setMode] = useState(initialData?.content && !initialData.content.isManual ? 'ai' : 'manual');
  const [form, setForm] = useState({
    title: initialData?.title || '',
    topic: initialData?.description || '', // We'll map description to topic/prompt
    grade: '',
    type: 'Worksheet',
    manualContent: initialData?.content?.isManual ? initialData.content.text : '',
    student_ids: initialData?.student_id ? [initialData.student_id] : [],
  });
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedAssignment, setGeneratedAssignment] = useState(initialData?.content || null);
  const [error, setError] = useState(null);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // ── Generate with AI ──
  const handleGenerate = async () => {
    if (!form.topic) { setError('Please enter a topic first.'); return; }
    setError(null);
    setGenerating(true);
    try {
      const res = await fetch('http://localhost:3000/api/ai/assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: form.topic,
          grade: form.grade || 'Grade 5',
          type: form.type,
        }),
      });
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedAssignment(data.assignmentContent);
      // Auto-fill title if empty
      if (!form.title) set('title', `${form.topic} - ${form.type}`);
    } catch (err) {
      setError(err.message || 'Could not reach the AI server.');
    } finally {
      setGenerating(false);
    }
  };

  // ── Save to Supabase ──
  const handleSave = async () => {
    if (!form.title || !form.topic) { setError('Title and Topic are required.'); return; }
    setError(null);
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError('Not signed in.'); setSaving(false); return; }

    let finalContent = generatedAssignment || null;
    if (mode === 'manual') {
      finalContent = form.manualContent ? { isManual: true, text: form.manualContent } : null;
    }

    const assignmentData = {
      teacher_id: session.user.id,
      title: form.title,
      description: form.topic,
      content: finalContent,
    };

    let dbErr;
    if (initialData?.id) {
      // Update first selected student or make it a template (null)
      const firstId = form.student_ids.length > 0 ? form.student_ids[0] : null;
      const { error } = await supabase.from('assignments').update({
        ...assignmentData,
        student_id: firstId
      }).eq('id', initialData.id);
      dbErr = error;

      // If assigned to extra students during edit, insert them as new row copies
      if (!dbErr && form.student_ids.length > 1) {
        const extraInserts = form.student_ids.slice(1).map(id => ({
          ...assignmentData,
          student_id: id
        }));
        const { error: insertErr } = await supabase.from('assignments').insert(extraInserts);
        dbErr = insertErr;
      }
    } else {
      if (form.student_ids.length > 0) {
        const inserts = form.student_ids.map(id => ({
          ...assignmentData,
          student_id: id
        }));
        const { error } = await supabase.from('assignments').insert(inserts);
        dbErr = error;
      } else {
        const { error } = await supabase.from('assignments').insert({
          ...assignmentData,
          student_id: null
        });
        dbErr = error;
      }
    }

    setSaving(false);
    if (dbErr) { setError(dbErr.message); return; }
    onSaved();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--overlay, rgba(0,0,0,0.7))', backdropFilter: 'blur(6px)', padding: '1rem',
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 20, width: '100%', maxWidth: 680,
        maxHeight: '90vh', overflowY: 'auto', padding: '2rem',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>
              {initialData ? '✦ Edit Assignment' : '✦ Create Assignment'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '4px 0 0' }}>
              Create assignment questions manually or generate via AI.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '1.25rem' }}>✕</button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {/* Toggle Mode */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--card-bg-3, rgba(255,255,255,0.03))', padding: 6, borderRadius: 12, border: '1px solid var(--border)', width: 'fit-content' }}>
          <button
            onClick={() => setMode('manual')}
            style={{
              padding: '6px 16px', borderRadius: 8, border: 'none', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
              background: mode === 'manual' ? 'var(--primary)' : 'transparent',
              color: mode === 'manual' ? '#fff' : 'var(--text-secondary)'
            }}
          >
            Manual Entry
          </button>
          <button
            onClick={() => setMode('ai')}
            style={{
              padding: '6px 16px', borderRadius: 8, border: 'none', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
              background: mode === 'ai' ? 'var(--primary)' : 'transparent',
              color: mode === 'ai' ? '#fff' : 'var(--text-secondary)'
            }}
          >
            Generate with AI
          </button>
        </div>

        {/* Form Fields */}
        <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.25rem' }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Topic / Subject <span style={{ color: '#ef4444' }}>*</span></label>
              <input className="form-input" type="text" placeholder="e.g. World War II Causes"
                value={form.topic} onChange={e => set('topic', e.target.value)}
                style={{ padding: '10px 14px', width: '100%', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Grade Level</label>
              <input className="form-input" type="text" placeholder="e.g. Grade 8"
                value={form.grade} onChange={e => set('grade', e.target.value)}
                style={{ padding: '10px 14px', width: '100%', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Assignment Title <span style={{ color: '#ef4444' }}>*</span></label>
              <input className="form-input" type="text" placeholder="e.g. Chapter 3 Review Quiz"
                value={form.title} onChange={e => set('title', e.target.value)}
                style={{ padding: '10px 14px', width: '100%', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-input" value={form.type} onChange={e => set('type', e.target.value)} style={{ padding: '10px 14px', width: '100%', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface, #13111c)', color: 'var(--text-primary)' }}>
                <option value="Worksheet">Worksheet</option>
                <option value="Quiz">Quiz</option>
                <option value="Essay Prompt">Essay Prompt</option>
                <option value="Discussion Questions">Discussion Questions</option>
              </select>
            </div>
          </div>

          {students && students.length > 0 && (
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Assign to Students (Optional)</label>
              <div style={{
                maxHeight: '130px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', background: 'rgba(0,0,0,0.1)'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <input type="checkbox" checked={form.student_ids.length === 0} onChange={() => set('student_ids', [])} style={{ accentColor: 'var(--primary)', width: 16, height: 16 }} />
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>— Keep as Template (No Student) —</span>
                </label>
                {students.map(s => (
                  <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', cursor: 'pointer' }}>
                    <input type="checkbox"
                      checked={form.student_ids.includes(s.id)}
                      onChange={(e) => {
                        let newIds = [...form.student_ids];
                        if (e.target.checked) newIds.push(s.id);
                        else newIds = newIds.filter(id => id !== s.id);
                        set('student_ids', newIds);
                      }}
                      style={{ accentColor: 'var(--primary)', width: 15, height: 15 }}
                    />
                    <span style={{ color: 'var(--text-secondary)' }}>{s.first_name} {s.last_name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {mode === 'manual' && (
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Questions / Assignment Content</label>
              <textarea className="form-input" rows={8} placeholder="Write your assignment questions here..."
                value={form.manualContent} onChange={e => set('manualContent', e.target.value)}
                style={{ padding: '10px 14px', width: '100%', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5' }} />
            </div>
          )}
        </div>

        {/* AI Generate Button */}
        {mode === 'ai' && (
          <button
            className="btn-primary"
            style={{ width: '100%', padding: '12px', marginBottom: '1.25rem', fontSize: '0.9375rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            onClick={handleGenerate}
            disabled={generating || !form.topic}
          >
            {generating ? (
              <>
                <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}></span>
                Generating Assignment…
              </>
            ) : (
              <>✦ Generate Questions with AI</>
            )}
          </button>
        )}

        {/* Generated Assignment Preview */}
        {mode === 'ai' && generatedAssignment && !generatedAssignment.isManual && (
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{
              background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.3)',
              borderRadius: 12, padding: '1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem', color: '#a78bfa', fontWeight: 700, fontSize: '0.875rem' }}>
                ✦ Preview Assignment
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Instructions</div>
                <div style={{ color: 'var(--text-primary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{generatedAssignment.instructions}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Questions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {generatedAssignment.questions && generatedAssignment.questions.map((q, i) => (
                    <div key={i} style={{ padding: '10px 14px', background: 'var(--card-bg-4, rgba(255,255,255,0.04))', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, fontSize: '0.9rem' }}>{i + 1}. {q.question}</div>
                      {q.options && q.options.length > 0 && (
                        <ul style={{ margin: '0 0 8px 0', paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          {q.options.map((opt, j) => <li key={j}>{opt}</li>)}
                        </ul>
                      )}
                      <div style={{ fontSize: '0.8rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', display: 'inline-block', padding: '2px 8px', borderRadius: '4px' }}>
                        Answer: {q.answer}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
          <button
            onClick={handleSave}
            className="btn-primary"
            style={{ padding: '10px 24px' }}
            disabled={saving || !form.title || !form.topic}
          >
            {saving ? 'Saving…' : '✓ Save Assignment'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── View Modal ───────────────────────────────────────────────────────────────
const ViewModal = ({ assignment, onClose }) => {
  const content = assignment.content;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--overlay, rgba(0,0,0,0.7))', backdropFilter: 'blur(6px)', padding: '1rem',
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 20, width: '100%', maxWidth: 680,
        maxHeight: '90vh', overflowY: 'auto', padding: '2rem',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>{assignment.title}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '4px 0 0' }}>
              {assignment.description}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '1.25rem', flexShrink: 0, marginLeft: 12 }}>✕</button>
        </div>

        {content ? (
          content.isManual ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ padding: '1rem 1.25rem', background: 'var(--card-bg-4, rgba(255,255,255,0.04))', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ color: 'var(--text-primary)', fontSize: '0.9375rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{content.text}</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {content.instructions && (
                <div style={{ padding: '1rem 1.25rem', background: 'rgba(139,92,246,0.08)', borderRadius: 12, border: '1px solid rgba(139,92,246,0.25)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Instructions</div>
                  <div style={{ color: 'var(--text-primary)', fontSize: '0.9375rem', lineHeight: 1.7 }}>{content.instructions}</div>
                </div>
              )}

              {content.questions && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Questions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {content.questions.map((q, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 14px', background: 'var(--card-bg-4, rgba(255,255,255,0.04))', borderRadius: 10, border: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{i + 1}. {q.question}</div>
                        {q.options && q.options.length > 0 && (
                          <ul style={{ margin: '4px 0 0 0', paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            {q.options.map((opt, j) => <li key={j}>{opt}</li>)}
                          </ul>
                        )}
                        <div style={{ marginTop: 8, fontSize: '0.8125rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', display: 'inline-block', padding: '4px 8px', borderRadius: '4px', width: 'max-content' }}>
                          Answer: {q.answer}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem', background: 'var(--card-bg-3, rgba(255,255,255,0.03))', borderRadius: 12 }}>
            This assignment has no questions or AI content yet.
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button onClick={onClose} className="btn-primary" style={{ padding: '10px 24px' }}>Close</button>
        </div>
      </div>
    </div>
  );
};

// ─── Assign to Student Modal ──────────────────────────────────────────────────
const AssignModal = ({ assignment, students, onClose, onAssigned }) => {
  const [studentIds, setStudentIds] = useState([]);
  const [saving, setSaving] = useState(false);

  const toggleAll = (e) => {
    if (e.target.checked) setStudentIds(students.map(s => s.id));
    else setStudentIds([]);
  };

  const handleAssign = async () => {
    if (studentIds.length === 0) { alert('Please select at least one student'); return; }
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();

    // Duplicate assignment
    const { id, created_at, updated_at, student_id, students: _, ...rest } = assignment;
    const inserts = studentIds.map(sId => ({
      ...rest,
      student_id: sId,
      teacher_id: session.user.id,
      submission_text: null,
      score: null,
      ai_feedback: null,
      graded_at: null
    }));

    const { error } = await supabase.from('assignments').insert(inserts);

    setSaving(false);
    if (error) alert(error.message);
    else onAssigned();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--overlay, rgba(0,0,0,0.7))', backdropFilter: 'blur(6px)', padding: '1rem' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, width: '100%', maxWidth: 400, padding: '2rem', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', marginTop: 0 }}>Assign "{assignment.title}"</h3>

        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', background: 'rgba(0,0,0,0.1)', marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', cursor: 'pointer', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
            <input type="checkbox" checked={studentIds.length === students.length && students.length > 0} onChange={toggleAll} style={{ accentColor: 'var(--primary)', width: 16, height: 16 }} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>Select All / Unselect All</span>
          </label>
          {students.map(s => (
            <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', cursor: 'pointer' }}>
              <input type="checkbox"
                checked={studentIds.includes(s.id)}
                onChange={(e) => {
                  let newIds = [...studentIds];
                  if (e.target.checked) newIds.push(s.id);
                  else newIds = newIds.filter(id => id !== s.id);
                  setStudentIds(newIds);
                }}
                style={{ accentColor: 'var(--primary)', width: 15, height: 15 }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>{s.first_name} {s.last_name}</span>
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
          <button onClick={handleAssign} className="btn-primary" style={{ padding: '8px 16px' }} disabled={saving || studentIds.length === 0}>{saving ? 'Assigning...' : `Assign (${studentIds.length})`}</button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Assignments Page ────────────────────────────────────────────────────────
const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editData, setEditData] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [isManaging, setIsManaging] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [assignData, setAssignData] = useState(null);

  const fetchAssignments = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const [asgnRes, studRes] = await Promise.all([
      supabase.from('assignments')
        .select('*, students(first_name, last_name)')
        .eq('teacher_id', session.user.id)
        .order('created_at', { ascending: false }),
      supabase.from('students')
        .select('*')
        .eq('teacher_id', session.user.id)
        .order('last_name')
    ]);

    setAssignments(asgnRes.data || []);
    setStudents(studRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAssignments(); }, []);

  const handleSaved = () => {
    setShowCreate(false);
    setEditData(null);
    setLoading(true);
    fetchAssignments();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assignment template?')) return;
    const { error } = await supabase.from('assignments').delete().eq('id', id);
    if (!error) {
      fetchAssignments();
    } else {
      alert('Error deleting: ' + error.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selected.size} selected item(s)?`)) return;
    const ids = Array.from(selected);
    const { error } = await supabase.from('assignments').delete().in('id', ids);
    if (!error) {
      setSelected(new Set());
      setIsManaging(false);
      fetchAssignments();
    } else {
      alert('Error deleting: ' + error.message);
    }
  };

  const toggleSelect = (id) => {
    const newSet = new Set(selected);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelected(newSet);
  };

  const formatDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <DashboardLayout pageTitle="Assignments" pageSubtitle="Create and manage your assignment prompts and templates.">
      {/* ── Modals ── */}
      {(showCreate || editData) && (
        <CreateModal
          onClose={() => { setShowCreate(false); setEditData(null); }}
          onSaved={handleSaved}
          initialData={editData}
          students={students}
        />
      )}
      {viewData && <ViewModal assignment={viewData} onClose={() => setViewData(null)} />}
      {assignData && (
        <AssignModal
          assignment={assignData}
          students={students}
          onClose={() => setAssignData(null)}
          onAssigned={() => { setAssignData(null); fetchAssignments(); alert('Assigned successfully!'); }}
        />
      )}

      {/* ── Action Bar ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          {isManaging && (
            <button
              className="btn-secondary dash-btn"
              style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '10px 16px', borderRadius: '10px' }}
              onClick={handleBulkDelete}
              disabled={selected.size === 0}
            >
              Delete Selected ({selected.size})
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn-primary dash-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={() => setShowCreate(true)}
          >
            <span>✦</span> Assignment Generator
          </button>
          <button
            className="btn-secondary dash-btn"
            style={{ padding: '10px 16px', borderRadius: '10px' }}
            onClick={() => setShowCreate(true)}
          >
            + New Assignment
          </button>
          <button
            className="btn-secondary dash-btn"
            style={{ padding: '10px 16px', borderRadius: '10px' }}
            onClick={() => {
              setIsManaging(!isManaging);
              if (isManaging) setSelected(new Set());
            }}
          >
            {isManaging ? 'Done Managing' : 'Manage'}
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
          Loading assignments…
        </div>
      ) : assignments.length === 0 ? (
        <div className="dash-card" style={{ textAlign: 'center', padding: '3rem 2rem', background: 'var(--card-bg-2, rgba(255,255,255,0.02))', border: '1px dashed var(--card-bg-10, rgba(255,255,255,0.1))', borderRadius: '16px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No assignments yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: 360, margin: '0 auto 1.5rem' }}>
            Build your first assignment template or use AI to generate quizzes and worksheets.
          </p>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            ✦ Create Template
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {assignments.map(item => (
            <div
              key={item.id}
              className="dash-card"
              style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', background: 'var(--card-bg-4, rgba(255,255,255,0.04))', borderRadius: '12px', border: '1px solid var(--card-bg-8, rgba(255,255,255,0.08))' }}
            >
              <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {isManaging && (
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#a78bfa' }}
                  />
                )}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>{item.title}</span>
                    {item.content && !item.content.isManual && (
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 20, background: 'rgba(139,92,246,0.15)', color: '#a78bfa', fontWeight: 600 }}>✦ AI Generated</span>
                    )}
                    {item.content && item.content.isManual && (
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 20, background: 'var(--card-bg-5, rgba(255,255,255,0.05))', color: 'var(--text-secondary)', border: '1px solid var(--border)', fontWeight: 600 }}>✎ Manual</span>
                    )}
                    {item.student_id && (
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 20, background: 'rgba(59,130,246,0.15)', color: '#3b82f6', fontWeight: 600 }}>👤 Assigned to {item.students?.first_name} {item.students?.last_name}</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {item.description && <span>📖 {item.description}</span>}
                    {item.content?.questions && <span>❓ {item.content.questions.length} Questions</span>}
                    <span>📅 {formatDate(item.created_at)}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                {!item.student_id && (
                  <button
                    className="btn-secondary"
                    style={{ padding: '8px 12px', fontSize: '0.875rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px' }}
                    onClick={() => setAssignData(item)}
                  >
                    Assign
                  </button>
                )}
                <button
                  className="btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '0.875rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px' }}
                  onClick={() => setEditData(item)}
                >
                  Edit
                </button>
                <button
                  className="btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '0.875rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', background: 'transparent', borderRadius: '8px' }}
                  onClick={() => handleDelete(item.id)}
                >
                  Delete
                </button>
                <button
                  className="btn-secondary"
                  style={{ padding: '8px 18px', fontSize: '0.875rem', background: 'var(--grad-primary)', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 600 }}
                  onClick={() => setViewData(item)}
                >
                  View →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Assignments;
