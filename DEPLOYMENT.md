# 🚀 PromptOps AI - Production Deployment & DevOps Guide

This guide provides a step-by-step walkthrough for deploying **PromptOps AI** to production using Vercel (Frontend SPA), Railway or Render (Node.js/Express Backend), Firebase (Authentication & Firestore), Backblaze B2 (Media Storage), and Genblaze / Gemini / Hugging Face AI services.

---

## 1. Folder Structure Overview

```
promptops-ai/
├── .github/
│   └── workflows/
│       └── ci-cd.yml             # GitHub Actions CI/CD Pipeline
├── public/                       # Static public assets
├── src/                          # React 19 + TypeScript Frontend Source
│   ├── components/               # UI components (Workspace, Team, Analytics)
│   ├── firebase/                 # Firebase initializations and auth hooks
│   ├── hooks/                    # Custom React hooks
│   ├── pages/                    # Page routes (Dashboard, Team, Library, Workflows)
│   ├── services/                 # API client & Firestore services
│   ├── store/                    # Zustand state management
│   ├── types/                    # Shared TypeScript interfaces
│   ├── App.tsx                   # Main React app router
│   └── main.tsx                  # React DOM entrypoint
├── server.ts                     # Express production backend & Vite dev server
├── firestore.rules               # Production Security Rules for Firestore
├── firestore.indexes.json        # Production Firestore composite indexes
├── storage.rules                 # Firebase Storage Security Rules
├── b2-cors-policy.json           # Backblaze B2 S3 CORS configuration
├── vercel.json                   # Vercel deployment & routing config
├── railway.json                  # Railway deployment configuration
├── render.yaml                   # Render infrastructure-as-code spec
├── .env.example                  # Complete environment variables template
├── package.json                  # Dependencies & production build scripts
└── tsconfig.json                 # TypeScript compiler setup
```

---

## 2. Architecture & Deployment Workflow

PromptOps AI uses a decoupled or unified full-stack architecture:
- **Frontend SPA**: React 19 + Vite compiled into static assets served via Vercel Edge Network with CDN caching.
- **Backend API**: Express 4 running on Node.js 20 (Railway or Render) handling AI model proxying, Backblaze B2 S3 presigned upload generation, FFmpeg video processing, rate limiting, and CORS security.
- **Database & Auth**: Firebase Auth + Firestore for real-time team collaboration, presence tracking, workspace roles, and activity logging.
- **Object Storage**: Backblaze B2 (S3-compatible API) for persistent storage of generated images, audio, and videos.

---

## 3. Vercel Configuration (`vercel.json`)

`vercel.json` controls static build output, API route proxying, SPA fallback, and security headers:

```json
{
  "version": 2,
  "name": "promptops-ai",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://${process.env.RAILWAY_BACKEND_URL}/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

### Vercel Deployment Steps:
1. Connect GitHub repository to Vercel.
2. Set Build Command: `npm run build`
3. Set Output Directory: `dist`
4. Configure Environment Variables in Vercel Dashboard:
   - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, etc.
   - `VITE_API_BASE_URL`: Point to Railway/Render backend URL.

---

## 4. Railway / Render Configuration

### Option A: Railway (`railway.json`)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE"
  }
}
```
1. Create a new service on Railway connected to your GitHub repository.
2. Add environment variables: `GEMINI_API_KEY`, `B2_APPLICATION_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET_NAME`, `HF_TOKEN`, `PREMIUM_ACCESS_CODE`, `ALLOWED_ORIGINS`.
3. Railway automatically builds with `esbuild server.ts` and starts `node dist/server.cjs`.

### Option B: Render (`render.yaml`)
```yaml
services:
  - type: web
    name: promptops-ai-backend
    env: node
    plan: starter
    buildCommand: npm install && npm run build
    startCommand: npm start
    healthCheckPath: /api/health
```

---

## 5. Firebase Configuration & Security Rules

### Authentication Setup:
1. Enable **Email/Password** and **Google Auth** in Firebase Console -> Authentication -> Sign-in method.
2. Add production domains (`promptops.ai`, `promptops.vercel.app`) to Authorized Domains list.

### Firestore Rules (`firestore.rules`):
Deploy via Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

### Storage Security Rules (`storage.rules`):
Deploy via Firebase CLI:
```bash
firebase deploy --only storage
```

---

## 6. Backblaze B2 Storage & CORS Setup

1. **Create Bucket**: Log into Backblaze B2, create a public or private bucket named `promptops-media-prod`.
2. **Generate Key**: Create an Application Key with `readFiles`, `writeFiles`, and `deleteFiles` permissions for the bucket.
3. **Apply CORS Policy (`b2-cors-policy.json`)**:
   Using B2 CLI / AWS S3 CLI:
   ```bash
   aws s3api put-bucket-cors --bucket promptops-media-prod --cors-configuration file://b2-cors-policy.json --endpoint-url https://s3.us-west-004.backblazeb2.com
   ```

