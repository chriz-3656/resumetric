# ResuMetric | Enterprise Profile Analytics

[![Status: Active](https://img.shields.io/badge/Status-Active-00E676?style=flat-square)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-333333?style=flat-square)](#)
[![Version: 1.2.0-stable](https://img.shields.io/badge/Version-1.2.0--stable-FFB800?style=flat-square)](#)

A high-performance, AI-powered Resume ATS Analyzer and Career Intelligence platform. ResuMetric leverages neural analysis and proprietary heuristics to optimize professional profiles for modern recruitment systems.

**Mission:** To bridge the gap between professional experience and systemic recruitment heuristics, ensuring candidates are both machine-readable and recruiter-optimized.

---

## 🚀 Key Features

- **Dual-AI Inference Engine** 
  - *Primary*: Groq LPU (Llama-3) for ultra-low latency, sub-second diagnostics.
  - *Fallback/Rewrite*: Google Gemini 1.5 Flash for robust, high-fidelity resume copy optimization.
- **Dynamic Role Auto-Detection**
  - The AI aggressively scans uploaded documents to automatically infer the candidate's target job title, seniority, and industry, providing highly contextualized scoring without manual input.
- **Enterprise Authentication (Supabase)**
  - Full OAuth (Google, GitHub) and Email/Password integration with secure session management.
  - Includes Password Recovery flows and strict clearance validation.
- **Protected User Dashboard**
  - Authenticated operators receive a permanent archive of their analysis history.
  - Guests operate under a strict **1-Hour Auto-Purge TTL** via MongoDB for maximum privacy.
- **Actionable Diagnostics**
  - **Performance Heatmap**: Visual highlighting of strong, average, and critically weak segments within the resume text.
  - **ATS Visual Simulation**: Automated diagnostics for structural and formatting risks.
- **Enterprise PDF Reporting**: Professional diagnostic synthesis available for offline review.

---

## 🛠 Tech Stack

| Domain | Technology |
| :--- | :--- |
| **Frontend** | React (Vite), React Router v7, Chart.js, Framer Motion |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Transient storage & User linking), Supabase (Auth) |
| **AI Pipelines**| Groq SDK, Google Generative AI |
| **Parsing** | `pdf-parse`, `mammoth` |
| **Styling** | Custom Industrial CSS (IBM Plex Mono, Signal Green `#00E676`) |

---

## 📜 Changelog & Recent Fixes (v1.2.0)

### Added
- **Multi-Page Routing**: Migrated from a single-page app to a robust client-side routed application featuring `/about`, `/blog`, `/privacy`, `/terms`, and `/dashboard`.
- **Supabase Authentication**: Integrated `@supabase/supabase-js` for complete user lifecycle management.
- **Dynamic Heatmaps**: Added UI to visually segment and color-code resume text based on AI impact assessment.
- **Testimonial Slider**: Implemented a CSS-only infinite marquee slider for operator feedback.
- **Custom Branding**: Added a bespoke SVG favicon (`favicon.svg`) and unified the "ResuMetric" identity across all meta tags.

### Fixed
- **Vite Production Routing**: Resolved `localhost:8080` connection refusal errors on live deployment by implementing dynamic relative pathing (`apiRoot`) for API calls.
- **Chart.js Rendering Crash**: Fixed the "point is not a registered element" fatal error by explicitly registering `PointElement` and `LineElement` in the main React entry point.
- **Express Rate-Limiter (Vercel)**: Resolved `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` by configuring Express to `trust proxy`, allowing accurate IP tracking behind Vercel's edge network.
- **Supabase WebSocket Support**: Installed the `ws` package and passed it to the Supabase transport layer to resolve a Node.js 20 crash caused by a lack of native WebSockets.
- **Vite Environment Loading**: Configured `envDir: '../'` in `vite.config.js` to ensure the local dev server correctly captures Supabase credentials from the root `.env` file, preventing null object crashes.
- **Supabase OAuth Redirects**: Guided the configuration of the Supabase dashboard 'Site URL' and 'Redirect URIs' to point to the live Vercel domain, fixing the `localhost:3000/#access_token` dead-end.

---

## 💻 Quick Start (Local Development)

**1. Install dependencies**
```bash
npm install
```

**2. Configure environment variables**
```bash
cp .env.example .env
```
Open `.env` and configure the following keys:
- `GROQ_API_KEY`
- `GEMINI_API_KEY`
- `MONGODB_URI`
- `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**3. Start the development server**
```bash
npm run dev
```
*Frontend runs on `http://localhost:5173` | API runs on `http://localhost:8080`*

---

## ☁️ Cloud Deployment (Vercel)

ResuMetric is optimized for serverless monorepo deployment on Vercel.

1. Import the repository to Vercel.
2. Ensure **Framework Preset** is set to `Other`.
3. Set **Build Command** to `npm run build` and **Output Directory** to `client/dist`.
4. Copy all environment variables from your `.env` into Vercel's Environment Settings.
5. Add an additional variable: `CLIENT_URL=https://<your-vercel-domain>.vercel.app`.
6. **Deploy**. The included `vercel.json` file handles all API bridging and static fallback routing automatically.

---

## 🛡 Security & Privacy
- **Transient Memory**: Resumes are parsed entirely in memory (`multer.memoryStorage()`) and never touch physical disk storage.
- **Data Expiration**: Guest MongoDB analysis records are permanently purged 3600 seconds after creation via a Time-To-Live (TTL) index.
- **Secure Transport**: AES-256 encryption enforced on all external connections.

---
**Creator:** Chriz (@chriz-3656)  
**System Version:** v1.2.0-stable  
© 2026 ResuMetric. All rights reserved. Data-Driven Career Intelligence.
