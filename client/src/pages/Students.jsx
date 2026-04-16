import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import DashboardLayout from '../components/DashboardLayout';
import '../students.css';

const STATUS_OPTIONS = ['On Track', 'Needs Help', 'Advanced'];
const STATUS_CLASS = { 'On Track': 'status-on-track', 'Needs Help': 'status-needs-help', 'Advanced': 'status-advanced' };
const gradeLabel = (g) => g >= 90 ? 'A' : g >= 80 ? 'B' : g >= 70 ? 'C' : g >= 60 ? 'D' : 'F';
const gradeClass = (g) => g >= 90 ? 'grade-a' : g >= 80 ? 'grade-b' : 'grade-c';

// ── Add Student Modal ─────────────────────────────────────────────────────────
const AddStudentModal = ({ onClose, onSaved }) => {
  const [form, setForm] = useState({ first_name: '', last_name: '', overall_grade: '', status: 'On Track', age: '', grade_level: '', parent_email: '', parent_phone: '', avatar_url: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      set('avatar_url', reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name) { setError('First and last name are required.'); return; }
    setError(null);
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError('Not signed in.'); setSaving(false); return; }

    const { error: dbErr } = await supabase.from('students').insert({
      teacher_id: session.user.id,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      overall_grade: form.overall_grade ? Number(form.overall_grade) : null,
      status: form.status,
      age: form.age ? Number(form.age) : null,
      grade_level: form.grade_level.trim(),
      parent_email: form.parent_email.trim(),
      parent_phone: form.parent_phone.trim(),
      avatar_url: form.avatar_url,
    });

    setSaving(false);
    if (dbErr) { setError(dbErr.message); return; }
    onSaved();
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--overlay, rgba(0,0,0,0.7))', backdropFilter:'blur(6px)', padding:'1rem', overflowY: 'auto' }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, width:'100%', maxWidth:600, padding:'2rem', boxShadow:'0 32px 80px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
          <div>
            <h2 style={{ color:'var(--text-primary)', fontWeight:800, fontSize:'1.25rem', margin:0 }}>Add Student</h2>
            <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem', margin:'4px 0 0' }}>Add a student to your class roster.</p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-secondary)', fontSize:'1.25rem' }}>✕</button>
        </div>

        {error && <div style={{ padding:'10px 14px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, color:'#ef4444', marginBottom:'1rem', fontSize:'0.875rem' }}>{error}</div>}

        <form onSubmit={handleSave} style={{ display:'grid', gap:'1rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'0.5rem' }}>
            <img src={form.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent('New Student')}&background=8b5cf6&color=fff`} alt="Preview" style={{ width:64, height:64, borderRadius:'50%', objectFit:'cover', border:'2px solid var(--border)' }} />
            <div>
              <label className="btn-secondary" style={{ cursor:'pointer', display:'inline-block', padding:'6px 12px', fontSize:'0.875rem' }}>
                Upload Photo
                <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display:'none' }} />
              </label>
              <p style={{ margin:'4px 0 0', fontSize:'0.75rem', color:'var(--text-secondary)' }}>Max size 2MB</p>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            <div className="form-group">
              <label className="form-label">First Name <span style={{ color:'#ef4444' }}>*</span></label>
              <input className="form-input" type="text" placeholder="Emma" value={form.first_name} onChange={e => set('first_name', e.target.value)} style={{ padding:'10px 14px' }} required />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name <span style={{ color:'#ef4444' }}>*</span></label>
              <input className="form-input" type="text" placeholder="Rodriguez" value={form.last_name} onChange={e => set('last_name', e.target.value)} style={{ padding:'10px 14px' }} required />
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            <div className="form-group">
              <label className="form-label">Age</label>
              <input className="form-input" type="number" min={0} placeholder="e.g. 15" value={form.age} onChange={e => set('age', e.target.value)} style={{ padding:'10px 14px' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Grade Level</label>
              <input className="form-input" type="text" placeholder="e.g. 10th Grade" value={form.grade_level} onChange={e => set('grade_level', e.target.value)} style={{ padding:'10px 14px' }} />
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            <div className="form-group">
              <label className="form-label">Parent's Email</label>
              <input className="form-input" type="email" placeholder="parent@example.com" value={form.parent_email} onChange={e => set('parent_email', e.target.value)} style={{ padding:'10px 14px' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Parent's Phone</label>
              <input className="form-input" type="tel" placeholder="(555) 555-5555" value={form.parent_phone} onChange={e => set('parent_phone', e.target.value)} style={{ padding:'10px 14px' }} />
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
            <div className="form-group">
              <label className="form-label">Overall Grade (%)</label>
              <input className="form-input" type="number" min={0} max={100} placeholder="e.g. 85" value={form.overall_grade} onChange={e => set('overall_grade', e.target.value)} style={{ padding:'10px 14px' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={e => set('status', e.target.value)} style={{ padding:'10px 14px' }}>
                {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end', marginTop:'0.5rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ padding:'10px 20px' }}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ padding:'10px 24px' }} disabled={saving}>
              {saving ? 'Saving…' : '✓ Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Student Detail Modal ──────────────────────────────────────────────────────
const StudentDetailModal = ({ student, onClose, onUpdated }) => {
  const [form, setForm] = useState({ 
    overall_grade: student.overall_grade ?? '', 
    status: student.status || 'On Track',
    age: student.age ?? '',
    grade_level: student.grade_level || '',
    parent_email: student.parent_email || '',
    parent_phone: student.parent_phone || '',
    avatar_url: student.avatar_url || ''
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error: dbErr } = await supabase.from('students').update({
      overall_grade: form.overall_grade !== '' ? Number(form.overall_grade) : null,
      status: form.status,
      age: form.age !== '' ? Number(form.age) : null,
      grade_level: form.grade_level.trim(),
      parent_email: form.parent_email.trim(),
      parent_phone: form.parent_phone.trim(),
      avatar_url: form.avatar_url,
      updated_at: new Date().toISOString(),
    }).eq('id', student.id);
    setSaving(false);
    if (dbErr) { setError(dbErr.message); return; }
    onUpdated();
  };

  const handleDelete = async () => {
    if (!window.confirm(`Remove ${student.first_name} ${student.last_name} from your roster?`)) return;
    setDeleting(true);
    await supabase.from('students').delete().eq('id', student.id);
    onUpdated();
  };

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setF('avatar_url', reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--overlay, rgba(0,0,0,0.7))', backdropFilter:'blur(6px)', padding:'1rem', overflowY: 'auto' }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, width:'100%', maxWidth:540, padding:'2rem', boxShadow:'0 32px 80px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ position:'relative' }}>
              <img src={student.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.first_name || 'Student')}&background=8b5cf6&color=fff`} alt={student.first_name} style={{ width:64, height:64, borderRadius:'50%', border:'2px solid var(--border)', objectFit:'cover' }} />
              <label style={{ position:'absolute', bottom:-4, right:-4, background:'var(--primary)', color:'white', borderRadius:'50%', width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:12, border:'2px solid var(--surface)' }}>
                ✎
                <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display:'none' }} />
              </label>
            </div>
            <div>
              <h2 style={{ color:'var(--text-primary)', fontWeight:800, fontSize:'1.25rem', margin:0 }}>{student.first_name} {student.last_name}</h2>
              <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem', margin:0 }}>Edit progress & details</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-secondary)', fontSize:'1.25rem' }}>✕</button>
        </div>

        {error && <div style={{ padding:'10px 14px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, color:'#ef4444', marginBottom:'1rem', fontSize:'0.875rem' }}>{error}</div>}

        <form onSubmit={handleUpdate} style={{ display:'grid', gap:'1rem' }}>
          
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            <div className="form-group">
              <label className="form-label">Age</label>
              <input className="form-input" type="number" min={0} placeholder="e.g. 15" value={form.age} onChange={e => setF('age', e.target.value)} style={{ padding:'10px 14px' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Grade Level</label>
              <input className="form-input" type="text" placeholder="e.g. 10th Grade" value={form.grade_level} onChange={e => setF('grade_level', e.target.value)} style={{ padding:'10px 14px' }} />
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            <div className="form-group">
              <label className="form-label">Parent's Email</label>
              <input className="form-input" type="email" placeholder="parent@example.com" value={form.parent_email} onChange={e => setF('parent_email', e.target.value)} style={{ padding:'10px 14px' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Parent's Phone</label>
              <input className="form-input" type="tel" placeholder="(555) 555-5555" value={form.parent_phone} onChange={e => setF('parent_phone', e.target.value)} style={{ padding:'10px 14px' }} />
            </div>
          </div>
          
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem', display: 'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            <div className="form-group">
              <label className="form-label">Overall Grade (%)</label>
              <input className="form-input" type="number" min={0} max={100} placeholder="e.g. 85" value={form.overall_grade} onChange={e => setF('overall_grade', e.target.value)} style={{ padding:'10px 14px' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={e => setF('status', e.target.value)} style={{ padding:'10px 14px' }}>
                {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display:'flex', gap:'0.75rem', justifyContent:'space-between', marginTop:'0.5rem' }}>
            <button type="button" onClick={handleDelete} disabled={deleting} style={{ padding:'10px 16px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, color:'#ef4444', cursor:'pointer', fontSize:'0.875rem' }}>
              {deleting ? 'Removing…' : '🗑 Remove'}
            </button>
            <div style={{ display:'flex', gap:'0.5rem' }}>
              <button type="button" onClick={onClose} className="btn-secondary" style={{ padding:'10px 16px' }}>Cancel</button>
              <button type="submit" className="btn-primary" style={{ padding:'10px 20px' }} disabled={saving}>{saving ? 'Saving…' : '✓ Update'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Analytics Modal Placeholder ───────────────────────────────────────────────
const AnalyticsModal = ({ student, onClose }) => {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--overlay, rgba(0,0,0,0.7))', backdropFilter:'blur(6px)', padding:'1rem', overflowY: 'auto' }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, width:'100%', maxWidth:540, padding:'2rem', boxShadow:'0 32px 80px rgba(0,0,0,0.5)', position: 'relative' }}>
        <button onClick={onClose} style={{ position:'absolute', top:'1rem', right:'1rem', background:'none', border:'none', cursor:'pointer', color:'var(--text-secondary)', fontSize:'1.25rem' }}>✕</button>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📊</div>
          <h2 style={{ color:'var(--text-primary)', fontWeight:800, fontSize:'1.5rem', margin:0 }}>{student.first_name}'s Analytics</h2>
          <p style={{ color:'var(--text-secondary)' }}>Detailed performance insights coming soon.</p>
        </div>
        <div style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', padding: '1rem', borderRadius: '12px', color: 'var(--text-primary)', textAlign: 'center' }}>
          <strong>Current Grade:</strong> {student.overall_grade || 'N/A'}% <br />
          <strong>Status:</strong> {student.status || 'On Track'}
        </div>
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <button className="btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

// ── Main Students Page ────────────────────────────────────────────────────────
const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);
  const [analyticsOpen, setAnalyticsOpen] = useState(null);

  const fetch = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase.from('students').select('*').eq('teacher_id', session.user.id).order('last_name');
    setStudents(data || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const refresh = () => { setShowAdd(false); setSelected(null); fetch(); };
  const filtered = students.filter(s => `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout pageTitle="Students" pageSubtitle="Track progress and manage your student roster.">
      {showAdd && <AddStudentModal onClose={() => setShowAdd(false)} onSaved={refresh} />}
      {selected && <StudentDetailModal student={selected} onClose={() => setSelected(null)} onUpdated={refresh} />}
      {analyticsOpen && <AnalyticsModal student={analyticsOpen} onClose={() => setAnalyticsOpen(null)} />}

      {/* Action Bar */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', gap:'1rem', flexWrap:'wrap' }}>
        <input type="text" placeholder="Search students…" value={search} onChange={e => setSearch(e.target.value)}
          className="form-input" style={{ maxWidth:280, padding:'10px 14px', borderRadius:8 }} />
        <div style={{ display:'flex', gap:'0.75rem' }}>
          <span style={{ color:'var(--text-secondary)', fontSize:'0.875rem', display:'flex', alignItems:'center' }}>
            {filtered.length} student{filtered.length !== 1 ? 's' : ''}
          </span>
          <button className="btn-primary dash-btn" onClick={() => setShowAdd(true)}>+ Add Student</button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign:'center', color:'var(--text-secondary)', padding:'3rem' }}>Loading students…</div>
      ) : filtered.length === 0 ? (
        <div className="dash-card" style={{ textAlign:'center', padding:'3rem 2rem' }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>👥</div>
          <h3 style={{ color:'var(--text-primary)', marginBottom:'0.5rem' }}>{search ? 'No students match your search' : 'No students yet'}</h3>
          <p style={{ color:'var(--text-secondary)', marginBottom:'1.5rem' }}>Add your students to start tracking their progress.</p>
          {!search && <button className="btn-primary" onClick={() => setShowAdd(true)}>+ Add Student</button>}
        </div>
      ) : (
        <div className="dash-card" style={{ padding:0, overflow:'hidden' }}>
          <div className="students-table-wrap">
            <table className="students-table" style={{ width:'100%' }}>
              <thead>
                <tr><th>Student</th><th>Grade</th><th>Score</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id}>
                    <td>
                      <div className="stu-name-cell">
                        <img src={s.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.first_name || 'Student')}&background=8b5cf6&color=fff`} alt={s.first_name} className="stu-avatar" style={{ objectFit: 'cover' }} />
                        <span>{s.first_name} {s.last_name}</span>
                      </div>
                    </td>
                    <td>
                      {s.overall_grade != null
                        ? <span className={`grade-badge ${gradeClass(s.overall_grade)}`}>{gradeLabel(s.overall_grade)}</span>
                        : <span style={{ color:'var(--text-secondary)', fontSize:'0.875rem' }}>—</span>
                      }
                    </td>
                    <td>
                      {s.overall_grade != null ? (
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div className="progress-bar-wrap" style={{ flex:1, minWidth:60 }}>
                            <div className={`progress-bar${s.overall_grade < 70 ? ' progress-bar-warn' : ''}`} style={{ '--w': `${s.overall_grade}%` }}></div>
                          </div>
                          <span style={{ color:'var(--text-secondary)', fontSize:'0.8125rem', width:36 }}>{s.overall_grade}%</span>
                        </div>
                      ) : <span style={{ color:'var(--text-secondary)', fontSize:'0.875rem' }}>No grade</span>}
                    </td>
                    <td>
                      <span className={`status-badge ${STATUS_CLASS[s.status] || 'status-on-track'}`}>{s.status || 'On Track'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button className="ai-action-btn" onClick={(e) => { e.stopPropagation(); setSelected(s); }} title="Edit Student">✏️ Edit</button>
                        <button 
                          className="ai-action-btn" 
                          style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="View Analytics"
                          onClick={(e) => { e.stopPropagation(); setAnalyticsOpen(s); }}
                        >
                          📊
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Students;
