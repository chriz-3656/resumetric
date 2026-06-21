import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Chart as ChartJS,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Radar, Doughnut, Bar } from 'react-chartjs-2';
import { BrowserRouter, Routes, Route, Link, useLocation, useParams } from 'react-router-dom';
import './styles.css';
import { supabase } from './supabase.js';
import { LoginPage, SignUpPage, ForgotPasswordPage, ResetPasswordPage } from './AuthPages.jsx';
import { DashboardPage } from './DashboardPage.jsx';
import { ContactPage } from './ContactPage.jsx';
import { AdminMessagesPage } from './AdminMessagesPage.jsx';

ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement);

const apiBase = import.meta.env.VITE_API_BASE_URL || '';

// In production on Vercel, we must use relative paths to avoid localhost hardcoding.
const apiRoot = window.location.hostname === 'localhost' ? apiBase : '';

const industries = ['Auto-Detect', 'Cybersecurity', 'Accounting', 'Finance', 'Marketing', 'Software Engineering', 'Data Science', 'Cloud Computing', 'Networking', 'HR', 'Project Management'];
const hallOfFame = [
  { site: 'Cloud Security Lead', score: 94, tier: 'Top' },
  { site: 'Finance Analyst', score: 91, tier: 'Top' },
  { site: 'No-Summary Resume', score: 38, tier: 'Flop' },
  { site: 'Keyword-Stuffed Resume', score: 42, tier: 'Flop' }
];

