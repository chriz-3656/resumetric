# ResuMetric | Enterprise Profile Analytics

A high-performance, AI-powered Resume ATS Analyzer and Career Intelligence platform. ResuMetric leverages neural analysis and proprietary heuristics to optimize professional profiles for modern recruitment systems.

## Key Features

- **Dual-AI Engine**: Powered by Groq LPU (Llama-3) for sub-second diagnostics, with Google Gemini 1.5 Flash as a robust fallback and rewrite engine.
- **Dynamic Role Auto-Detection**: Automatically infers the candidate's target job title, seniority, and industry from the resume text to provide highly contextualized scoring and keyword gap analysis.
- **ATS Visual Simulation**: Automated diagnostics for structural and formatting risks.
- **Performance Heatmap**: Actionable visual highlights of resume strengths and critical gaps.
- **Privacy-First Architecture**: Automated 60-minute TTL data purge via MongoDB with transient-memory processing.
- **Enterprise PDF Reporting**: Professional diagnostic synthesis for offline review.
- **Multi-Page Routing**: Clean client-side navigation (`/about`, `/blog`, `/privacy`, `/terms`).

## Tech Stack

- **Frontend**: React (Vite), Chart.js, React Router, IBM Plex Mono.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (Transient analysis storage with TTL).
- **AI Pipelines**: Groq SDK, Google Gemini API.
- **Document Parsing**: `pdf-parse`, `mammoth`.

## Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
# Edit .env and add your GROQ_API_KEY, GEMINI_API_KEY, and MONGODB_URI

# 3. Start the development server
npm run dev
```

*Frontend runs on `http://localhost:5173` | API runs on `http://localhost:8080`*

## Cloud Deployment (Vercel)

ResuMetric is optimized for serverless deployment on Vercel.

1. Import the repository to Vercel.
2. Ensure **Framework Preset** is set to `Other`.
3. Set the following environment variables:
   - `GROQ_API_KEY`
   - `GEMINI_API_KEY`
   - `MONGODB_URI`
   - `CLIENT_URL` (e.g., `https://resumetric.vercel.app`)
4. **Deploy**. The `vercel.json` file handles all API bridging and static routing automatically.

## Security & Privacy
- **Transient Memory**: Resumes are parsed entirely in memory (`multer.memoryStorage()`) and never touch the disk.
- **Data Expiration**: All MongoDB analysis records are permanently purged 3600 seconds after creation.

## Creator

- **Chriz** (@chriz-3656) - [GitHub](https://github.com/chriz-3656)

---
© 2026 ResuMetric. All rights reserved. Data-Driven Career Intelligence.
