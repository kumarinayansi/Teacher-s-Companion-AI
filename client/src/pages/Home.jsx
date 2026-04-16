
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Home = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // If a user is already signed in (e.g. returning visitor or post-OAuth redirect),
        // send them straight to their dashboard instead of showing the landing page.
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) navigate('/dashboard', { replace: true });
        });
        // Handle the edge case where OAuth fires SIGNED_IN on the home page
        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
            if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
                navigate('/dashboard', { replace: true });
            }
        });
        return () => listener.subscription.unsubscribe();
    }, [navigate]);


    return (
        <>
            

  {/*  Navigation  */}
  <nav className="navbar" id="navbar">
    <div className="nav-container">
      <a href="#" className="nav-logo" id="nav-logo">
        <span className="logo-icon">✦</span>
        <span className="logo-text">Teachers Companion AI</span>
      </a>
      <div className="nav-links" id="nav-links">
        <a href="#features" className="nav-link">Features</a>
        <a href="#how-it-works" className="nav-link">How It Works</a>
        <a href="#testimonials" className="nav-link">Reviews</a>
        <a href="#pricing" className="nav-link">Pricing</a>
      </div>
      <div className="nav-actions">
        <Link to="/login" className="btn-ghost" id="nav-signin">Sign In</Link>
        <Link to="/signup" className="btn-primary" id="nav-cta">Get Started Free</Link>
      </div>
      <button className="hamburger" id="hamburger" aria-label="Open menu">
        <span></span><span></span><span></span>
      </button>
    </div>
    {/*  Mobile Menu  */}
    <div className="mobile-menu" id="mobile-menu">
      <a href="#features" className="mobile-link">Features</a>
      <a href="#how-it-works" className="mobile-link">How It Works</a>
      <a href="#testimonials" className="mobile-link">Reviews</a>
      <a href="#pricing" className="mobile-link">Pricing</a>
      <Link to="/signup" className="btn-primary mobile-cta">Get Started Free</Link>
    </div>
  </nav>

  {/*  Hero Section  */}
  <section className="hero" id="hero">
    <div className="hero-bg">
      <div className="hero-glow hero-glow-1"></div>
      <div className="hero-glow hero-glow-2"></div>
      <div className="hero-grid"></div>
    </div>
    <div className="hero-container">
      <div className="hero-badge" id="hero-badge">
        <span className="badge-dot"></span>
        <span>AI-Powered for Educators</span>
      </div>
      <h1 className="hero-title" id="hero-title">
        Your Classroom's<br />
        <span className="gradient-text">AI Companion</span>
      </h1>
      <p className="hero-subtitle" id="hero-subtitle">
        Teacher's Companion AI handles lesson planning, grading, and student tracking —<br className="break-desktop" />
        so you can focus on what truly matters: <strong>teaching.</strong>
      </p>
      <div className="hero-actions" id="hero-actions">
        <Link to="/signup" className="btn-primary btn-large" id="hero-cta-primary">
          Start Teaching Smarter
          <span className="btn-arrow">→</span>
        </Link>
        <a href="#how-it-works" className="btn-secondary btn-large" id="hero-cta-secondary">
          See How It Works
        </a>
      </div>
      <div className="trust-bar" id="trust-bar">
        <div className="trust-avatars">
          <img src="https://i.pravatar.cc/32?img=1" alt="Teacher" className="trust-avatar" />
          <img src="https://i.pravatar.cc/32?img=5" alt="Teacher" className="trust-avatar" />
          <img src="https://i.pravatar.cc/32?img=9" alt="Teacher" className="trust-avatar" />
          <img src="https://i.pravatar.cc/32?img=12" alt="Teacher" className="trust-avatar" />
        </div>
        <div className="trust-info">
          <div className="trust-stars">★★★★★</div>
          <span className="trust-text"><strong>4.9/5</strong> from 3,800+ educators</span>
        </div>
      </div>
    </div>
    {/*  Dashboard Preview  */}
    <div className="hero-visual" id="hero-visual">
      <div className="dashboard-frame">
        <div className="dashboard-header">
          <div className="dash-dots">
            <span className="dd red"></span>
            <span className="dd yellow"></span>
            <span className="dd green"></span>
          </div>
          <span className="dash-title">Teacher's Companion — Dashboard</span>
          <div className="dash-badge">● Live</div>
        </div>
        <div className="dashboard-body">
          <div className="dash-sidebar">
            <div className="dash-nav-item active"><span>⊞</span> Dashboard</div>
            <div className="dash-nav-item"><span>📚</span> Lessons</div>
            <div className="dash-nav-item"><span>👥</span> Students</div>
            <div className="dash-nav-item"><span>✅</span> Grading</div>
            <div className="dash-nav-item"><span>📊</span> Analytics</div>
            <div className="dash-nav-item"><span>⚙</span> Settings</div>
          </div>
          <div className="dash-main">
            <div className="dash-row">
              <div className="dash-stat-card">
                <span className="stat-label">Students</span>
                <span className="stat-value">142</span>
                <span className="stat-change positive">+12 this week</span>
              </div>
              <div className="dash-stat-card">
                <span className="stat-label">Lessons Planned</span>
                <span className="stat-value">38</span>
                <span className="stat-change positive">+5 today</span>
              </div>
              <div className="dash-stat-card">
                <span className="stat-label">Assignments Graded</span>
                <span className="stat-value">97%</span>
                <span className="stat-change positive">AI Assisted</span>
              </div>
            </div>
            <div className="dash-chart-area">
              <div className="chart-label">Student Performance — This Month</div>
              <div className="chart-bars">
                <div className="chart-bar" style={{ "--h": "60%" }}><span>Week 1</span></div>
                <div className="chart-bar" style={{ "--h": "75%" }}><span>Week 2</span></div>
                <div className="chart-bar" style={{ "--h": "55%" }}><span>Week 3</span></div>
                <div className="chart-bar" style={{ "--h": "90%" }}><span>Week 4</span></div>
              </div>
            </div>
            <div className="dash-ai-row">
              <div className="ai-chip">✦ AI Suggestion: Create a quiz on Chapter 7</div>
              <div className="ai-chip">✦ 3 students need extra support in Math</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  {/*  Philosophy / Quote Section  */}
  <section className="philosophy-section" id="philosophy">
    <div className="philosophy-bg">
      <div className="philosophy-glow"></div>
    </div>
    <div className="philosophy-container">
      <p className="philosophy-tagline">Built for educators, not administrators</p>
      <h2 className="philosophy-quote">
        Intelligent planning,<br />
        <span className="philosophy-dim">effortless grading, and</span><br />
        <span className="gradient-text">real student insights.</span>
      </h2>
    </div>
  </section>

  {/*  Features Section  */}
  <section className="features-section" id="features">
    <div className="section-container">
      <div className="section-header">
        <span className="section-label">What We Offer</span>
        <h2 className="section-title">Everything a teacher needs,<br />powered by AI</h2>
        <p className="section-subtitle">Stop juggling dozens of tools. TeacherAI brings it all together in one elegant
          platform.</p>
      </div>
      <div className="features-grid" id="features-grid">
        <div className="feature-card" id="feature-lesson">
          <div className="feature-icon">📋</div>
          <h3 className="feature-title">Instant Lesson Plans</h3>
          <p className="feature-desc">Generate standards-aligned lesson plans in seconds. Just enter your topic, grade, and
            duration — AI does the rest.</p>
          <div className="feature-tag">Saves 3+ hours/week</div>
        </div>
        <div className="feature-card feature-card-accent" id="feature-grading">
          <div className="feature-icon">✅</div>
          <h3 className="feature-title">Smart Auto-Grading</h3>
          <p className="feature-desc">AI reviews essays, short answers, and quizzes — providing rubric-based feedback so
            your students always know how to improve.</p>
          <div className="feature-tag">80% faster grading</div>
        </div>
        <div className="feature-card" id="feature-insights">
          <div className="feature-icon">📊</div>
          <h3 className="feature-title">Student Insights</h3>
          <p className="feature-desc">Track every student's progress with real-time analytics. Spot learning gaps before
            they become problems.</p>
          <div className="feature-tag">Data-driven teaching</div>
        </div>
        <div className="feature-card" id="feature-differentiation">
          <div className="feature-icon">🎯</div>
          <h3 className="feature-title">Differentiated Learning</h3>
          <p className="feature-desc">Auto-generate modified assignments for different learning levels, IEPs, and ESL
            students — in one click.</p>
          <div className="feature-tag">Inclusive by design</div>
        </div>
        <div className="feature-card" id="feature-communication">
          <div className="feature-icon">💬</div>
          <h3 className="feature-title">Parent Communication</h3>
          <p className="feature-desc">Draft professional parent emails, progress reports, and newsletters with AI-polished
            language, instantly.</p>
          <div className="feature-tag">Professional tone, always</div>
        </div>
        <div className="feature-card" id="feature-standards">
          <div className="feature-icon">🏫</div>
          <h3 className="feature-title">Curriculum Alignment</h3>
          <p className="feature-desc">Every lesson and assessment is automatically aligned to Common Core, NGSS, or your
            school's custom standards.</p>
          <div className="feature-tag">Always compliant</div>
        </div>
      </div>
    </div>
  </section>

  {/*  Marquee / Stats Section  */}
  <section className="marquee-section" id="marquee-section">
    <div className="marquee-track">
      <div className="marquee-inner" id="marquee-inner">
        <span className="marquee-item">📋 Lesson Plans</span>
        <span className="marquee-item">✅ Auto-Grading</span>
        <span className="marquee-item">📊 Analytics</span>
        <span className="marquee-item">💬 Parent Reports</span>
        <span className="marquee-item">🎯 Differentiation</span>
        <span className="marquee-item">🏫 Curriculum Alignment</span>
        <span className="marquee-item">📖 Reading Analysis</span>
        <span className="marquee-item">🧪 Quiz Generator</span>
        <span className="marquee-item">📋 Lesson Plans</span>
        <span className="marquee-item">✅ Auto-Grading</span>
        <span className="marquee-item">📊 Analytics</span>
        <span className="marquee-item">💬 Parent Reports</span>
        <span className="marquee-item">🎯 Differentiation</span>
        <span className="marquee-item">🏫 Curriculum Alignment</span>
        <span className="marquee-item">📖 Reading Analysis</span>
        <span className="marquee-item">🧪 Quiz Generator</span>
      </div>
    </div>
  </section>

  {/*  How It Works  */}
  <section className="how-section" id="how-it-works">
    <div className="section-container">
      <div className="section-header">
        <span className="section-label">Simple Setup</span>
        <h2 className="section-title">From sign-up to smarter<br />teaching in 3 steps</h2>
        <Link to="/signup" className="how-cta-link" id="how-cta-link">Create your free account →</Link>
      </div>
      <div className="steps-grid" id="steps-grid">
        <div className="step-card" id="step-1">
          <div className="step-number">01</div>
          <div className="step-content">
            <h3 className="step-title">Create Your Account</h3>
            <p className="step-desc">Sign up in under 60 seconds. Connect your school info, grade levels, and subjects —
              TeacherAI personalizes everything for you.</p>
          </div>
          <div className="step-visual">
            <div className="step-ui step-ui-signup">
              <div className="sui-label">School Setup</div>
              <div className="sui-input">Grade 5 · Math & Science</div>
              <div className="sui-input">Common Core Standards</div>
              <div className="sui-btn">✓ Account Ready</div>
            </div>
          </div>
        </div>
        <div className="step-card" id="step-2">
          <div className="step-number">02</div>
          <div className="step-content">
            <h3 className="step-title">Add Your Students</h3>
            <p className="step-desc">Import your roster from Google Classroom, CSV, or enter manually. AI starts building
              each student's learning profile immediately.</p>
          </div>
          <div className="step-visual">
            <div className="step-ui step-ui-students">
              <div className="sui-label">Student Profiles — Active</div>
              <div className="sui-student"><span className="stu-avatar">👧</span> Emma R. · Grade A</div>
              <div className="sui-student"><span className="stu-avatar">👦</span> Liam K. · Needs Support</div>
              <div className="sui-student"><span className="stu-avatar">👧</span> Sofia M. · Advanced</div>
            </div>
          </div>
        </div>
        <div className="step-card" id="step-3">
          <div className="step-number">03</div>
          <div className="step-content">
            <h3 className="step-title">Let AI Do the Heavy Lifting</h3>
            <p className="step-desc">Ask TeacherAI to plan your week, grade last night's quiz, or draft your parent
              newsletter. Save hours every single day.</p>
          </div>
          <div className="step-visual">
            <div className="step-ui step-ui-ai">
              <div className="sui-label">AI Companion — Active</div>
              <div className="sui-chat">
                <div className="chat-bubble user">Plan Monday's math lesson on fractions</div>
                <div className="chat-bubble ai">✦ Done! Here's a 45-min lesson with 3 activities, a warm-up, and an exit
                  ticket aligned to CCSS.Math.5.NF.A.1</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  {/*  Testimonials  */}
  <section className="testimonials-section" id="testimonials">
    <div className="section-container">
      <div className="section-header">
        <span className="section-label">Real Educators, Real Results</span>
        <h2 className="section-title">Teachers love Teachers Companion AI</h2>
      </div>
      <div className="testimonials-track" id="testimonials-track">
        <div className="testimonials-slider" id="testimonials-slider">
          <div className="testimonial-card active" id="testimonial-0">
            <div className="testimonial-stars">★★★★★</div>
            <p className="testimonial-quote">"I used to spend my weekends grading. Now I get them back. TeacherAI handles
              90% of my grading with better, more detailed feedback than I could write alone in half the time."</p>
            <div className="testimonial-author">
              <img src="https://i.pravatar.cc/48?img=5" alt="Sarah J." className="author-avatar" />
              <div>
                <div className="author-name">Sarah Johnson</div>
                <div className="author-role">5th Grade Teacher · Austin, TX</div>
              </div>
            </div>
          </div>
          <div className="testimonial-card" id="testimonial-1">
            <div className="testimonial-stars">★★★★★</div>
            <p className="testimonial-quote">"The lesson planning feature is unbelievable. I describe what I want and it
              generates a complete, standards-aligned plan in literally 10 seconds. It changed how I teach."</p>
            <div className="testimonial-author">
              <img src="https://i.pravatar.cc/48?img=12" alt="Marcus T." className="author-avatar" />
              <div>
                <div className="author-name">Marcus Thompson</div>
                <div className="author-role">High School Biology · Denver, CO</div>
              </div>
            </div>
          </div>
          <div className="testimonial-card" id="testimonial-2">
            <div className="testimonial-stars">★★★★★</div>
            <p className="testimonial-quote">"The student insights dashboard helped me identify three struggling students in
              week one. I connected them with extra resources early. Their end-of-term scores improved by 28%."</p>
            <div className="testimonial-author">
              <img src="https://i.pravatar.cc/48?img=9" alt="Priya N." className="author-avatar" />
              <div>
                <div className="author-name">Priya Nair</div>
                <div className="author-role">Middle School Math · San Jose, CA</div>
              </div>
            </div>
          </div>
        </div>
        <div className="testimonial-controls" id="testimonial-controls">
          <button className="t-btn" id="t-prev" aria-label="Previous">← Previous</button>
          <div className="t-dots" id="t-dots">
            <span className="t-dot active" data-idx="0"></span>
            <span className="t-dot" data-idx="1"></span>
            <span className="t-dot" data-idx="2"></span>
          </div>
          <button className="t-btn" id="t-next" aria-label="Next">Next →</button>
        </div>
      </div>
    </div>
  </section>

  {/*  Pricing Section  */}
  <section className="pricing-section" id="pricing">
    <div className="pricing-bg">
      <div className="pricing-glow"></div>
    </div>
    <div className="section-container">
      <div className="section-header">
        <span className="section-label">Pricing</span>
        <h2 className="section-title">Simple, honest pricing<br />for educators</h2>
        <p className="section-subtitle">No hidden fees. Cancel anytime. Loved by over 3,800 teachers.</p>
      </div>
      <div className="pricing-grid" id="pricing-grid">
        <div className="pricing-card" id="plan-free">
          <div className="plan-label">Starter</div>
          <div className="plan-price">
            <span className="price-amount">Free</span>
          </div>
          <p className="plan-desc">Perfect for trying out Teachers Companion AI</p>
          <ul className="plan-features">
            <li>✅ 5 AI lesson plans/month</li>
            <li>✅ 30 auto-gradeable assignments</li>
            <li>✅ Up to 30 students</li>
            <li>✅ Basic analytics</li>
            <li className="dim">✗ Parent communication tools</li>
            <li className="dim">✗ Curriculum alignment</li>
          </ul>
          <Link to="/signup" className="btn-secondary plan-btn" id="plan-free-btn">Start for Free</Link>
        </div>
        <div className="pricing-card pricing-card-featured" id="plan-pro">
          <div className="featured-badge">Most Popular</div>
          <div className="plan-label">Pro Teacher</div>
          <div className="plan-price">
            <span className="price-amount">$12</span>
            <span className="price-period">/month</span>
          </div>
          <p className="plan-desc">For individual educators who want it all</p>
          <ul className="plan-features">
            <li>✅ Unlimited lesson plans</li>
            <li>✅ Unlimited auto-grading</li>
            <li>✅ Up to 150 students</li>
            <li>✅ Advanced analytics & insights</li>
            <li>✅ Parent communication suite</li>
            <li>✅ Curriculum alignment (CCSS, NGSS)</li>
          </ul>
          <Link to="/signup" className="btn-primary plan-btn" id="plan-pro-btn">Start 14-Day Trial</Link>
        </div>
        <div className="pricing-card" id="plan-school">
          <div className="plan-label">School / District</div>
          <div className="plan-price">
            <span className="price-amount">Custom</span>
          </div>
          <p className="plan-desc">For schools and districts at scale</p>
          <ul className="plan-features">
            <li>✅ Everything in Pro</li>
            <li>✅ Unlimited students & teachers</li>
            <li>✅ Admin oversight & reporting</li>
            <li>✅ LMS integrations (Canvas, Schoology)</li>
            <li>✅ Dedicated onboarding & support</li>
            <li>✅ FERPA & data privacy compliance</li>
          </ul>
          <a href="#" className="btn-secondary plan-btn" id="plan-school-btn">Contact Sales</a>
        </div>
      </div>
    </div>
  </section>

  {/*  CTA Section  */}
  <section className="cta-section" id="cta-section">
    <div className="cta-bg">
      <div className="cta-glow-1"></div>
      <div className="cta-glow-2"></div>
    </div>
    <div className="cta-container">
      <h2 className="cta-title">Ready to reclaim<br /><span className="gradient-text">your teaching time?</span></h2>
      <p className="cta-subtitle">Join 3,800+ educators already using TeacherAI to plan smarter, grade faster, and teach
        better.</p>
      <Link to="/signup" className="btn-primary btn-large cta-btn" id="cta-main-btn">
        Get Started for Free
        <span className="btn-arrow">→</span>
      </Link>
      <p className="cta-note">No credit card required · Free plan always available</p>
    </div>
  </section>

  {/*  Footer  */}
  <footer className="footer" id="footer">
    <div className="footer-container">
      <div className="footer-brand">
        <a href="#" className="nav-logo footer-logo">
          <span className="logo-icon">✦</span>
          <span className="logo-text">Teachers Companion AI</span>
        </a>
        <p className="footer-tagline">The AI companion built for educators who care about their students and their time.</p>
        <div className="footer-social">
          <a href="#" className="social-link" aria-label="Twitter">𝕏</a>
          <a href="#" className="social-link" aria-label="LinkedIn">in</a>
          <a href="#" className="social-link" aria-label="Instagram">◈</a>
        </div>
      </div>
      <div className="footer-links">
        <div className="footer-col">
          <h4 className="footer-col-title">Product</h4>
          <a href="#" className="footer-link">Features</a>
          <a href="#" className="footer-link">Pricing</a>
          <a href="#" className="footer-link">Changelog</a>
          <a href="#" className="footer-link">Roadmap</a>
        </div>
        <div className="footer-col">
          <h4 className="footer-col-title">Educators</h4>
          <a href="#" className="footer-link">For Teachers</a>
          <a href="#" className="footer-link">For Schools</a>
          <a href="#" className="footer-link">For Districts</a>
          <a href="#" className="footer-link">Case Studies</a>
        </div>
        <div className="footer-col">
          <h4 className="footer-col-title">Company</h4>
          <a href="#" className="footer-link">About Us</a>
          <a href="#" className="footer-link">Blog</a>
          <a href="#" className="footer-link">Careers</a>
          <a href="#" className="footer-link">Contact</a>
        </div>
        <div className="footer-col">
          <h4 className="footer-col-title">Legal</h4>
          <a href="#" className="footer-link">Privacy Policy</a>
          <a href="#" className="footer-link">Terms of Service</a>
          <a href="#" className="footer-link">FERPA Compliance</a>
          <a href="#" className="footer-link">Cookie Policy</a>
        </div>
      </div>
    </div>
    <div className="footer-bottom">
      <p>© 2026 Teachers Companion AI. All rights reserved. Made with ❤️ for educators worldwide.</p>
    </div>
  </footer>

  

        </>
    );
};

export default Home;
        