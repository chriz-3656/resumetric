import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { z } from 'zod';
import { parseResumeFile } from './services/parser.js';
import { analyzeResume, rewriteResume } from './services/gemini.js';
import { analyzeWithGroq } from './services/groq.js';
import { createReportPdf } from './services/report.js';
import { detectAtsRisks, extractSections, keywordLibrary, scoreFallback } from './services/ats.js';
import { ResumeAnalysis, connectDB } from './services/mongodb.js';
import { getUserFromRequest } from './services/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// Trust Vercel's proxy for accurate rate limiting
app.set('trust proxy', 1);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    cb(allowed.includes(file.mimetype) ? null : new Error('Only PDF and DOCX files are supported'), allowed.includes(file.mimetype));
  }
});

const origin = process.env.CLIENT_URL || true;
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ 
  origin: process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL : true, 
  credentials: true 
}));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 60_000, max: 80, standardHeaders: true, legacyHeaders: false }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, name: 'ResuMetric Professional API' });
});

app.get('/api/industries', (_req, res) => {
  res.json({ industries: Object.keys(keywordLibrary) });
});

app.post('/api/analyze', upload.single('resume'), async (req, res, next) => {
  try {
    await connectDB();
    if (!req.file) return res.status(400).json({ error: 'Resume file is required' });
    const body = z.object({
      industry: z.string().default('Software Engineering'),
      jobDescription: z.string().optional().default('')
    }).parse(req.body);

    const user = await getUserFromRequest(req);
    const resumeText = await parseResumeFile(req.file);
    const parsedSections = extractSections(resumeText);
    const atsRisks = detectAtsRisks(resumeText, parsedSections);
    const fallback = scoreFallback(resumeText, body.industry, body.jobDescription, parsedSections, atsRisks);

    let analysis;
    let engine = 'Groq/Llama-3';

    try {
      analysis = await analyzeWithGroq({
        resumeText,
        industry: body.industry,
        jobDescription: body.jobDescription,
        parsedSections,
        atsRisks
      });
    } catch (groqError) {
      console.warn('Groq failed, falling back to Gemini:', groqError.message);
      engine = 'Gemini/Flash';
      try {
        analysis = await analyzeResume({
          resumeText,
          industry: body.industry,
          jobDescription: body.jobDescription,
          parsedSections,
          atsRisks,
          fallback
        });
      } catch (geminiError) {
        console.error('Gemini also failed:', geminiError.message);
        engine = 'Heuristic/Fallback';
        analysis = { scores: fallback, engine };
      }
    }

    const payload = {
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      industry: body.industry,
      resumeText,
      parsedSections,
      atsRisks,
      analysis: { ...analysis, engine }
    };

    const docOptions = {
      userId: user ? user.id : undefined,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      industry: body.industry,
      resumeText,
      parsedSections,
      jobDescription: body.jobDescription,
      analysis: payload.analysis
    };

    if (!user) {
      docOptions.expireAt = new Date(Date.now() + 3600 * 1000); // 1 hour for guests
    }

    const doc = await new ResumeAnalysis(docOptions).save();
    
    payload.id = doc._id;
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

app.post('/api/rewrite', async (req, res, next) => {
  try {
    const body = z.object({
      resumeText: z.string().min(50),
      industry: z.string(),
      targetRole: z.string().optional().default(''),
      jobDescription: z.string().optional().default('')
    }).parse(req.body);
    const result = await rewriteResume(body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.post('/api/report', async (req, res, next) => {
  try {
    const body = z.object({
      fileName: z.string().default('resume-analysis'),
      industry: z.string(),
      analysis: z.record(z.any()),
      parsedSections: z.record(z.any()).optional().default({}),
      atsRisks: z.array(z.any()).optional().default([])
    }).parse(req.body);
    const pdf = await createReportPdf(body);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${body.fileName.replace(/\W+/g, '-').toLowerCase()}-ats-report.pdf"`);
    res.send(pdf);
  } catch (error) {
    next(error);
  }
});

app.get('/api/history', async (req, res, next) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Authentication required' });
    
    await connectDB();
    const analyses = await ResumeAnalysis.find({ userId: user.id })
      .select('fileName industry analysis createdAt')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ 
      analyses: analyses.map(a => ({
        id: a._id,
        file_name: a.fileName,
        industry: a.industry,
        analysis: a.analysis,
        created_at: a.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  const distPath = path.resolve(__dirname, '../client/dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.use((error, _req, res, _next) => {
  console.error('SERVER_ERROR:', error);
  const message = error?.message || 'Unexpected server error';
  const status = message.includes('supported') || message.includes('required') ? 400 : 500;
  res.status(status).json({ error: message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined });
});

export default app;
