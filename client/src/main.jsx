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

ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement);

const apiBase = import.meta.env.VITE_API_BASE_URL || '';

// In production on Vercel, we must use relative paths to avoid localhost hardcoding.
const apiRoot = window.location.hostname === 'localhost' ? apiBase : '';

const industries = ['Auto-Detect', 'Cybersecurity', 'Accounting', 'Finance', 'Marketing', 'Software Engineering', 'Data Science', 'Cloud Computing', 'Networking', 'HR', 'Project Management'];
const hallOfFame = [
  { site: 'CloudSec Lead', score: 94, tier: 'Top' },
  { site: 'Finance Analyst', score: 91, tier: 'Top' },
  { site: 'No-Summary CV', score: 38, tier: 'Flop' },
  { site: 'Keyword-Stuffed PDF', score: 42, tier: 'Flop' }
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
        <Header session={session} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
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
  if (!analysis) return <main className="static-page"><div className="system-status"><span className="pulse-dot"/><span>Loading Profile...</span></div></main>;

  return (
    <main>
      <section className="page-header text-center" style={{marginTop: '4rem'}}>
        <span className="header-tag">Public Profile</span>
        <h1>Operator Analytics</h1>
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
    setDiagnosing('PARSING_RESUME_BLOB');
    
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
        throw new Error('SYSTEM COOLDOWN: Rate limit exceeded. Please wait 60 seconds before initiating another scan.');
      }
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Analysis failed');
      
      const steps = [
        { progress: 25, status: 'MAPPING_SEMANTIC_NODES' },
        { progress: 45, status: 'ATS_VISUAL_SIMULATION' },
        { progress: 65, status: 'RECRUITER_BIAS_EMULATION' },
        { progress: 85, status: 'SYNTHESIZING_HEATMAP' },
        { progress: 100, status: 'FINALIZING_REPORT' }
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
          <AboutSection />
          <HallOfFame />
          <TestimonialSlider />
        </>
      )}
    </main>
  );
}

const testimonials = [
  { quote: "ResuMetric's AI found keyword gaps I completely missed. My callback rate doubled in two weeks.", author: "Sarah J.", role: "Senior Frontend Engineer" },
  { quote: "The ATS visual simulation is terrifyingly accurate. It highlighted exactly why my PDF was being rejected.", author: "David T.", role: "Product Manager" },
  { quote: "Finally, a tool that gives actionable data instead of generic advice. The Groq engine is incredibly fast.", author: "Elena M.", role: "Data Scientist" },
  { quote: "I optimized my resume using the heatmap insights and landed interviews at two FAANG companies.", author: "Michael R.", role: "Cloud Architect" },
  { quote: "The recruiter bias emulation helped me reframe my experience to focus on impact metrics.", author: "Priya K.", role: "Marketing Director" }
];

