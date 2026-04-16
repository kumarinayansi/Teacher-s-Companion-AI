import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import DashboardLayout from '../components/DashboardLayout';
import '../settings.css';

const Settings = () => {
  const [profile, setProfile] = useState({ first_name: '', last_name: '', school_name: '', grade_level: '', subjects: [], avatar_url: '', phone_number: '', email_address: '', qualification: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUser(session.user);
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (data) setProfile({ first_name: data.first_name || '', last_name: data.last_name || '', school_name: data.school_name || '', grade_level: data.grade_level || '', subjects: data.subjects || [], avatar_url: data.avatar_url || '', phone_number: data.phone_number || '', email_address: data.email_address || session.user.email || '', qualification: data.qualification || '' });
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ ...profile, updated_at: new Date().toISOString() }).eq('id', user.id);
    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      console.error("Save error:", error);
      alert("Failed to save changes: " + (error.message || "Unknown error"));
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setProfile(p => ({ ...p, avatar_url: evt.target.result }));
    };
    reader.readAsDataURL(file);
  };

  if (loading) return <DashboardLayout pageTitle="Settings"><div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Loading…</div></DashboardLayout>;

  return (
    <DashboardLayout pageTitle="Settings" pageSubtitle="Manage your account and teaching preferences.">
      <div style={{ maxWidth: 640 }}>
        <form onSubmit={handleSave} style={{ display: 'grid', gap: '1.5rem' }}>

          {saved && (
            <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, color: '#10b981', textAlign: 'center' }}>
              ✅ Settings saved successfully!
            </div>
          )}

          <div className="dash-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem', fontSize: '1rem' }}>Profile Information</h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <img
                src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.first_name || user?.email?.split('@')[0] || 'Teacher')}&background=8b5cf6&color=fff`}
                alt="Profile Avatar"
                style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }}
              />
              <div>
                <label className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.875rem', cursor: 'pointer', display: 'inline-block' }}>
                  Change Photo
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
                </label>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '6px' }}>JPG, GIF or PNG. Max size of 800K.</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[
                { label: 'First Name', key: 'first_name', placeholder: 'Sarah' },
                { label: 'Last Name', key: 'last_name', placeholder: 'Johnson' },
              ].map(f => (
                <div key={f.key} className="form-group">
                  <label className="form-label">{f.label}</label>
                  <input className="form-input" type="text" placeholder={f.placeholder} value={profile[f.key]} onChange={e => setProfile(p => ({ ...p, [f.key]: e.target.value }))} style={{ padding: '10px 14px' }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              {[
                { label: 'Phone Number', key: 'phone_number', placeholder: '+1 (555) 000-0000', type: 'tel' },
                { label: 'Email Address', key: 'email_address', placeholder: 'sarah.johnson@school.edu', type: 'email' },
              ].map(f => (
                <div key={f.key} className="form-group">
                  <label className="form-label">{f.label}</label>
                  <input className="form-input" type={f.type} placeholder={f.placeholder} value={profile[f.key]} onChange={e => setProfile(p => ({ ...p, [f.key]: e.target.value }))} style={{ padding: '10px 14px' }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div className="form-group">
                <label className="form-label">School Name</label>
                <input className="form-input" type="text" placeholder="Lincoln Elementary School" value={profile.school_name} onChange={e => setProfile(p => ({ ...p, school_name: e.target.value }))} style={{ padding: '10px 14px' }} />
              </div>
              <div className="form-group">
                <label className="form-label">School Grade</label>
                <input className="form-input" type="text" placeholder="5th Grade" value={profile.grade_level} onChange={e => setProfile(p => ({ ...p, grade_level: e.target.value }))} style={{ padding: '10px 14px' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginTop: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Qualification / Education</label>
                <input className="form-input" type="text" placeholder="e.g. Master of Education (M.Ed.)" value={profile.qualification} onChange={e => setProfile(p => ({ ...p, qualification: e.target.value }))} style={{ padding: '10px 14px' }} />
              </div>
            </div>
          </div>

          <div className="dash-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1rem' }}>Account</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>Signed in as <strong style={{ color: 'var(--text-primary)' }}>{user?.email}</strong></p>
            <button type="button" onClick={handleSignOut} className="btn-secondary" style={{ padding: '10px 20px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>Sign Out</button>
          </div>

          <button type="submit" className="btn-primary" style={{ padding: '12px 24px', alignSelf: 'flex-start' }} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
