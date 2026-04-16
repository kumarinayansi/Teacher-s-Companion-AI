import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../supabaseClient';
import DashboardLayout from '../components/DashboardLayout';
import '../library.css';

const curatedResources = [
  { icon: '📋', title: 'Lesson Plan Templates', desc: '50+ ready-to-use templates for all grade levels', tag: 'Templates' },
  { icon: '🧪', title: 'Quiz Bank', desc: 'Pre-built quizzes aligned to Common Core & NGSS', tag: 'Assessments' },
  { icon: '📊', title: 'Rubric Library', desc: 'Grading rubrics for essays, projects, and presentations', tag: 'Grading' },
  { icon: '💬', title: 'Parent Email Templates', desc: 'Professional email templates for every occasion', tag: 'Communication' },
  { icon: '🎯', title: 'Differentiated Activities', desc: 'Modified assignments for IEP, ESL, and advanced learners', tag: 'Inclusion' },
  { icon: '📖', title: 'Reading Comprehension Packs', desc: 'Grade-leveled reading passages with comprehension questions', tag: 'ELA' },
];

const emptyForm = { title: '', description: '', fileName: '', base64Data: '' };

const Library = () => {
  const [userBooks, setUserBooks] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editBookId, setEditBookId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { fetchUserBooks(); }, []);

  const fetchUserBooks = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data, error } = await supabase
      .from('library_books')
      .select('*')
      .eq('teacher_id', session.user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setUserBooks(data);
  };

  const openUploadModal = (book = null) => {
    if (book) {
      setForm({ title: book.title, description: book.description || '', fileName: book.file_name, base64Data: book.file_data });
      setEditBookId(book.id);
    } else {
      setForm(emptyForm);
      setEditBookId(null);
    }
    setIsUploadOpen(true);
  };

  const closeUploadModal = () => {
    setIsUploadOpen(false);
    setEditBookId(null);
    setForm(emptyForm);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => setForm(prev => ({ ...prev, fileName: file.name, base64Data: evt.target.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return alert('Please provide a title.');
    if (!editBookId && !form.base64Data) return alert('Please select a file.');

    setUploading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setUploading(false); return alert('Not authenticated.'); }

    const payload = { title: form.title, description: form.description, file_name: form.fileName, file_data: form.base64Data };

    let error;
    if (editBookId) {
      const res = await supabase.from('library_books').update(payload).eq('id', editBookId);
      error = res.error;
    } else {
      const res = await supabase.from('library_books').insert([{ teacher_id: session.user.id, ...payload }]);
      error = res.error;
    }

    setUploading(false);
    if (error) return alert('Error: ' + error.message);
    closeUploadModal();
    fetchUserBooks();
  };

  const handleDelete = async (book) => {
    if (!window.confirm(`Delete "${book.title}"?`)) return;
    const { error } = await supabase.from('library_books').delete().eq('id', book.id);
    if (error) return alert('Delete failed: ' + error.message);
    if (selectedItem?.id === book.id) setSelectedItem(null);
    fetchUserBooks();
  };

  const handleDownload = () => {
    if (!selectedItem?.file_data) return;
    const a = document.createElement('a');
    a.href = selectedItem.file_data;
    a.download = selectedItem.file_name || selectedItem.title || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const canPreview = (item) => item?.file_data && (
    item.file_data.startsWith('data:application/pdf') ||
    item.file_data.startsWith('data:image/') ||
    item.file_data.startsWith('data:text/')
  );

  return (
    <>
      <DashboardLayout pageTitle="Library" pageSubtitle="Browse curated teaching resources and your uploaded materials.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <input type="text" className="form-input" placeholder="Search resources, templates…" style={{ maxWidth: 360, width: '100%', padding: '10px 16px', borderRadius: 10 }} />
            <button className="btn-primary" onClick={() => openUploadModal()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              Upload Material
            </button>
          </div>

          {/* My Uploaded Materials */}
          {userBooks.length > 0 && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>My Uploaded Materials</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {userBooks.map((book) => (
                  <div key={book.id} className="dash-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '1.5rem', background: 'rgba(139,92,246,0.1)', padding: '8px', borderRadius: '8px' }}>📚</div>
                      <h3 style={{ flex: 1, fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</h3>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem', lineHeight: 1.6, height: '2.8rem', overflow: 'hidden' }}>
                      {book.description || book.file_name || 'No description available'}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        style={{ flex: 1, padding: '7px 10px', fontSize: '0.8rem', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'rgba(139,92,246,0.15)', color: 'var(--accent-1)', fontWeight: 600 }}
                        onClick={() => setSelectedItem(book)}
                      >👁 Open</button>
                      <button
                        style={{ flex: 1, padding: '7px 10px', fontSize: '0.8rem', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', fontWeight: 600 }}
                        onClick={() => openUploadModal(book)}
                      >✏️ Edit</button>
                      <button
                        style={{ flex: 1, padding: '7px 10px', fontSize: '0.8rem', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: 600 }}
                        onClick={() => handleDelete(book)}
                      >🗑 Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Curated Templates */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Curated Templates</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {curatedResources.map((r, i) => (
                <div key={i} className="dash-card feature-card" style={{ padding: '1.5rem', cursor: 'pointer' }} onClick={() => setSelectedItem(r)}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{r.icon}</div>
                  <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1rem' }}>{r.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem', lineHeight: 1.6 }}>{r.desc}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="feature-tag">{r.tag}</span>
                    <button className="ai-action-btn">Browse →</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </DashboardLayout>

      {/* Upload / Edit Modal — Portal */}
      {createPortal(
        isUploadOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: 'var(--surface, #1e1e2e)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '500px', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{editBookId ? 'Edit Material' : 'Upload Material'}</h2>
                <button onClick={closeUploadModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '1.25rem' }}>✕</button>
              </div>
              <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Title *</label>
                  <input type="text" className="form-input" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Intro to Algebra PDF" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Description</label>
                  <textarea className="form-input" rows="3" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief overview..." />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>File {!editBookId && '*'}</label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <input type="file" accept=".pdf,.doc,.docx,.txt" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                    <button type="button" className="btn-secondary" onClick={() => fileInputRef.current?.click()}>Choose File</button>
                    {form.fileName && <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{form.fileName}</span>}
                  </div>
                  {editBookId && !form.base64Data && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Leave empty to keep existing file.</p>}
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn-primary" disabled={uploading} style={{ flex: 1 }}>
                    {uploading ? 'Saving...' : editBookId ? 'Save Changes' : 'Upload File'}
                  </button>
                  <button type="button" className="btn-secondary" onClick={closeUploadModal} disabled={uploading}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        ),
        document.body
      )}

      {/* PDF Viewer Modal — Portal */}
      {createPortal(
        <div className={`pdf-viewer-modal ${selectedItem ? 'show' : ''}`}>
          <div className="pdf-toolbar">
            <div className="pdf-tb-left">
              <button className="pdf-icon-btn pdf-close-btn" onClick={() => setSelectedItem(null)} title="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <div className="pdf-tb-divider"></div>
              <div className="pdf-tb-info">
                <span className="pdf-pill">{selectedItem?.file_data ? 'UPLOADED' : 'PDF'}</span>
                <span className="pdf-tb-title">{selectedItem?.title}</span>
              </div>
            </div>
            <div className="pdf-tb-center">
              <span className="pdf-zoom-level">100%</span>
            </div>
            <div className="pdf-tb-right">
              {selectedItem?.file_data && (
                <button className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.85rem' }} onClick={handleDownload}>Download</button>
              )}
            </div>
          </div>

          <div className="pdf-body">
            <div className="pdf-sidebar">
              <div className="pdf-sidebar-header">Pages</div>
              <div className="pdf-thumbnails">
                <div className="pdf-thumb active">
                  <div className="pdf-thumb-img-wrap"><div className="pdf-mock-page"></div></div>
                  <span>1</span>
                </div>
              </div>
            </div>
            <div className="pdf-reader-pane">
              {selectedItem?.file_data ? (
                canPreview(selectedItem) ? (
                  <iframe src={selectedItem.file_data} style={{ width: '100%', height: '100%', border: 'none' }} title={selectedItem.title} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', gap: '1rem' }}>
                    <div style={{ fontSize: '3rem' }}>📄</div>
                    <h3 style={{ color: 'var(--text-primary)' }}>Preview Not Available</h3>
                    <p>This file type cannot be previewed. Click Download to open it.</p>
                  </div>
                )
              ) : (
                <div className="pdf-page-container">
                  <h1 id="pdf-mock-heading">{selectedItem?.title}</h1>
                  <div className="pdf-mock-textblock" style={{ width: '90%' }}></div>
                  <div className="pdf-mock-textblock" style={{ width: '85%' }}></div>
                  <div className="pdf-mock-textblock" style={{ width: '95%' }}></div>
                  <div className="pdf-mock-textblock" style={{ width: '70%' }}></div>
                  <div className="pdf-mock-image">Preview Content</div>
                  <div className="pdf-mock-textblock" style={{ width: '100%' }}></div>
                  <div className="pdf-mock-textblock" style={{ width: '80%' }}></div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default Library;
