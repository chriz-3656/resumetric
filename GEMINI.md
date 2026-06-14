# ResuMetric - Enterprise Profile Analytics

A high-performance AI-powered Resume ATS Analyzer and Career Intelligence platform. It uses a dual-AI strategy (Groq + Gemini) to critique resumes against Applicant Tracking System (ATS) requirements and specific job descriptions.

## Project Architecture

### Backend (Node.js/Express)
- **Entry Point**: `server/index.js` (starts server) and `server/app.js` (Express app configuration).
- **Services (`server/services/`)**:
  - `groq.js`: **Primary** analysis engine using Groq LPU for near-instant inference (Llama-3).
  - `gemini.js`: **Fallback** analysis and copy rewriting engine using Google Gemini API.
  - `ats.js`: Core rule-based engine for section extraction, risk detection, and heuristic scoring.
  - `mongodb.js`: Manages MongoDB connection and provides the `ResumeAnalysis` model with a 1-hour TTL index for privacy.
  - `parser.js`: Handles PDF and DOCX parsing using `pdf-parse` and `mammoth`.
  - `report.js`: Generates PDF reports using `pdfkit`.
- **Database**: 
  - **MongoDB**: The primary database used for storing transient resume analyses with an automatic 1-hour expiration (TTL) to ensure user privacy.

### Frontend (React/Vite)
- **Structure**: A multi-page application using `react-router-dom`.
- **Mode**: Operates in **Guest Mode** (session-less) to maximize privacy.
- **Styling**: Industrial design aesthetic using **IBM Plex Mono** and Signal Green.
- **Visualization**: Chart.js for diagnostics and a custom Performance Heatmap.

## Key Technologies
- **AI**: Groq LPU (Primary) and Google Gemini (Fallback).
- **Database**: MongoDB (with Mongoose) for transient analysis storage.
- **Parsing**: `pdf-parse` (PDF), `mammoth` (DOCX).
- **Reporting**: `pdfkit`.
- **UI**: React, Tailwind CSS, Framer Motion, Chart.js.

## Development Commands

### Setup
```bash
npm install
cp .env.example .env
# Fill in .env with GROQ_API_KEY, GEMINI_API_KEY, and MONGODB_URI
```

### Running Locally
```bash
# Start both server (8080) and client (5173) concurrently
npm run dev
```

## Development Conventions

- **Module System**: Uses ES Modules (`"type": "module"` in `package.json`).
- **Validation**: Backend uses `zod` for request body and file validation.
- **Environment Variables**:
  - `GROQ_API_KEY`: Required for primary AI analysis.
  - `GEMINI_API_KEY`: Required for fallback analysis and rewriting.
  - `MONGODB_URI`: Required for analysis storage and auto-deletion features.
  - `VITE_API_BASE_URL`: Frontend pointer to the API.

## Project Structure
- `api/`: Vercel-specific serverless function entry.
- `client/`: Frontend source and configuration.
- `server/`: Backend source and business logic.
- `vercel.json`: Configuration for Vercel deployment.
