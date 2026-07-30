# ⚡ PromptOps AI — Enterprise Multimodal AI Studio & Prompt Operations

PromptOps AI is a full-stack, enterprise-grade multimodal content studio and prompt operations platform built with React 19, TypeScript, Vite, Tailwind CSS, Express, Firebase, and Backblaze B2 Object Storage.

---

## ✨ Features

- 🎨 **Multimodal AI Generation**: Synthesize images (FLUX.1 / Pollinations), 4K videos (LTX Video / FAL AI), speech (Gemini TTS), and text (Gemini 2.5 Flash).
- 📦 **Backblaze B2 Object Storage**: High-throughput, S3-compatible cloud media hosting with pre-signed URL uploads and zero-egress cost savings.
- 👥 **Team Workspaces & RBAC**: Real-time multi-tenant workspaces with role-based permissions (Owner, Admin, Editor, Viewer).
- 💬 **Threaded Discussions & @Mentions**: Asset-level commenting with user mentions and real-time notification drawer.
- 📜 **Prompt Lineage & Version Diffing**: Track prompt history, compare parameter changes side-by-side, and restore past versions.
- 📊 **Real-Time Analytics**: Interactive dashboards for model usage tracking, generation velocity, and storage metering.
- 🔒 **Enterprise Security**: Firebase Authentication, Express Rate Limiting, Helmet headers, CORS policies, and Firestore Security Rules.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Zustand, Framer Motion, Recharts, Lucide Icons.
- **Backend**: Node.js 20, Express 4, `@aws-sdk/client-s3` (Backblaze B2), `@google/genai` (Gemini API), FFmpeg.
- **Database & Auth**: Firebase Auth, Cloud Firestore (Real-Time DB).
- **Storage**: Backblaze B2 Object Storage (S3 API).
- **Deployment**: Vercel (Frontend SPA), Railway / Render (Backend API), GitHub Actions CI/CD.

---

## 🚀 Quick Start (Running Locally)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/promptops-ai.git
cd promptops-ai
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

### 3. Run Development Server
```bash
npm run dev
```
The application will launch on `http://localhost:3000`.

---

## 🌐 Production Deployment

- **Frontend**: Deploy static SPA to Vercel or Netlify (`npm run build`). Configuration provided in `vercel.json`.
- **Backend**: Deploy Express server to Railway, Render, or Cloud Run (`npm start`). Configuration provided in `railway.json` and `render.yaml`.
- **DevOps Guide**: Complete deployment instructions available in [`DEPLOYMENT.md`](./DEPLOYMENT.md).
- **Devpost Submission Guide**: Complete hackathon submission content available in [`DEVPOST_SUBMISSION.md`](./DEVPOST_SUBMISSION.md).

---

## 📄 License
MIT License © 2026 PromptOps AI Team.
"# PromptOps" 