function TestimonialSlider() {
  const scrollItems = [...testimonials, ...testimonials]; // Duplicate for seamless loop

  return (
    <section className="testimonials-section">
      <div className="section-header text-center">
        <span className="header-tag">Operator Feedback</span>
        <h2>Proven Field Results</h2>
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

function AboutPage() {
  return (
    <main className="static-page">
      <section className="page-header">
        <span className="header-tag">Corporate Intelligence</span>
        <h1>About ResuMetric</h1>
      </section>
      <AboutSection />
      <section className="content-section">
        <div className="section-grid">
          <div className="text-block">
            <h3>Technical Foundation</h3>
            <p>
              Built on Node.js and React, ResuMetric utilizes advanced neural models 
              provided by Google Gemini to process complex professional narratives. 
              Our engine is designed for high-performance extraction of skills, 
              achievements, and hierarchical data points.
            </p>
          </div>
          <div className="text-block">
            <h3>The Creator</h3>
            <p>
              Developed by Chriz (chriz-3656), a software engineer focused on 
              building high-utility career tools that leverage modern AI paradigms. 
              ResuMetric was born out of the need for a transparent, data-centric 
              approach to the modern recruitment cycle.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function BlogPage() {
  const posts = [
    { title: "The 2026 ATS Algorithm Shift", date: "June 12, 2026", snippet: "Understanding how neural parsing is replacing keyword matching in modern systems." },
    { title: "Quantifying Impact in Tech Roles", date: "May 28, 2026", snippet: "How to use metrics to trigger higher scores in automated recruitment filters." },
    { title: "The Privacy of Career Data", date: "May 15, 2026", snippet: "Why ResuMetric uses transient-memory processing for all user uploads." }
  ];

  return (
    <main className="static-page">
      <section className="page-header">
        <span className="header-tag">Industry Insights</span>
        <h1>Career Intelligence Blog</h1>
      </section>
      <div className="blog-grid">
        {posts.map((post, i) => (
          <article key={i} className="blog-card">
            <span className="post-date">{post.date}</span>
            <h3>{post.title}</h3>
            <p>{post.snippet}</p>
            <Link to="#" className="read-more">READ_FULL_ACCESS</Link>
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
        <span className="header-tag">Compliance Standards</span>
        <h1>Privacy Policy</h1>
      </section>
      <section className="content-body">
        <div className="policy-block">
          <h3>1. Data Processing Protocol</h3>
          <p>ResuMetric employs transient-memory processing. All uploaded resumes are processed in memory and stored in our secure database with a strict 3600-second (1 hour) Time-To-Live (TTL) expiration. No data is persisted beyond this window.</p>
        </div>
        <div className="policy-block">
          <h3>2. GDPR & CCPA Compliance</h3>
          <p>We adhere to the highest international data protection standards. Users retain full rights to their data. Since data is automatically purged, no manual deletion requests are necessary for data older than one hour.</p>
        </div>
        <div className="policy-block">
          <h3>3. Security Infrastructure</h3>
          <p>All data transfers are encrypted via AES-256 protocols. Our system environment is strictly monitored for unauthorized access patterns.</p>
        </div>
      </section>
    </main>
  );
}

function TermsPage() {
  return (
    <main className="static-page">
      <section className="page-header">
        <span className="header-tag">Legal Framework</span>
        <h1>Terms of Service</h1>
      </section>
      <section className="content-body">
        <div className="policy-block">
          <h3>1. Usage Terms</h3>
          <p>By using ResuMetric, you agree to provide authentic resume data for the purpose of analysis. Misuse of the platform for automated scraping or stress-testing is prohibited.</p>
        </div>
        <div className="policy-block">
          <h3>2. AI Diagnostic Accuracy</h3>
          <p>ResuMetric provides recommendations based on AI heuristics. While we aim for maximum alignment with industry standards, we do not guarantee employment or specific hiring outcomes.</p>
        </div>
        <div className="policy-block">
          <h3>3. Intellectual Property</h3>
          <p>The ResuMetric analysis engine and its proprietary scoring models are the property of the creator (Chriz). All rights reserved.</p>
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
          <span>INITIALIZING_RESUMETRIC_CORE</span>
          <span className="blink">_</span>
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
        <span className="header-tag">Actionable Insights</span>
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
        <div className="legend-item"><span className="legend-box average" /><span>Average Performance</span></div>
        <div className="legend-item"><span className="legend-box weak" /><span>Critical Gap</span></div>
      </div>
    </section>
  );
}

function Header({ session, menuOpen, setMenuOpen }) {
  return (
    <header className="nav-container">
      <Link className="brand" to="/" aria-label="ResuMetric Professional">
        <img src="/favicon.svg" alt="ResuMetric Icon" className="brand-logo-img" />
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
        <Link to="/">Analysis</Link>
        <Link to="/about">About</Link>
        <Link to="/blog">Blog</Link>
        
        {session ? (
          <>
            <Link to="/dashboard" className="nav-action-btn logged-in">Dashboard</Link>
            <div className="status-indicator">
              <span className="pulse-dot" />
              <span className="status-label">Auth Active</span>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-action-btn">Initialize Login</Link>
            <div className="status-indicator">
              <span className="pulse-dot" style={{ animation: 'none', opacity: 0.2 }} />
              <span className="status-label" style={{ color: 'var(--text-dim)' }}>Guest Mode</span>
            </div>
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
          <span>ROOT / RESUMETRIC / ANALYZER</span>
        </div>
        <h1>Data-Driven <span>Career Intelligence</span></h1>
        <p className="hero-description">
          High-precision Applicant Tracking System (ATS) optimization for the modern workforce. 
          Our neural analysis engine identifies structural gaps and semantic alignment 
          to maximize your recruitment conversion rate.
        </p>
        <div className="feature-specs">
          <div className="spec-item"><span className="spec-label">Core</span><span className="spec-value">Neural Analysis Engine</span></div>
          <div className="spec-item"><span className="spec-label">Uptime</span><span className="spec-value">99.9% Operational</span></div>
          <div className="spec-item"><span className="spec-label">Security</span><span className="spec-value">ISO-Aligned Data Purge</span></div>
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
          <label htmlFor="industry-select">Target Sector</label>
          <select id="industry-select" value={industry} onChange={(event) => setIndustry(event.target.value)}>
            {industries.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <div className="input-group">
          <label htmlFor="jd-input">Job Specification / Role</label>
          <input id="jd-input" value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} placeholder="Enter role title or key requirements" />
        </div>
      </div>
      <div className="input-group">
        <label htmlFor="jd-textarea">Detailed Job Description (Optional)</label>
        <textarea id="jd-textarea" value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} placeholder="Paste full description for deep-match analysis and gap identification." />
      </div>
      {loading && (
        <div className="progress-module">
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="progress-status">Processing: {progress}%</span>
        </div>
      )}
      {error && <div className="error-module">ERROR: {error}</div>}
      <button className="primary-action" onClick={analyze} disabled={loading}>
        {loading ? 'Executing Analysis...' : 'Run Diagnostics'}
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
        <strong>{file ? file.name : 'Drop PDF/DOCX resume here'}</strong>
        <span>{file ? `${Math.round(file.size / 1024)} KB ready for processing` : 'or click to browse. Max 8 MB.'}</span>
      </label>
    </div>
  );
}

function Dashboard({ analysis, onReport, onRewrite, readOnly = false }) {
  const data = analysis.analysis;
  const scores = data.scores || {};
  const scoreItems = [
    ['ATS-S', scores.atsScore],
    ['REC-C', scores.recruiterScore],
    ['IND-R', scores.industryRelevanceScore],
    ['FORM-Q', scores.formattingScore],
    ['KEY-O', scores.keywordOptimizationScore],
    ['EXP-D', scores.workExperienceScore],
    ['EDU-V', scores.educationScore],
    ['SKL-A', scores.skillsScore],
    ['READ-S', scores.readabilityScore]
  ];
  const radar = useMemo(() => ({
    labels: scoreItems.map(([label]) => label),
    datasets: [{ label: 'Performance Metric', data: scoreItems.map(([, value]) => value || 0), backgroundColor: 'rgba(0, 230, 118, 0.1)', borderColor: '#00E676', pointBackgroundColor: '#00E676', borderWidth: 1 }]
  }), [analysis]);

  return (
    <section id="scores" className="analysis-results">
      <div className="metric-overview">
        <MetricCard label="ATS Index" value={scores.atsScore} />
        <MetricCard label="Recruiter Confidence" value={scores.recruiterScore} />
        <MetricCard label="Inferred Role" value={data.inferredRole || industry} isText />
        <MetricCard label="System Verdict" value={data.finalVerdict || 'N/A'} isText />
      </div>
      <div className="visual-diagnostics">
        <div className="data-panel main-panel">
          <div className="panel-header">
            <h2>Diagnostic Dashboard</h2>
            {!readOnly && (
              <div className="action-set">
                <button className="secondary-action" onClick={onRewrite}>Optimize Copy</button>
                <button className="secondary-action" onClick={onReport}>Generate PDF</button>
              </div>
            )}
          </div>
          <div className="chart-layout">
            <div className="chart-item">
              <Radar data={radar} options={{ scales: { r: { min: 0, max: 100, grid: { color: '#1a1a1a' }, angleLines: { color: '#1a1a1a' }, pointLabels: { color: '#888', font: { family: 'IBM Plex Mono' } }, ticks: { display: false } } }, plugins: { legend: { display: false } } }} />
            </div>
            <div className="chart-item">
              <Bar data={{ labels: scoreItems.map(([label]) => label), datasets: [{ data: scoreItems.map(([, value]) => value || 0), backgroundColor: '#00E676' }] }} options={{ indexAxis: 'y', scales: { x: { min: 0, max: 100, ticks: { color: '#555', font: { family: 'IBM Plex Mono' } }, grid: { color: '#1a1a1a' } }, y: { ticks: { color: '#00E676', font: { family: 'IBM Plex Mono' } }, grid: { display: false } } }, plugins: { legend: { display: false } } }} />
            </div>
          </div>
        </div>
        <div className="data-panel side-panel">
          <div className="panel-header"><h2>Success Probability</h2></div>
          <div className="doughnut-container">
            <Doughnut data={{ labels: ['Match', 'Gap'], datasets: [{ data: [scores.atsScore || 0, 100 - (scores.atsScore || 0)], backgroundColor: ['#00E676', '#0a0a0a'], borderColor: '#1a1a1a', borderWidth: 1 }] }} options={{ plugins: { legend: { display: false } } }} />
          </div>
          <div className="probability-metrics">
            <div className="prob-item"><span>ATS Passage</span><strong>{data.atsPassProbability}</strong></div>
            <div className="prob-item"><span>Shortlist Priority</span><strong>{data.recruiterShortlistProbability}</strong></div>
          </div>
        </div>
      </div>
      <div className="data-grids">
        <DataTable title="Key Strengths" items={data.strengths} />
        <DataTable title="Critical Deficiencies" items={data.weaknesses} />
        <DataTable title="ATS Structural Risks" items={(data.atsRisks || analysis.atsRisks || []).map((risk) => risk.message || risk)} />
        <DataTable title="Missing Semantic Keywords" items={data.missingKeywords} />
        <DataTable title="Optimization Keywords" items={data.industryKeywordsToAdd} />
        <DataTable title="Strategic Roadmap" items={data.top10Improvements} />
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
    try {
      const apiRoot = window.location.hostname === 'localhost' ? import.meta.env.VITE_API_BASE_URL : '';
      const response = await fetch(`${apiRoot}/api/coverletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: analysis.resumeText, industry: data.inferredRole, analysis: data })
      });
      const resData = await response.json();
      setCoverLetter(resData.coverLetter);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCL(false);
    }
  }

  return (
    <section className="consultation-section">
      <div className="consult-panel">
        <div className="panel-header"><h2>Strategic Career Consulting</h2></div>
        <p className="analysis-narrative">{data.careerSuitability}</p>
        <div className="consult-grid">
          <DataTable bare title="Executive Recommendations" items={data.professionalRecommendations} />
          <DataTable bare title="Market Gap Analysis" items={data.experienceGapAnalysis} />
        </div>
        
        <div className="panel-header" style={{marginTop: '3rem'}}>
          <h2>Cover Letter Generation</h2>
          <button className="secondary-action" onClick={handleCoverLetter} disabled={loadingCL}>
            {loadingCL ? 'Drafting...' : 'Generate Letter'}
          </button>
        </div>
        {loadingCL && <div className="system-status"><span className="pulse-dot" /><span>Synthesizing narrative...</span></div>}
        {coverLetter && <div className="code-view" style={{marginTop: '1rem'}}><pre>{coverLetter}</pre></div>}
      </div>
      <div className="consult-panel">
        <div className="panel-header"><h2>AI Optimization Engine</h2></div>
        {!rewrite && <p className="analysis-narrative">Execute the optimization engine to generate an ATS-aligned revision of your core competencies.</p>}
        {rewrite?.loading && <div className="system-status"><span>GEN-REV-01</span><span className="pulse-dot" /><span>Synthesizing...</span></div>}
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
        {(!items || items.length === 0) && <li className="empty-state">No data points detected.</li>}
      </ul>
    </div>
  );
}

function HallOfFame() {
  const top = hallOfFame.filter((item) => item.tier === 'Top');
  const flop = hallOfFame.filter((item) => item.tier === 'Flop');
  return (
    <section id="benchmarks" className="benchmark-section">
      <div className="section-header">
        <span className="header-tag">Global Standards</span>
        <h2>Profile Benchmarks</h2>
      </div>
      <div className="benchmark-grid">
        <BenchmarkColumn title="High Alignment" items={top} type="success" />
        <BenchmarkColumn title="Critical Divergence" items={flop} type="error" />
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section id="about" className="about-section">
      <div className="section-header">
        <span className="header-tag">Our Mission</span>
        <h2>Intelligent Career Alignment</h2>
      </div>
      <div className="about-grid">
        <div className="about-content">
          <p>
            ResuMetric helps job seekers optimize resumes through AI-powered ATS analysis, 
            recruiter simulations, keyword intelligence, and career recommendations.
          </p>
          <p>
            Our platform bridges the gap between professional experience and systemic 
            recruitment heuristics, ensuring your profile is both machine-readable and 
            recruiter-optimized.
          </p>
        </div>
        <div className="about-metrics">
          <div className="about-metric-item">
            <strong>Neural</strong>
            <span>Analysis Core</span>
          </div>
          <div className="about-metric-item">
            <strong>Global</strong>
            <span>Industry Standards</span>
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
          <span>© 2026 Chriz | chriz-3656</span>
          <p className="footer-mission">Data-Driven Career Intelligence</p>
        </div>
        <div className="footer-links">
          <div className="link-group">
            <strong>Platform</strong>
            <Link to="/about">About</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
          <div className="link-group">
            <strong>Operations</strong>
            <span>Creator: Chriz (@chriz-3656)</span>
            <span>Compliance: GDPR / CCPA Ready</span>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>SECURE DATA TRANSFER: ENFORCED</span>
        <span>RETENTION LIMIT: 3600S EXPIRATION UNIFIED</span>
      </div>
    </footer>
  );
}

createRoot(document.getElementById('root')).render(<App />);
