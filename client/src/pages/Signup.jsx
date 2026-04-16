import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../signup.css';

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    // Redirect if already signed in, and handle OAuth callback
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) navigate('/dashboard', { replace: true });
        });
        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
            if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
                navigate('/dashboard', { replace: true });
            }
        });
        return () => listener.subscription.unsubscribe();
    }, [navigate]);

    const handleSignup = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                    },
                },
            });

            if (error) throw error;

            setSuccess(true);
            // Navigate to dashboard if auto-confirmed, else show message
            if (data.session) {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) setError(error.message);
    };



    return (
        <>

  {/*  Background  */}
  <div className="login-bg">
    <div className="login-glow login-glow-1"></div>
    <div className="login-glow login-glow-2"></div>
    <div className="login-glow login-glow-3"></div>
    <div className="login-grid"></div>
  </div>

  {/*  Floating Particles  */}
  <div className="particles" aria-hidden="true">
    <span className="particle" style={{"--x":"10%", "--y":"20%", "--d":"6s", "--s":"0.4"}}></span>
    <span className="particle" style={{"--x":"85%", "--y":"15%", "--d":"8s", "--s":"0.3"}}></span>
    <span className="particle" style={{"--x":"60%", "--y":"70%", "--d":"5s", "--s":"0.5"}}></span>
    <span className="particle" style={{"--x":"25%", "--y":"80%", "--d":"7s", "--s":"0.35"}}></span>
    <span className="particle" style={{"--x":"90%", "--y":"60%", "--d":"9s", "--s":"0.25"}}></span>
    <span className="particle" style={{"--x":"45%", "--y":"10%", "--d":"6.5s", "--s":"0.45"}}></span>
  </div>

  {/*  Main Layout  */}
  <div className="login-layout">

    {/*  Left Panel — Branding  */}
    <aside className="login-panel-left" id="login-panel-left">
      <Link to="/" className="login-logo" id="login-logo">
        <span className="logo-icon">✦</span>
        <span className="logo-text">Teachers Companion AI</span>
      </Link>

      <div className="panel-content">
        <div className="panel-badge">
          <span className="badge-dot"></span>
          AI-Powered for Educators
        </div>
        {/*  Trust Bar  */}
        <div className="panel-trust">
          <div className="trust-avatars">
            <img src="https://i.pravatar.cc/28?img=1" alt="Teacher" className="trust-avatar" />
            <img src="https://i.pravatar.cc/28?img=5" alt="Teacher" className="trust-avatar" />
            <img src="https://i.pravatar.cc/28?img=9" alt="Teacher" className="trust-avatar" />
            <img src="https://i.pravatar.cc/28?img=12" alt="Teacher" className="trust-avatar" />
          </div>
          <span className="trust-stars">★★★★★</span>
          <span className="trust-score"><strong>4.9/5</strong> · 3,800+ educators</span>
        </div>
        <h1 className="panel-headline">
          Teach smarter,<br />
          <span className="gradient-text">not harder.</span>
        </h1>
        <p className="panel-subtext">
          Join thousands of teachers who use AI to plan better lessons, grade in minutes, and truly understand every
          student — all in one place.
        </p>

        {/*  Feature Pills  */}
        <div className="panel-features">
          <div className="panel-feature">
            <span className="pf-icon">📋</span>
            <span>Instant AI lesson plans</span>
          </div>
          <div className="panel-feature">
            <span className="pf-icon">✅</span>
            <span>Smart auto-grading</span>
          </div>
          <div className="panel-feature">
            <span className="pf-icon">📊</span>
            <span>Real-time student insights</span>
          </div>
          <div className="panel-feature">
            <span className="pf-icon">💬</span>
            <span>AI parent communication</span>
          </div>
        </div>

      </div>
    </aside>

    {/*  Right Panel — Auth Form  */}
    <main className="login-panel-right" id="login-panel-right">
      <div className="auth-card" id="auth-card">
        {/*  Back link  */}
        <Link to="/" className="back-link" id="back-link">←</Link>
        {/*  Header  */}
        <div className="auth-header">
          <h2 className="auth-title">Get Started</h2>
          <p className="auth-subtitle">Create your free Teachers Companion AI account</p>
        </div>

        {success && (
          <div style={{padding:'12px 16px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:'8px', color:'#10b981', marginBottom:'1rem', textAlign:'center'}}>
            ✅ Account created! Check your email to confirm, then <Link to="/login" style={{color:'#10b981', fontWeight:600}}>sign in</Link>.
          </div>
        )}

        {/*  Social Login Buttons  */}
        <div className="social-buttons" id="social-buttons">
          {/*  Google  */}
          <button className="social-btn social-btn-google" id="btn-google" type="button" onClick={handleGoogleSignup}>
            <svg className="social-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span>Continue with Google</span>
          </button>

        </div>

        {/*  Divider  */}
        <div className="auth-divider">
          <span className="divider-line"></span>
          <span className="divider-text">or sign up with email</span>
          <span className="divider-line"></span>
        </div>

        {/*  Email Form  */}
        <form className="auth-form" id="auth-form" noValidate onSubmit={handleSignup}>
          {error && <div style={{padding:'10px 14px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'8px', color:'#ef4444', marginBottom:'1rem', textAlign:'center', fontSize:'0.875rem'}}>{error}</div>}

          <div className="form-group" id="fg-name">
            <label htmlFor="name" className="form-label">Full Name</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </span>
              <input type="text" id="name" name="name" className="form-input" placeholder="e.g. Sarah Johnson" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>

          <div className="form-group" id="fg-email">
            <label htmlFor="email" className="form-label">Email address</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </span>
              <input type="email" id="email" name="email" className="form-input" placeholder="you@school.edu" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="form-group" id="fg-password">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input type="password" id="password" name="password" className="form-input" placeholder="Create a password (min. 6 characters)" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>

          {/*  Submit  */}
          <button type="submit" className="btn-primary btn-submit" id="btn-submit" disabled={loading}>
            <span className="submit-text">{loading ? 'Creating Account...' : 'Create Account'}</span>
            <span className="submit-spinner" id="submit-spinner" aria-hidden="true" style={{display: loading ? 'inline-block' : 'none'}}></span>
          </button>
        </form>

        {/*  Sign In link  */}
        <p className="auth-footer-text">
          Already have an account?
          <Link to="/login" className="auth-link" id="login-link">Sign In →</Link>
        </p>

        {/*  Security Note  */}
        <div className="security-note">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>256-bit encrypted · FERPA compliant · Your data is private</span>
        </div>
      </div>
    </main>
  </div>
        </>
    );
};

export default Signup;