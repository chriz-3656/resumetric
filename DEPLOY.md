# ResuMetric Deployment & Setup Guide

This guide provides complete instructions for configuring, running, and deploying the ResuMetric Enterprise Profile Analytics platform.

---

## 1. Environment Configuration

ResuMetric requires specific environment variables to interface with the Google Gemini AI and MongoDB.

### Required Variables
| Variable | Description |
| :--- | :--- |
| `GEMINI_API_KEY` | Your Google Generative AI API key (from Google AI Studio). |
| `MONGODB_URI` | Your MongoDB connection string (Atlas or Local). |

### Optional / Environment Specific
| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Port for the backend Express server. | `8080` |
| `NODE_ENV` | Environment mode (`development` or `production`). | `development` |
| `CLIENT_URL` | URL of the frontend (for CORS). | `http://localhost:5173` |
| `VITE_API_BASE_URL` | Frontend pointer to the API. | `http://localhost:8080` |

---

## 2. Local Setup

Follow these steps to run ResuMetric on your local machine.

### Prerequisites
- **Node.js**: v20.x or higher.
- **MongoDB**: A running instance (local or Atlas).
- **Google AI Studio Key**: Get one at [aistudio.google.com](https://aistudio.google.com/).

### Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd resumetric

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Open .env and add your GEMINI_API_KEY and MONGODB_URI
```

### Running the Application
```bash
# Start both Frontend and Backend concurrently
npm run dev
```
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:8080`

---

## 3. Deployment (Vercel)

ResuMetric is optimized for deployment on **Vercel** using a monorepo configuration.

### Deployment Steps
1.  **Push to GitHub**: Ensure your code is in a GitHub repository.
2.  **Import to Vercel**: 
    - Log in to Vercel and click "Add New Project".
    - Select your ResuMetric repository.
3.  **Configure Project Settings**:
    - **Framework Preset**: Other (handled by `vercel.json`).
    - **Build Command**: `npm run build`
    - **Output Directory**: `client/dist`
4.  **Add Environment Variables**:
    - In the Vercel project dashboard, go to **Settings > Environment Variables**.
    - Add `GEMINI_API_KEY` and `MONGODB_URI`.
    - (Optional) Add `VITE_API_BASE_URL` if your API is on a different domain.
5.  **Deploy**: Click "Deploy". Vercel will build the React frontend and serve the Express backend via `/api` as defined in `vercel.json`.

---

## 4. Database Setup (MongoDB)

ResuMetric uses a **Transient Storage Model** with auto-deletion.

1.  **Create a Cluster**: Use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) for a free managed cluster.
2.  **Whitelist IP**: Ensure your local IP and Vercel's IPs (or `0.0.0.0/0`) can access the cluster.
3.  **TTL Enforcement**: The system automatically creates a TTL index on the `createdAt` field. No manual configuration is required; data will be purged every 3600 seconds (1 hour).

---

## 5. Architecture Notes

- **API Entry**: The production API is served from `api/index.js` (bridged to `server/app.js`).
- **Static Assets**: Vite builds the frontend into `client/dist`, which is then served by Vercel.
- **Routing**: `react-router-dom` is configured with a fallback to `index.html` in `vercel.json` to support direct URL access to pages like `/about` or `/blog`.
- **Security**: The server uses `multer.memoryStorage()` to ensure resume files never touch physical disk storage.

---
**Creator**: Chriz (@chriz-3656)  
**System**: ResuMetric v1.2.0-stable
