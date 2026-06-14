# ResuMetric | Enterprise Profile Analytics

A high-performance, AI-powered Resume ATS Analyzer and Career Intelligence platform. ResuMetric leverages neural analysis and proprietary heuristics to optimize professional profiles for modern recruitment systems.

## Features

- **Neural Analysis Engine**: Powered by Gemini 1.5 Flash for deep semantic evaluation.
- **ATS Visual Simulation**: Automated diagnostics for structural and formatting risks.
- **Performance Heatmap**: Actionable visual highlights of resume strengths and critical gaps.
- **Privacy-First Architecture**: Automated 60-minute TTL data purge (MongoDB) with transient-memory processing.
- **Enterprise PDF Reporting**: Professional diagnostic synthesis for offline review.
- **Optimization Engine**: AI-driven copy revision for maximum alignment.

## Tech Stack

- **Frontend**: React (Vite), Chart.js, Framer Motion, IBM Plex Mono.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (Transient analysis storage with TTL).
- **AI**: Google Gemini API.
- **Parsing**: `pdf-parse`, `mammoth`.
- **Reports**: `pdfkit`.

## Setup

```bash
npm install
cp .env.example .env
# Fill in GEMINI_API_KEY and MONGODB_URI
npm run dev
```

Frontend: `http://localhost:5173`
API: `http://localhost:8080`

## SEO & Accessibility

- Comprehensive Open Graph and Twitter Card support.
- JSON-LD Structured Data for search engine advanced snippets.
- Semantic HTML5 and ARIA-compliant UI components.
- Responsive Industrial-SaaS design.

## Author

- **chriz-3656** - [GitHub](https://github.com/chriz-3656)

---
© 2026 ResuMetric. All rights reserved.
