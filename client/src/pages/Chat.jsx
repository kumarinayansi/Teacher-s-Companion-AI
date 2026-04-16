import { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import DashboardLayout from '../components/DashboardLayout';
import '../chat.css';

const INITIAL_MSG = { role: 'ai', text: "Hi there! I'm your AI teaching assistant. Ask me to plan a lesson, generate a quiz, draft a parent email, or anything else you need! 🎓" };

const Chat = () => {
  const [messages, setMessages] = useState([INITIAL_MSG]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);

  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => { fetchPastChats(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fetchPastChats = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase.from('chats').select('*').eq('teacher_id', session.user.id).order('updated_at', { ascending: false });
    if (data) setChats(data);
  };

  const handleNewChat = () => {
    setMessages([INITIAL_MSG]);
    setCurrentChatId(null);
    setInput('');
  };

  const loadChat = (chat) => {
    setCurrentChatId(chat.id);
    setMessages(chat.messages || [INITIAL_MSG]);
  };

  const deleteChat = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this chat?")) return;
    await supabase.from('chats').delete().eq('id', id);
    if (currentChatId === id) handleNewChat();
    fetchPastChats();
  };

  const autoSaveChat = async (newMessages) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    if (currentChatId) {
       await supabase.from('chats').update({ messages: newMessages, updated_at: new Date() }).eq('id', currentChatId);
       fetchPastChats(); // Refresh the list
    } else {
       const titleMsg = newMessages.find(m => m.role === 'user');
       const title = titleMsg ? titleMsg.text.slice(0, 30) + '...' : 'New Chat';
       const { data } = await supabase.from('chats').insert({
         teacher_id: session.user.id,
         title,
         messages: newMessages
       }).select().single();
       if (data) {
         setCurrentChatId(data.id);
         setChats(prev => [data, ...prev]);
       }
    }
  };

  const exportChat = () => {
    const textContent = messages.map(m => `${m.role === 'user' ? 'You' : 'AI'}:\n${m.text}`).join('\n\n---\n\n');
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AI-Chat-${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const sendMessage = async () => {
    if ((!input.trim() && !attachedFile) || loading) return;
    
    let messageText = input.trim();
    if (attachedFile) {
      messageText += (messageText ? '\n' : '') + `[Attached File: ${attachedFile.name}]`;
    }

    const userMsg = { role: 'user', text: messageText };
    const messagesWithUser = [...messages, userMsg];
    
    setMessages(messagesWithUser);
    setInput('');
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    // Save state once with user message
    await autoSaveChat(messagesWithUser);
    
    setLoading(true);

    try {
      const res = await fetch('https://teacher-s-companion-ai.onrender.com/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.text }),
      });
      const data = await res.json();
      const aiText = data.reply || "I've noted that! Here's a quick tip: break your lesson into a warm-up (5 min), direct instruction (15 min), guided practice (15 min), and an exit ticket (5 min) for maximum engagement.";
      
      const newMessagesWithAi = [...messagesWithUser, { role: 'ai', text: aiText }];
      setMessages(newMessagesWithAi);
      await autoSaveChat(newMessagesWithAi);
    } catch {
      const errMessages = [...messagesWithUser, { role: 'ai', text: "I'm currently in demo mode. In a full setup I'd connect to an AI model to answer that. In the meantime, try asking about lesson plans, quizzes, or parent emails!" }];
      setMessages(errMessages);
      await autoSaveChat(errMessages);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <DashboardLayout topbarTitle="AI Assistant">
      <div style={{ display: 'flex', height: 'calc(100vh - 120px)', minHeight: 400, gap: '1.5rem' }}>
        
        {/* Main Active Chat */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Header Controls */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem', gap: '8px' }}>
            <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setShowHistory(!showHistory)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
              {showHistory ? 'Hide History' : 'Chat History'}
            </button>
            <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={exportChat}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Export Document
            </button>
          </div>

          <div className="dash-card" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                {msg.role === 'ai' && (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', marginRight: 10, flexShrink: 0 }}>✦</div>
                )}
                <div style={{
                  maxWidth: '70%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user' ? 'var(--grad-primary)' : 'var(--card-bg-6, rgba(255,255,255,0.06))',
                  color: 'var(--text-primary)',
                  fontSize: '0.9375rem',
                  lineHeight: 1.6,
                  border: msg.role === 'ai' ? '1px solid var(--border)' : 'none',
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem' }}>✦</div>
                <div style={{ padding: '10px 14px', borderRadius: '16px 16px 16px 4px', background: 'var(--card-bg-6, rgba(255,255,255,0.06))', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Thinking…</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            {attachedFile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '8px 12px', background: 'var(--card-bg-10, rgba(255,255,255,0.1))', borderRadius: 8, width: 'max-content' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                  <polyline points="13 2 13 9 20 9"></polyline>
                </svg>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{attachedFile.name}</span>
                <button 
                  onClick={removeFile}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginLeft: '4px', display: 'flex' }}
                  title="Remove file"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                style={{ display: 'none' }} 
              />
              <button 
                className="btn-secondary" 
                style={{ padding: '12px', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--card-bg-6, rgba(255,255,255,0.06))', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                title="Attach File"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                </svg>
              </button>
              <input
                type="text"
                className="form-input"
                style={{ flex: 1, padding: '12px 16px', borderRadius: 12 }}
                placeholder="Ask AI to plan a lesson, create a quiz, draft an email…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                disabled={loading}
              />
              <button
                className="btn-primary"
                style={{ padding: '12px 20px', borderRadius: 12 }}
                onClick={sendMessage}
                disabled={loading || (!input.trim() && !attachedFile)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Chat History */}
        {showHistory && (
          <div className="dash-card" style={{ width: '260px', display: 'flex', flexDirection: 'column', flexShrink: 0, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--card-bg-5, rgba(255,255,255,0.05))' }}>
              <button className="btn-primary" style={{ width: '100%', padding: '10px' }} onClick={handleNewChat}>
                + New Chat
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
               {chats.map(c => (
                  <div key={c.id} onClick={() => loadChat(c)} style={{ padding: '12px 1rem', cursor: 'pointer', borderBottom: '1px solid var(--card-bg-5, rgba(255,255,255,0.05))', background: c.id === currentChatId ? 'var(--card-bg-6, rgba(255,255,255,0.06))' : 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.2s' }} onMouseEnter={e => { if (c.id !== currentChatId) e.currentTarget.style.background = 'var(--card-bg-2, rgba(255,255,255,0.02))' }} onMouseLeave={e => { if (c.id !== currentChatId) e.currentTarget.style.background = 'transparent' }}>
                    <span style={{ fontSize: '0.875rem', color: c.id === currentChatId ? '#fff' : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '10px' }}>{c.title}</span>
                    <button onClick={(e) => deleteChat(e, c.id)} style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer', padding: '4px', display: 'flex' }} aria-label="Delete chat">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
               ))}
               {chats.length === 0 && (
                 <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No past chats</div>
               )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Chat;
