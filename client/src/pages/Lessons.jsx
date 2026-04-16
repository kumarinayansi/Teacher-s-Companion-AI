import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import DashboardLayout from '../components/DashboardLayout';
import '../lessons.css';

// ─── Create / Generate Modal ─────────────────────────────────────────────────
const CreateModal = ({ onClose, onSaved, initialData }) => {
  const [mode, setMode] = useState(initialData?.content && !initialData.content.isManual ? 'ai' : 'manual');
  const [form, setForm] = useState({
    title: initialData?.title || '',
    topic: initialData?.topic || '',
    grade: '',
    duration_minutes: initialData?.duration_minutes || 45,
    standard_alignment: initialData?.standard_alignment || '',
    manualContent: initialData?.content?.isManual ? initialData.content.text : '',
  });
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(initialData?.content || null);
  const [error, setError] = useState(null);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // ── Generate with AI ──
  const handleGenerate = async () => {
    if (!form.topic) { setError('Please enter a topic first.'); return; }
    setError(null);
    setGenerating(true);
    try {
      const res = await fetch('https://teacher-s-companion-ai.onrender.com/api/ai/lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: form.topic,
          grade: form.grade || 'Grade 5',
          duration: Number(form.duration_minutes) || 45,
          standard: form.standard_alignment,
        }),
      });
      const data = await res.json();
      setGeneratedPlan(data.lessonPlan);
      // Auto-fill title if empty
      if (!form.title) set('title', `${form.topic} — AI Lesson Plan`);
      setMode('ai');
    } catch {
      setError('Could not reach the AI server. Make sure the backend is running on port 3000.');
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

    let finalContent = generatedPlan || null;
    if (mode === 'manual') {
      finalContent = form.manualContent ? { isManual: true, text: form.manualContent } : null;
    }

    const lessonData = {
      teacher_id: session.user.id,
      title: form.title,
      topic: form.topic,
      duration_minutes: Number(form.duration_minutes) || 45,
      standard_alignment: form.standard_alignment || null,
      content: finalContent,
    };

    let dbErr;
    if (initialData?.id) {
      const { error } = await supabase.from('lessons').update(lessonData).eq('id', initialData.id);
      dbErr = error;
    } else {
      const { error } = await supabase.from('lessons').insert(lessonData);
      dbErr = error;
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
              {initialData ? '✦ Edit Lesson Plan' : '✦ Create Lesson Plan'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '4px 0 0' }}>
              Fill in the details or let AI generate the full plan for you.
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
              <label className="form-label">Topic <span style={{ color: '#ef4444' }}>*</span></label>
              <input className="form-input" type="text" placeholder="e.g. Fractions, Photosynthesis"
                value={form.topic} onChange={e => set('topic', e.target.value)}
                style={{ padding: '10px 14px' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Grade Level</label>
              <input className="form-input" type="text" placeholder="e.g. Grade 5"
                value={form.grade} onChange={e => set('grade', e.target.value)}
                style={{ padding: '10px 14px' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Lesson Title <span style={{ color: '#ef4444' }}>*</span></label>
            <input className="form-input" type="text" placeholder="e.g. Introduction to Fractions"
              value={form.title} onChange={e => set('title', e.target.value)}
              style={{ padding: '10px 14px' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Duration (minutes)</label>
              <input className="form-input" type="number" min={10} max={180}
                value={form.duration_minutes} onChange={e => set('duration_minutes', e.target.value)}
                style={{ padding: '10px 14px' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Standard Alignment</label>
              <input className="form-input" type="text" placeholder="e.g. CCSS.Math.5.NF.A.1"
                value={form.standard_alignment} onChange={e => set('standard_alignment', e.target.value)}
                style={{ padding: '10px 14px' }} />
            </div>
          </div>

          {mode === 'manual' && (
            <div className="form-group">
              <label className="form-label">Lesson Content</label>
              <textarea className="form-input" rows={10} placeholder="Write your lesson plan here..."
                value={form.manualContent} onChange={e => set('manualContent', e.target.value)}
                style={{ padding: '10px 14px', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5' }} />
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
                Generating lesson plan…
              </>
            ) : (
              <>✦ Generate Full Lesson Plan with AI</>
            )}
          </button>
        )}

        {/* Generated Plan Preview */}
        {mode === 'ai' && generatedPlan && !generatedPlan.isManual && (
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{
              background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.3)',
              borderRadius: 12, padding: '1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem', color: '#a78bfa', fontWeight: 700, fontSize: '0.875rem' }}>
                ✦ AI-Generated Plan Preview
              </div>

              {/* Objective */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Objective</div>
                <div style={{ color: 'var(--text-primary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{generatedPlan.objective}</div>
              </div>

              {/* Sections */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Lesson Flow</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {generatedPlan.sections.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 12px', background: 'var(--card-bg-4, rgba(255,255,255,0.04))', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div style={{ minWidth: 70, fontSize: '0.75rem', color: '#a78bfa', fontWeight: 600 }}>{s.duration}</div>
                      <div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{s.title}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.activity}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Differentiation */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Differentiation</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                  {Object.entries(generatedPlan.differentiation).map(([k, v]) => (
                    <div key={k} style={{ padding: '8px 10px', background: 'var(--card-bg-3, rgba(255,255,255,0.03))', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div style={{ fontWeight: 700, color: '#a78bfa', textTransform: 'capitalize', marginBottom: 4 }}>{k}</div>
                      <div style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '10px 20px' }}>Cancel</button>
          <button
            onClick={handleSave}
            className="btn-primary"
            style={{ padding: '10px 24px' }}
            disabled={saving || !form.title || !form.topic}
          >
            {saving ? 'Saving…' : '✓ Save Lesson Plan'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

// ─── View Modal ───────────────────────────────────────────────────────────────
const ViewModal = ({ lesson, onClose }) => {
  const plan = lesson.content;

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
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>{lesson.title}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '4px 0 0' }}>
              {lesson.topic} · {lesson.duration_minutes} min
              {lesson.standard_alignment ? ` · ${lesson.standard_alignment}` : ''}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '1.25rem', flexShrink: 0, marginLeft: 12 }}>✕</button>
        </div>

        {plan ? (
          plan.isManual ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ padding: '1rem 1.25rem', background: 'var(--card-bg-3, rgba(255,255,255,0.03))', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ color: 'var(--text-primary)', fontSize: '0.9375rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{plan.text}</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Objective */}
              {plan.objective && (
                <div style={{ padding: '1rem 1.25rem', background: 'rgba(139,92,246,0.08)', borderRadius: 12, border: '1px solid rgba(139,92,246,0.25)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Learning Objective</div>
                  <div style={{ color: 'var(--text-primary)', fontSize: '0.9375rem', lineHeight: 1.7 }}>{plan.objective}</div>
                </div>
              )}

            {/* Materials */}
            {plan.materials && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Materials</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {plan.materials.map((m, i) => (
                    <span key={i} className="feature-tag">{m}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Lesson Flow */}
            {plan.sections && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Lesson Flow</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {plan.sections.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 14px', background: 'var(--card-bg-4, rgba(255,255,255,0.04))', borderRadius: 10, border: '1px solid var(--border)' }}>
                      <div style={{ minWidth: 72, fontSize: '0.75rem', color: '#a78bfa', fontWeight: 700, paddingTop: 2 }}>{s.duration}</div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{s.title}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{s.activity}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Differentiation */}
            {plan.differentiation && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Differentiation Strategies</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  {Object.entries(plan.differentiation).map(([k, v]) => (
                    <div key={k} style={{ padding: '10px 12px', background: 'var(--card-bg-4, rgba(255,255,255,0.04))', borderRadius: 10, border: '1px solid var(--border)' }}>
                      <div style={{ fontWeight: 700, color: '#a78bfa', textTransform: 'capitalize', fontSize: '0.8125rem', marginBottom: 4 }}>{k === 'ell' ? 'ELL Support' : k}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: 1.5 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assessment */}
            {plan.assessment && (
              <div style={{ padding: '1rem 1.25rem', background: 'rgba(16,185,129,0.08)', borderRadius: 12, border: '1px solid rgba(16,185,129,0.25)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Assessment</div>
                <div style={{ color: 'var(--text-primary)', fontSize: '0.875rem', lineHeight: 1.7 }}>{plan.assessment}</div>
              </div>
            )}
            </div>
          )
        ) : (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem', background: 'var(--card-bg-3, rgba(255,255,255,0.03))', borderRadius: 12 }}>
            This lesson was saved without AI-generated content.
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button onClick={onClose} className="btn-primary" style={{ padding: '10px 24px' }}>Close</button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Lessons Page ────────────────────────────────────────────────────────
const Lessons = () => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editLessonData, setEditLessonData] = useState(null);
  const [viewLesson, setViewLesson] = useState(null);
  const [isManaging, setIsManaging] = useState(false);
  const [selectedLessons, setSelectedLessons] = useState(new Set());

  const fetchLessons = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase
      .from('lessons')
      .select('*')
      .eq('teacher_id', session.user.id)
      .order('created_at', { ascending: false });
    setLessons(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchLessons(); }, []);

  const handleSaved = () => {
    setShowCreate(false);
    setEditLessonData(null);
    setLoading(true);
    fetchLessons();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) return;
    const { error } = await supabase.from('lessons').delete().eq('id', id);
    if (!error) {
      fetchLessons();
    } else {
      alert('Error deleting lesson: ' + error.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLessons.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedLessons.size} selected lesson(s)?`)) return;
    const ids = Array.from(selectedLessons);
    const { error } = await supabase.from('lessons').delete().in('id', ids);
    if (!error) {
      setSelectedLessons(new Set());
      setIsManaging(false);
      fetchLessons();
    } else {
      alert('Error deleting lessons: ' + error.message);
    }
  };

  const toggleSelectLesson = (id) => {
    const newSet = new Set(selectedLessons);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedLessons(newSet);
  };

  const formatDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <DashboardLayout pageTitle="Lessons" pageSubtitle="Manage and generate AI-powered lesson plans.">
      {/* ── Modals ── */}
      {(showCreate || editLessonData) && (
        <CreateModal
          onClose={() => { setShowCreate(false); setEditLessonData(null); }}
          onSaved={handleSaved}
          initialData={editLessonData}
        />
      )}
      {viewLesson && <ViewModal lesson={viewLesson} onClose={() => setViewLesson(null)} />}

      {/* ── Action Bar ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          {isManaging && (
            <button
              className="btn-secondary dash-btn"
              style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              onClick={handleBulkDelete}
              disabled={selectedLessons.size === 0}
            >
              Delete Selected ({selectedLessons.size})
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn-primary dash-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={() => setShowCreate(true)}
          >
            <span>✦</span> Generate with AI
          </button>
          <button
            className="btn-secondary dash-btn"
            onClick={() => setShowCreate(true)}
          >
            + New Lesson
          </button>
          <button
            className="btn-secondary dash-btn"
            onClick={() => {
              setIsManaging(!isManaging);
              if (isManaging) setSelectedLessons(new Set());
            }}
          >
            {isManaging ? 'Done Managing' : 'Manage'}
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
          Loading lessons…
        </div>
      ) : lessons.length === 0 ? (
        <div className="dash-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No lessons yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: 360, margin: '0 auto 1.5rem' }}>
            Generate your first AI lesson plan in seconds. Just enter a topic, grade, and duration!
          </p>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            ✦ Generate Lesson Plan
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {lessons.map(lesson => (
            <div
              key={lesson.id}
              className="dash-card"
              style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}
            >
              <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {isManaging && (
                  <input
                    type="checkbox"
                    checked={selectedLessons.has(lesson.id)}
                    onChange={() => toggleSelectLesson(lesson.id)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#a78bfa' }}
                  />
                )}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>{lesson.title}</span>
                    {lesson.content && !lesson.content.isManual && (
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 20, background: 'rgba(139,92,246,0.15)', color: '#a78bfa', fontWeight: 600 }}>✦ AI Generated</span>
                    )}
                    {lesson.content && lesson.content.isManual && (
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 20, background: 'var(--card-bg-5, rgba(255,255,255,0.05))', color: 'var(--text-secondary)', border: '1px solid var(--border)', fontWeight: 600 }}>✎ Manual</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {lesson.topic && <span>📖 {lesson.topic}</span>}
                    {lesson.duration_minutes && <span>⏱ {lesson.duration_minutes} min</span>}
                    {lesson.standard_alignment && <span>📐 {lesson.standard_alignment}</span>}
                    <span>📅 {formatDate(lesson.created_at)}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button
                  className="btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '0.875rem' }}
                  onClick={() => setEditLessonData(lesson)}
                >
                  Edit
                </button>
                <button
                  className="btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '0.875rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                  onClick={() => handleDelete(lesson.id)}
                >
                  Delete
                </button>
                <button
                  className="btn-secondary"
                  style={{ padding: '8px 18px', fontSize: '0.875rem' }}
                  onClick={() => setViewLesson(lesson)}
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

export default Lessons;