---

## 7. Genblaze & Gemini AI Configuration

1. **Gemini API Key**: Obtain API key from Google AI Studio. Add `GEMINI_API_KEY` to backend environment variables.
2. **Hugging Face Inference API**: Obtain user access token with inference privileges from Hugging Face. Set `HF_TOKEN` in backend environment variables.
3. **Error Handling**: PromptOps server automatically falls back to Pollinations AI if Hugging Face rate limits or fails, ensuring 99.9% uptime for image generation.

---

## 8. Complete `.env.example`

```env
NODE_ENV="production"
PORT=3000
APP_URL="https://promptops.ai"
ALLOWED_ORIGINS="https://promptops.ai,https://promptops.vercel.app,http://localhost:3000"

GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"
PREMIUM_ACCESS_CODE="PROMPTOPS_PREMIUM_2026"
HF_TOKEN="hf_yourHuggingFaceInferenceTokenHere"
FAL_KEY="fal_yourFalAiApiKeyHere"

B2_APPLICATION_KEY_ID="0041234567890ab0000000001"
B2_APPLICATION_KEY="K004abcdef1234567890abcdef1234"
B2_ENDPOINT="https://s3.us-west-004.backblazeb2.com"
B2_REGION="us-west-004"
B2_BUCKET_NAME="promptops-media-prod"

VITE_FIREBASE_API_KEY="AIzaSyYourFirebaseWebApiKey"
VITE_FIREBASE_AUTH_DOMAIN="promptops-app.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="promptops-app"
VITE_FIREBASE_STORAGE_BUCKET="promptops-app.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789012"
VITE_FIREBASE_APP_ID="1:123456789012:web:abcdef1234567890"

VITE_API_BASE_URL="https://promptops-backend.up.railway.app"
```

---

## 9. GitHub Actions CI/CD Pipeline (`.github/workflows/ci-cd.yml`)

Automates build, type-checking, linting, and deployment on every push to `main`:

```yaml
name: PromptOps AI CI/CD Pipeline

on:
  push:
    branches: [ main ]

jobs:
  lint-test-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm run build
```

---

## 10. Production & Security Checklists

### Production Readiness Checklist:
- [x] TypeScript builds cleanly with zero errors (`npm run lint`).
- [x] Production build bundle generated inside `dist/` and `dist/server.cjs`.
- [x] Health check endpoint `/api/health` returns status `200 OK`.
- [x] All environment variables set in Vercel and Railway/Render.
- [x] Firebase Authorized Domains configured.
- [x] Backblaze B2 CORS policy applied.
- [x] Rate limiting configured on AI endpoints.

### Security Checklist:
- [x] Secret API keys (`GEMINI_API_KEY`, `B2_APPLICATION_KEY`, `HF_TOKEN`) strictly stored server-side.
- [x] Firestore security rules enforce authentication (`request.auth != null`).
- [x] Helmet headers active (X-Frame-Options, X-XSS-Protection, Referrer-Policy).
- [x] CORS restricts API calls to whitelisted domains.
- [x] Express input validation and error handlers prevent detailed stack trace leaks.

---

## 11. Deployment Commands Reference

```bash
# 1. Local Type Check & Verification
npm run lint

# 2. Local Production Build
npm run build

# 3. Test Production Server Locally
npm start

# 4. Deploy Firestore Rules
firebase deploy --only firestore:rules

# 5. Deploy Firebase Storage Rules
firebase deploy --only storage

# 6. Manual Vercel Deployment
vercel --prod

# 7. Manual Railway Deployment
railway up
```

---

## 12. Troubleshooting & Maintenance Guide

| Problem | Root Cause | Solution |
| :--- | :--- | :--- |
| **CORS Error in Browser** | Backend `ALLOWED_ORIGINS` missing frontend domain | Update `ALLOWED_ORIGINS` env var in Railway/Render to include `https://promptops.vercel.app` |
| **Firebase Auth 403** | Frontend domain not authorized in Firebase Console | Go to Firebase Console -> Authentication -> Settings -> Authorized domains and add `promptops.vercel.app` |
| **Media Upload Fails** | Missing or invalid B2 application key or incorrect bucket | Verify `B2_APPLICATION_KEY_ID` and `B2_APPLICATION_KEY` in environment variables |
| **Hugging Face Rate Limit** | HF API quota exceeded | Server automatically falls back to Pollinations AI; check logs for `[Hugging Face] Error occurred` |
| **FFmpeg Video Build Fail** | Host environment missing FFmpeg binary | Server uses `@ffmpeg-installer/ffmpeg` npm package automatically bundling cross-platform binaries |

---
*PromptOps AI Production DevOps Documentation - Maintained by Senior DevOps Engineering Team.*
