# Repository Guidelines

## Project Structure & Module Organization

This repository is a Node.js/React monorepo for ResuMetric, an AI resume ATS analyzer. The backend lives in `server/`, with `server/index.js` starting the Express app from `server/app.js`. Domain logic is split into `server/services/` for parsing, ATS scoring, AI providers, Supabase, MongoDB, cover letters, and PDF reports. The Vercel API entry point is `api/index.js`.

The frontend lives in `client/`. `client/src/main.jsx` contains routing and primary UI pages, while feature pages such as authentication and dashboard behavior are in sibling JSX files. Static public assets are in `client/public/`; production output is generated in `client/dist/`. Root config files include `vite`, Tailwind, PostCSS, Vercel, and environment examples.

## Build, Test, and Development Commands

- `npm install`: install root dependencies for both server and Vite client workflow.
- `npm run dev`: start Express with `nodemon` and Vite on `0.0.0.0` for local development.
- `npm run server`: run only the backend API with `node server/index.js`.
- `npm run build`: build the frontend with `vite build client` into `client/dist/`.
- `npm run preview`: serve the production frontend build locally.
- `npm start`: start the backend in production-style mode.

## Coding Style & Naming Conventions

Use ES modules throughout (`import`/`export`) and keep semicolons. Prefer two-space indentation, `const` by default, and `let` only for reassignment. React components use PascalCase (`DashboardPage`), service modules use lowercase descriptive filenames (`groq.js`, `coverletter.js`), and API routes use clear REST-like paths under `/api`. Keep validation close to request handlers with `zod`, and keep provider-specific logic inside `server/services/`.

## Testing Guidelines

No automated test script is currently configured. Before opening a PR, run `npm run build` and manually smoke test `npm run dev`, including upload analysis, auth-dependent dashboard flows, public share links, and PDF generation when touched. If adding tests, prefer colocated `*.test.js` files and add a root `npm test` script.

## Commit & Pull Request Guidelines

Recent history uses Conventional Commits such as `feat: ...`, `fix: ...`, and `docs: ...`; follow that pattern with concise, imperative summaries. Pull requests should include a short description, linked issue or context, environment/config changes, manual test notes, and screenshots or recordings for visible UI changes. Do not commit secrets from `.env`; update `.env.example` when adding required variables.

## Security & Configuration Tips

Resume uploads are intentionally memory-backed and limited in size. Preserve that privacy model when changing parsing or storage. Keep `GROQ_API_KEY`, `GEMINI_API_KEY`, `MONGODB_URI`, Supabase keys, and `CLIENT_URL` in environment variables only.