function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  const [booting, setBooting] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  React.useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => setBooting(false), 2400);
    return () => clearTimeout(timer);
  }, []);

  if (booting) return <SplashScreen />;

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="app-shell">
        <Header session={session} menuOpen={menuOpen} setMenuOpen={setMenuOpen} theme={theme} setTheme={setTheme} />
        <Routes>
          <Route path="/" element={<LandingPage session={session} />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/dashboard" element={<DashboardPage session={session} />} />
          <Route path="/contact" element={<ContactPage session={session} />} />
          <Route path="/admin/messages" element={<AdminMessagesPage session={session} />} />
          <Route path="/r/:id" element={<SharePage />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

function SharePage() {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');

  React.useEffect(() => {
    async function fetchShared() {
      try {
        const response = await fetch(`${apiRoot}/api/share/${id}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setAnalysis({ analysis: data.analysis });
      } catch (err) {
        setError(err.message);
      }
    }
    fetchShared();
  }, [id]);

  if (error) return <main className="static-page"><div className="error-module">{error}</div></main>;
  if (!analysis) return <main className="static-page"><div className="system-status"><span className="pulse-dot"/><span>Loading report...</span></div></main>;

  return (
    <main>
      <section className="page-header text-center" style={{marginTop: '4rem', maxWidth: '900px', margin: '4rem auto', padding: '0 2rem'}}>
        <span className="header-tag">Shared Report</span>
        <h1>Resume Analysis</h1>
      </section>
      <Dashboard analysis={analysis} readOnly />
      <ResumeHeatmap heatmapData={analysis.analysis.heatmapData} />
    </main>
  );
}

function LandingPage({ session }) {
  const [file, setFile] = useState(null);
  const [industry, setIndustry] = useState('Auto-Detect');
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [diagnosing, setDiagnosing] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [rewrite, setRewrite] = useState(null);

  React.useEffect(() => {
    if (analysis) {
      setTimeout(() => {
        document.getElementById('scores')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [analysis]);

  async function analyze() {
    if (!file) return setError('Upload a PDF or DOCX resume first.');
    if (file.size > 8 * 1024 * 1024) return setError('File exceeds the 8MB limit. Please compress your document.');
    
    setError('');
    setLoading(true);
    setProgress(5);
    setDiagnosing('Parsing your resume...');
    
    const form = new FormData();
    form.append('resume', file);
    form.append('industry', industry);
    form.append('jobDescription', jobDescription);
    
    const headers = {};
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    try {
      const response = await fetch(`${apiRoot}/api/analyze`, {
        method: 'POST',
        headers,
        body: form
      });
      
      if (response.status === 429) {
        throw new Error('Rate limit reached. Please wait 60 seconds before submitting another review.');
      }
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Analysis failed');
      
      const steps = [
        { progress: 25, status: 'Reading resume content...' },
        { progress: 45, status: 'Simulating ATS scan...' },
        { progress: 65, status: 'Evaluating recruiter perspective...' },
        { progress: 85, status: 'Building your report...' },
        { progress: 100, status: 'Finalizing recommendations...' }
      ];

      for (const step of steps) {
        setDiagnosing(step.status);
        setProgress(step.progress);
        await new Promise(r => setTimeout(r, 600));
      }

      setAnalysis(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setDiagnosing(null);
    }
  }

  async function generateRewrite() {
    if (!analysis?.resumeText) return;
    setRewrite({ loading: true });
    const response = await fetch(`${apiRoot}/api/rewrite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText: analysis.resumeText, industry, jobDescription })
    });
    setRewrite(await response.json());
  }

  async function downloadReport() {
    if (!analysis) return;
    const response = await fetch(`${apiRoot}/api/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analysis)
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ats-report.pdf';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main>
      {diagnosing && <DiagnosticOverlay status={diagnosing} progress={progress} />}
      <Hero
        file={file}
        setFile={setFile}
        industry={industry}
        setIndustry={setIndustry}
        jobDescription={jobDescription}
        setJobDescription={setJobDescription}
        loading={loading}
        progress={progress}
        error={error}
        analyze={analyze}
      />
      {analysis ? (
        <>
          <Dashboard analysis={analysis} onReport={downloadReport} onRewrite={generateRewrite} />
          <ResumeHeatmap heatmapData={analysis.analysis.heatmapData} />
          <Coach analysis={analysis} rewrite={rewrite} />
        </>
      ) : (
        <>
          <ResumeMockup />
          <HowItWorks />
          <UploadSection />
          <HallOfFame />
          <TrustSection />
          <TestimonialSlider />
        </>
      )}
    </main>
  );
}

const testimonials = [
  { quote: "ResuMetric found keyword gaps I completely missed. My callback rate doubled in two weeks.", author: "Sarah J.", role: "Senior Frontend Engineer" },
  { quote: "The ATS simulation showed exactly why my PDF was being rejected. I fixed it and got three interviews.", author: "David T.", role: "Product Manager" },
  { quote: "Finally, a tool that gives actionable feedback instead of generic advice. Results came back in seconds.", author: "Elena M.", role: "Data Scientist" },
  { quote: "I optimized my resume using the analysis insights and landed interviews at two top tech companies.", author: "Michael R.", role: "Cloud Architect" },
  { quote: "The recruiter perspective analysis helped me reframe my experience to focus on measurable impact.", author: "Priya K.", role: "Marketing Director" }
];

function TestimonialSlider() {
  const scrollItems = [...testimonials, ...testimonials]; // Duplicate for seamless loop

  return (
    <section className="testimonials-section">
      <div className="section-header text-center">
        <span className="header-tag">What People Say</span>
        <h2>Real Results from Real Professionals</h2>
      </div>
      <div className="slider-container">
        <div className="slider-track">
          {scrollItems.map((item, index) => (
            <div key={index} className="testimonial-card">
              <p className="testimonial-quote">"{item.quote}"</p>
              <div className="testimonial-author">
                <strong>{item.author}</strong>
                <span>{item.role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ResumeMockup() {
  return (
    <section className="resume-mockup">
      <div className="mockup-wrapper">
        <div className="ats-score-stamp">
          <span className="score-number">87</span>
          <span className="score-label">ATS</span>
        </div>
        <div className="mockup-resume">
          <h4>Jordan Mitchell</h4>
          <p className="subtitle">Senior Product Manager · San Francisco, CA</p>
          <div className="mockup-section">
            <h5>Experience</h5>
            <p><strong>Lead Product Manager</strong> — Acme Corp, 2021–Present</p>
            <p>Led cross-functional team of 12 to deliver enterprise SaaS platform, increasing ARR by 34% in first year.</p>
            <p>Reduced customer churn by 18% through data-driven onboarding redesign.</p>
          </div>
          <div className="mockup-section">
            <h5>Education</h5>
            <p><strong>MBA, Business Strategy</strong> — Stanford GSB, 2019</p>
            <p><strong>B.S. Computer Science</strong> — UC Berkeley, 2015</p>
          </div>
          <div className="mockup-section">
            <h5>Skills</h5>
            <p>Product Strategy · Agile · SQL · Figma · Stakeholder Management · A/B Testing · OKRs</p>
          </div>
        </div>
        <div className="mockup-annotations">
          <div className="annotation success">
            ✓ Strong — "Increased ARR by 34%" is exactly the kind of quantified impact recruiters look for.
          </div>
          <div className="annotation warning">
            △ Missing quantified result in onboarding bullet. Consider adding specific metrics.
          </div>
          <div className="annotation danger">
            ✕ No measurable outcome for skills section. Add certifications or project outcomes.
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="how-it-works-section">
      <div className="section-header text-center">
        <span className="header-tag">How It Works</span>
        <h2>Three things that determine your resume's fate</h2>
      </div>
      <div className="how-cards">
        <div className="how-card">
          <span className="step-number">01 PARSE</span>
          <h3>Can a machine even read it?</h3>
          <p>Before a human ever sees your resume, an ATS tries to extract your name, job titles, dates, and skills. If your formatting confuses the parser, your application is lost before it begins.</p>
        </div>
        <div className="how-card">
          <span className="step-number">02 MATCH</span>
          <h3>Does it speak the job's language?</h3>
          <p>ATS systems compare your resume against the job description looking for keyword matches. If you're using different terminology than the posting, your relevance score drops — even if you're perfectly qualified.</p>
        </div>
        <div className="how-card">
          <span className="step-number">03 IMPACT</span>
          <h3>Does it prove the work mattered?</h3>
          <p>Recruiters spend 6–8 seconds on initial review. They look for quantified achievements — revenue generated, costs saved, teams led. Vague descriptions get passed over for concrete results.</p>
        </div>
      </div>
    </section>
  );
}

function UploadSection() {
  return (
    <section className="about-section">
      <div className="section-header text-center">
        <span className="header-tag">Get Started</span>
        <h2>Upload once. Get the full picture.</h2>
      </div>
      <div className="trust-indicators" style={{justifyContent: 'center'}}>
        <span className="trust-indicator-item"><span className="check">✓</span> PDF and DOCX supported</span>
        <span className="trust-indicator-item"><span className="check">✓</span> Auto industry detection</span>
        <span className="trust-indicator-item"><span className="check">✓</span> Job-specific matching</span>
        <span className="trust-indicator-item"><span className="check">✓</span> Secure processing</span>
        <span className="trust-indicator-item"><span className="check">✓</span> No account required</span>
      </div>
    </section>
  );
}

function TrustSection() {
  const items = [
    { icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>, title: 'ATS-Focused Analysis', desc: 'See exactly how applicant tracking systems read and score your resume.' },
    { icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>, title: 'Recruiter Simulation', desc: 'Understand how a human recruiter would evaluate your experience.' },
    { icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>, title: 'Industry-Specific Reviews', desc: 'Analysis calibrated to your target industry and role expectations.' },
    { icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>, title: 'Keyword Intelligence', desc: 'Discover missing keywords that could be costing you interviews.' },
    { icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>, title: 'Actionable Recommendations', desc: 'Get specific, prioritized improvements — not generic advice.' },
    { icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>, title: 'Secure Processing', desc: 'Your resume is processed securely and never stored permanently.' },
  ];

  return (
    <section className="trust-section">
      <div className="section-header text-center">
        <span className="header-tag">Why ResuMetric</span>
        <h2>Why professionals trust ResuMetric</h2>
      </div>
      <div className="trust-grid">
        {items.map((item, i) => (
          <div key={i} className="trust-item">
            <div className="trust-icon">{item.icon}</div>
            <div>
              <h4>{item.title}</h4>
              <p>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AboutPage() {
  return (
    <main className="static-page">
      <section className="page-header">
        <span className="header-tag">About Us</span>
        <h1>About ResuMetric</h1>
      </section>
      <AboutSection />
      <section className="content-section">
        <div className="section-grid" style={{ marginBottom: '3rem' }}>
          <div className="text-block">
            <h3>Our Mission</h3>
            <p>
              We believe that landing your dream job shouldn't depend on how well you can guess what a screening algorithm wants. Our mission is to democratize career advice by providing everyone with access to the same high-level insights previously reserved for those who could afford professional resume writers and career consultants.
            </p>
          </div>
          <div className="text-block">
            <h3>How It Works</h3>
            <p>
              Built on modern AI technology, ResuMetric analyzes your resume 
              the exact same way recruiters and enterprise applicant tracking systems do. 
              Our platform identifies structural issues, keyword gaps, and 
              formatting problems that cause perfectly qualified candidates to get overlooked.
            </p>
          </div>
        </div>
        <div className="section-grid">
          <div className="text-block">
            <h3>The Creator</h3>
            <p>
              ResuMetric is proudly developed by <strong>Chriz</strong>, a 20-year-old solo developer and cybersecurity student based in Kerala. Combining a deep understanding of security with a passion for building practical, high-impact software, he created this platform to give job seekers transparent, data-driven feedback on their resumes — pulling back the curtain on the often opaque hiring process.
            </p>
            <p style={{ marginTop: '1rem' }}>
              <a href="https://chriz-3656.github.io" target="_blank" rel="noopener noreferrer" className="secondary-action" style={{ display: 'inline-block', padding: '0.4rem 1rem', fontSize: '0.9rem', textDecoration: 'none' }}>
                View Developer Portfolio ↗
              </a>
            </p>
          </div>
          <div className="text-block">
            <h3>Our Methodology</h3>
            <p>
              We've analyzed thousands of successful and unsuccessful resumes across dozens of industries. Our scoring system carefully weighs ATS parsability, semantic keyword relevance, and the presence of quantified achievements to give you a highly accurate, actionable prediction of how your resume will perform in the real world.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function BlogPage() {
  const posts = [
    { title: "How ATS Systems Are Changing in 2026", date: "June 12, 2026", snippet: "Understanding how modern applicant tracking systems evaluate resumes differently than they did just a year ago." },
    { title: "Quantifying Impact on Your Resume", date: "May 28, 2026", snippet: "How to use specific metrics and numbers to strengthen every bullet point on your resume." },
    { title: "The Death of the Objective Statement", date: "May 15, 2026", snippet: "Why replacing your outdated objective statement with a professional summary could double your interview rate." },
    { title: "Keyword Stuffing vs. Strategic Placement", date: "April 30, 2026", snippet: "The fine line between optimizing for the ATS algorithm and completely ruining readability for the human recruiter." },
    { title: "Your Resume Data Is Safe With Us", date: "April 18, 2026", snippet: "How ResuMetric processes your resume securely and why we never store your data permanently." },
    { title: "Navigating Career Gaps on Paper", date: "March 22, 2026", snippet: "Strategies for addressing time off without raising red flags to automated resume screeners." }
  ];

  return (
    <main className="static-page">
      <section className="page-header">
        <span className="header-tag">Insights</span>
        <h1>Career Insights Blog</h1>
      </section>
      <div className="blog-grid">
        {posts.map((post, i) => (
          <article key={i} className="blog-card">
            <span className="post-date">{post.date}</span>
            <h3>{post.title}</h3>
            <p>{post.snippet}</p>
            <Link to="#" className="read-more">Read more →</Link>
          </article>
        ))}
      </div>
    </main>
  );
}

function PrivacyPage() {
  return (
    <main className="static-page">
      <section className="page-header">
        <span className="header-tag">Legal</span>
        <h1>Privacy Policy</h1>
      </section>
      <section className="content-body">
        <div className="policy-block">
          <h3>1. How We Handle Your Data</h3>
          <p>ResuMetric processes your resume in memory and stores analysis results in our secure database with a strict 1-hour expiration. After that window, all uploaded data is automatically and permanently deleted. No human reviews your resume.</p>
        </div>
        <div className="policy-block">
          <h3>2. GDPR & CCPA Compliance</h3>
          <p>We comply with international data protection standards including GDPR and CCPA. You retain full rights to your data at all times. Because data is automatically purged within one hour, no manual deletion requests are necessary for analysis data.</p>
        </div>
        <div className="policy-block">
          <h3>3. Security</h3>
          <p>All data is transmitted over encrypted connections. Our infrastructure is monitored for unauthorized access, and we follow industry best practices for application security.</p>
        </div>
      </section>
    </main>
  );
}

function TermsPage() {
  return (
    <main className="static-page">
      <section className="page-header">
        <span className="header-tag">Legal</span>
        <h1>Terms of Service</h1>
      </section>
      <section className="content-body">
        <div className="policy-block">
          <h3>1. Acceptable Use</h3>
          <p>By using ResuMetric, you agree to submit authentic resume data for the purpose of analysis. Automated scraping, stress-testing, or misuse of the platform is prohibited.</p>
        </div>
        <div className="policy-block">
          <h3>2. Analysis Accuracy</h3>
          <p>ResuMetric provides AI-powered recommendations based on industry best practices. While we strive for maximum accuracy, we do not guarantee specific employment outcomes or interview results.</p>
        </div>
        <div className="policy-block">
          <h3>3. Intellectual Property</h3>
          <p>The ResuMetric analysis engine and scoring methodology are the intellectual property of the creator (Chriz). All rights reserved.</p>
        </div>
      </section>
    </main>
  );
}

function SplashScreen() {
  return (
    <div className="splash-screen">
      <div className="splash-content">
        <img src="/favicon.svg" alt="ResuMetric Logo" className="splash-logo-img" />
        <div className="splash-loader">
          <div className="loader-bar" />
        </div>
        <div className="splash-status">
          <span>Loading ResuMetric</span>
          <span className="blink">...</span>
        </div>
      </div>
    </div>
  );
}

function DiagnosticOverlay({ status, progress }) {
  return (
    <div className="diagnostic-overlay">
      <div className="diagnostic-content">
        <div className="scanner-line" />
        <span className="diagnostic-status">{status}</span>
        <div className="diagnostic-progress-track">
          <div className="diagnostic-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="diagnostic-percentage">{progress}%</span>
      </div>
    </div>
  );
}

function ResumeHeatmap({ heatmapData = [] }) {
  return (
    <section className="heatmap-section">
      <div className="section-header">
        <span className="header-tag">Detailed Feedback</span>
        <h2>Resume Performance Heatmap</h2>
      </div>
      <div className="heatmap-container">
        {heatmapData.map((segment, index) => (
          <div key={index} className={`heatmap-segment ${segment.impact}`}>
            <span className="segment-label">{segment.label}</span>
            <p className="segment-text">{segment.text}</p>
            <div className="segment-indicator" />
          </div>
        ))}
      </div>
      <div className="heatmap-legend">
        <div className="legend-item"><span className="legend-box strong" /><span>High Impact</span></div>
        <div className="legend-item"><span className="legend-box average" /><span>Needs Attention</span></div>
        <div className="legend-item"><span className="legend-box weak" /><span>Critical Gap</span></div>
      </div>
    </section>
  );
}

function Header({ session, menuOpen, setMenuOpen, theme, setTheme }) {
  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  return (
    <header className="nav-container">
      <Link className="brand" to="/" aria-label="ResuMetric">
        <img src="/favicon.svg" alt="ResuMetric" className="brand-logo-img" />
        <div className="brand-text">
          <strong>ResuMetric</strong>
          <small>v1.2.0-stable</small>
        </div>
      </Link>
      <button className="menu-toggle" aria-label="Toggle menu" onClick={() => setMenuOpen(!menuOpen)}>
        <span />
        <span />
      </button>
      <nav className={menuOpen ? 'nav-links open' : 'nav-links'}>
        <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle dark mode" title="Toggle dark mode">
          {theme === 'dark' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          )}
        </button>
        <Link to="/">Analyze</Link>
        <Link to="/about">How It Works</Link>
        <Link to="/contact">Contact</Link>
        <Link to="/blog">Insights</Link>
        
        {session ? (
          <>
            <Link to="/dashboard" className="nav-action-btn logged-in">Dashboard</Link>
            <div className="status-indicator">
              <span className="pulse-dot" />
              <span className="status-label">Signed In</span>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-action-btn">Sign In</Link>
          </>
        )}
      </nav>
    </header>
  );
}

function Hero(props) {
  return (
    <section id="analyzer" className="hero-section">
      <div className="hero-content">
        <div className="system-path">
          <span>RESUME REVIEW</span>
        </div>
        <h1>Find out what's actually <span>stopping your resume</span> before a recruiter does.</h1>
        <p className="hero-description">
          ResuMetric reviews your resume the same way recruiters and applicant tracking systems do, 
          then explains exactly what to improve — in plain language.
        </p>
        <div className="feature-specs">
          <div className="spec-item"><span className="spec-label">Analysis</span><span className="spec-value">ATS + Recruiter Simulation</span></div>
          <div className="spec-item"><span className="spec-label">Speed</span><span className="spec-value">Results in under 30 seconds</span></div>
          <div className="spec-item"><span className="spec-label">Privacy</span><span className="spec-value">Auto-deleted after 1 hour</span></div>
        </div>
      </div>
      <ScanBox {...props} />
    </section>
  );
}

function ScanBox({ file, setFile, industry, setIndustry, jobDescription, setJobDescription, loading, progress, error, analyze }) {
  return (
    <section id="analyzer" className={loading ? 'scan-container processing' : 'scan-container'}>
      <Uploader file={file} setFile={setFile} />
      <div className="form-grid">
        <div className="input-group">
          <label htmlFor="industry-select">Industry</label>
          <select id="industry-select" value={industry} onChange={(event) => setIndustry(event.target.value)}>
            {industries.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <div className="input-group">
          <label htmlFor="jd-input">Target Role</label>
          <input id="jd-input" value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} placeholder="e.g. Senior Product Manager" />
        </div>
      </div>
      <div className="input-group">
        <label htmlFor="jd-textarea">Job Description (Optional)</label>
        <textarea id="jd-textarea" value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} placeholder="Paste the full job description for a more precise analysis and targeted recommendations." />
      </div>
      <div className="trust-indicators">
        <span className="trust-indicator-item"><span className="check">✓</span> PDF & DOCX</span>
        <span className="trust-indicator-item"><span className="check">✓</span> Auto-detect industry</span>
        <span className="trust-indicator-item"><span className="check">✓</span> No account required</span>
      </div>
      {loading && (
        <div className="progress-module">
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="progress-status">Analyzing: {progress}%</span>
        </div>
      )}
      {error && <div className="error-module">{error}</div>}
      <button className="primary-action" onClick={analyze} disabled={loading}>
        {loading ? 'Analyzing your resume...' : 'Analyze My Resume'}
      </button>
    </section>
  );
}

function AuthPanel() {
  return null;
}

function Uploader({ file, setFile }) {
  const [dragging, setDragging] = useState(false);
  const accept = (selected) => {
    const next = selected?.[0];
    if (next && ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(next.type)) setFile(next);
  };
  return (
    <div
      className={dragging ? 'drop-zone active' : 'drop-zone'}
      onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => { event.preventDefault(); setDragging(false); accept(event.dataTransfer.files); }}
    >
      <input id="resume-file" type="file" accept=".pdf,.docx" onChange={(event) => accept(event.target.files)} />
      <label htmlFor="resume-file">
        <strong>{file ? file.name : 'Drop your resume here'}</strong>
        <span>{file ? `${Math.round(file.size / 1024)} KB ready for review` : 'or click to browse · PDF or DOCX · Max 8 MB'}</span>
      </label>
    </div>
  );
}

function Dashboard({ analysis, onReport, onRewrite, readOnly = false }) {
  const data = analysis.analysis;
  const scores = data.scores || {};
  const [showAdvanced, setShowAdvanced] = useState(false);
  const scoreItems = [
    ['ATS Score', scores.atsScore],
    ['Recruiter', scores.recruiterScore],
    ['Industry Fit', scores.industryRelevanceScore],
    ['Formatting', scores.formattingScore],
    ['Keywords', scores.keywordOptimizationScore],
    ['Experience', scores.workExperienceScore],
    ['Education', scores.educationScore],
    ['Skills', scores.skillsScore],
    ['Readability', scores.readabilityScore]
  ];
  const chartColors = {
    bg: 'rgba(200, 87, 60, 0.08)',
    border: '#C8573C',
    point: '#C8573C',
    bar: '#C8573C',
    gridColor: '#D8D2C7',
    tickColor: '#5E5A54',
  };
  const radar = useMemo(() => ({
    labels: scoreItems.map(([label]) => label),
    datasets: [{ label: 'Score', data: scoreItems.map(([, value]) => value || 0), backgroundColor: chartColors.bg, borderColor: chartColors.border, pointBackgroundColor: chartColors.point, borderWidth: 2 }]
  }), [analysis]);

  return (
    <section id="scores" className="analysis-results">
      <div className="section-header">
        <span className="header-tag">Your Results</span>
        <h2>Resume Analysis Report</h2>
      </div>
      <div className="metric-overview">
        <MetricCard label="ATS Score" value={scores.atsScore} />
        <MetricCard label="Recruiter Score" value={scores.recruiterScore} />
        <MetricCard label="Detected Role" value={data.inferredRole || 'General'} isText />
        <MetricCard label="Overall Verdict" value={data.finalVerdict || 'N/A'} isText />
      </div>

      {/* Executive Summary - shown first */}
      <div className="data-grids" style={{marginBottom: '1.5rem'}}>
        <DataTable title="Key Strengths" items={data.strengths} />
        <DataTable title="Areas to Improve" items={data.weaknesses} />
        <DataTable title="Top Recommendations" items={data.top10Improvements} />
      </div>

      {/* Advanced Diagnostics - collapsible */}
      <button 
        className={`advanced-toggle ${showAdvanced ? 'open' : ''}`}
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        <span>Advanced Diagnostics</span>
        <span className="toggle-arrow">▼</span>
      </button>
      <div className={`advanced-content ${showAdvanced ? 'open' : ''}`}>
        <div className="visual-diagnostics">
          <div className="data-panel main-panel">
            <div className="panel-header">
              <h2>Score Breakdown</h2>
              {!readOnly && (
                <div className="action-set">
                  <button className="secondary-action" onClick={onRewrite}>Rewrite Resume</button>
                  <button className="secondary-action" onClick={onReport}>Download PDF</button>
                </div>
              )}
            </div>
            <div className="chart-layout">
              <div className="chart-item">
                <Radar data={radar} options={{ scales: { r: { min: 0, max: 100, grid: { color: chartColors.gridColor }, angleLines: { color: chartColors.gridColor }, pointLabels: { color: chartColors.tickColor, font: { family: 'Inter', size: 11 } }, ticks: { display: false } } }, plugins: { legend: { display: false } } }} />
              </div>
              <div className="chart-item">
                <Bar data={{ labels: scoreItems.map(([label]) => label), datasets: [{ data: scoreItems.map(([, value]) => value || 0), backgroundColor: chartColors.bar, borderRadius: 4 }] }} options={{ indexAxis: 'y', scales: { x: { min: 0, max: 100, ticks: { color: chartColors.tickColor, font: { family: 'Inter' } }, grid: { color: chartColors.gridColor } }, y: { ticks: { color: chartColors.tickColor, font: { family: 'Inter', size: 12 } }, grid: { display: false } } }, plugins: { legend: { display: false } } }} />
              </div>
            </div>
          </div>
          <div className="data-panel side-panel">
            <div className="panel-header"><h2>Interview Probability</h2></div>
            <div className="doughnut-container">
              <Doughnut data={{ labels: ['Match', 'Gap'], datasets: [{ data: [scores.atsScore || 0, 100 - (scores.atsScore || 0)], backgroundColor: [chartColors.border, '#E8E4DD'], borderColor: '#FFFFFF', borderWidth: 2 }] }} options={{ plugins: { legend: { display: false } }, cutout: '72%' }} />
            </div>
            <div className="probability-metrics">
              <div className="prob-item"><span>ATS Pass Rate</span><strong>{data.atsPassProbability}</strong></div>
              <div className="prob-item"><span>Shortlist Chance</span><strong>{data.recruiterShortlistProbability}</strong></div>
            </div>
          </div>
        </div>
        <div className="data-grids">
          <DataTable title="ATS Risks" items={(data.atsRisks || analysis.atsRisks || []).map((risk) => risk.message || risk)} />
          <DataTable title="Missing Keywords" items={data.missingKeywords} />
          <DataTable title="Recommended Keywords" items={data.industryKeywordsToAdd} />
        </div>
      </div>
    </section>
  );
}

function Coach({ analysis, rewrite }) {
  const data = analysis.analysis;
  const [coverLetter, setCoverLetter] = useState(null);
  const [loadingCL, setLoadingCL] = useState(false);

  async function handleCoverLetter() {
    setLoadingCL(true);
    setCoverLetter(null);
    try {
      const apiRoot = window.location.hostname === 'localhost' ? import.meta.env.VITE_API_BASE_URL : '';
      const payload = { 
        resumeText: analysis.resumeText || '', 
        industry: data.inferredRole || analysis.industry || 'General', 
        analysis: data || {} 
      };
      
      const response = await fetch(`${apiRoot}/api/coverletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Failed to generate cover letter');
      
      setCoverLetter(resData.coverLetter);
    } catch (err) {
      console.error(err);
      setCoverLetter(`Error generating cover letter: ${err.message}`);
    } finally {
      setLoadingCL(false);
    }
  }

  return (
    <section className="consultation-section">
      <div className="consult-panel">
        <div className="panel-header"><h2>Career Recommendations</h2></div>
        <p className="analysis-narrative">{data.careerSuitability}</p>
        <div className="consult-grid">
          <DataTable bare title="Professional Advice" items={data.professionalRecommendations} />
          <DataTable bare title="Experience Gaps" items={data.experienceGapAnalysis} />
        </div>
        
        <div className="panel-header" style={{marginTop: '3rem'}}>
          <h2>Cover Letter Generator</h2>
          <button className="secondary-action" onClick={handleCoverLetter} disabled={loadingCL}>
            {loadingCL ? 'Writing...' : 'Generate Cover Letter'}
          </button>
        </div>
        {loadingCL && <div className="system-status"><span className="pulse-dot" /><span>Creating your cover letter...</span></div>}
        {coverLetter && <div className="code-view" style={{marginTop: '1rem'}}><pre>{coverLetter}</pre></div>}
      </div>
      <div className="consult-panel">
        <div className="panel-header"><h2>Resume Rewriter</h2></div>
        {!rewrite && <p className="analysis-narrative">Use our AI rewriter to generate an optimized version of your resume tailored to your target role and industry.</p>}
        {rewrite?.loading && <div className="system-status"><span className="pulse-dot" /><span>Rewriting your resume...</span></div>}
        {rewrite?.rewrittenResume && <div className="code-view"><pre>{rewrite.rewrittenResume}</pre></div>}
      </div>
    </section>
  );
}

function MetricCard({ label, value, isText }) {
  return (
    <div className="metric-card">
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value ?? 'N/A'}{!isText && <small>/100</small>}</strong>
    </div>
  );
}

function DataTable({ title, items = [], bare = false }) {
  return (
    <div className={bare ? 'data-table bare' : 'data-table'}>
      <h3>{title}</h3>
      <ul className="data-list">
        {(items || []).slice(0, 10).map((item, index) => <li key={`${title}-${index}`}>{String(item)}</li>)}
        {(!items || items.length === 0) && <li className="empty-state">No data available.</li>}
      </ul>
    </div>
  );
}

function HallOfFame() {
  const top = hallOfFame.filter((item) => item.tier === 'Top');
  const flop = hallOfFame.filter((item) => item.tier === 'Flop');
  return (
    <section id="benchmarks" className="benchmark-section">
      <div className="section-header text-center">
        <span className="header-tag">Score Examples</span>
        <h2>What separates a 91 from a 38</h2>
      </div>
      <div className="benchmark-grid">
        <BenchmarkColumn title="Strong Resumes" items={top} type="success" />
        <BenchmarkColumn title="Needs Work" items={flop} type="error" />
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section id="about" className="about-section">
      <div className="section-header">
        <span className="header-tag">Our Approach</span>
        <h2>Resume review that actually helps</h2>
      </div>
      <div className="about-grid">
        <div className="about-content">
          <p>
            ResuMetric reviews your resume the way real hiring systems do — checking 
            ATS compatibility, keyword alignment, formatting, and overall impact. 
            Then we explain exactly what to fix, in plain English.
          </p>
          <p>
            We bridge the gap between your qualifications and what automated 
            recruitment systems are looking for, so your resume gets past the 
            filters and in front of the right people.
          </p>
        </div>
        <div className="about-metrics">
          <div className="about-metric-item">
            <strong>AI-Powered</strong>
            <span>Analysis Engine</span>
          </div>
          <div className="about-metric-item">
            <strong>11+</strong>
            <span>Industries Covered</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function BenchmarkColumn({ title, items, type }) {
  return (
    <div className={`benchmark-column ${type}`}>
      <h3>{title}</h3>
      <div className="benchmark-list">
        {items.map((item) => (
          <div className="benchmark-card" key={item.site}>
            <span className="benchmark-label">{item.site}</span>
            <strong className="benchmark-value">{item.score}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer id="documentation" className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <strong>ResuMetric</strong>
          <span>© 2026 ResuMetric. All rights reserved.</span>
          <p className="footer-mission">Resume Review & Career Advisory</p>
        </div>
        <div className="footer-links">
          <div className="link-group">
            <strong>Platform</strong>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
          <div className="link-group">
            <strong>Developer</strong>
            <span>Created by <a href="https://chriz-3656.github.io" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '500' }}>Chriz (@chriz-3656)</a></span>
            <span>Solo Kerala Developer</span>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>All data encrypted in transit</span>
        <span>Resume data auto-deleted after 1 hour</span>
      </div>
    </footer>
  );
}

createRoot(document.getElementById('root')).render(<App />);
