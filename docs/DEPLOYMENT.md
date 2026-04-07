# 🚀 Deployment Guide — Rialo Arena

## Overview
- **Frontend** → Vercel (auto-deploy from GitHub)
- **Backend** → Railway (auto-deploy from GitHub)
- **CI/CD** → GitHub Actions (lint + build + deploy on push to main)

---

## Step 1: Push to GitHub

```bash
cd rialo-arena

# Initialize git
git init
git add .
git commit -m "feat: initial Rialo Arena setup"

# Create repo on GitHub (do this on github.com first), then:
git remote add origin https://github.com/YOUR_USERNAME/rialo-arena.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend to Railway

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
2. Select `rialo-arena` repo
3. Set **Root Directory** to `/backend`
4. Add environment variables:
   ```
   PORT=4000
   CLIENT_URL=https://your-app.vercel.app
   ```
5. Railway will auto-detect Node.js and deploy
6. Copy your Railway URL (e.g. `https://rialo-arena-backend.up.railway.app`)
7. Go to Settings → Get your **Deploy Hook URL** (for CI/CD)

---

## Step 3: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Select `rialo-arena` repo
3. Set **Root Directory** to `frontend`
4. Add environment variable:
   ```
   NEXT_PUBLIC_SOCKET_URL=https://your-railway-url.up.railway.app
   ```
5. Click Deploy
6. Copy your Vercel URL

---

## Step 4: Update Backend CORS

Go back to Railway → update environment variable:
```
CLIENT_URL=https://your-actual-vercel-url.vercel.app
```
Redeploy backend.

---

## Step 5: Set GitHub Secrets (for CI/CD)

Go to GitHub repo → Settings → Secrets → Actions → New repository secret:

| Secret Name | Value |
|---|---|
| `VERCEL_TOKEN` | From vercel.com → Settings → Tokens |
| `VERCEL_ORG_ID` | From `.vercel/project.json` after first deploy |
| `VERCEL_PROJECT_ID` | From `.vercel/project.json` after first deploy |
| `NEXT_PUBLIC_SOCKET_URL` | Your Railway backend URL |
| `RAILWAY_DEPLOY_HOOK` | From Railway → Settings → Deploy Hook |

To get Vercel IDs, run locally:
```bash
cd frontend
npx vercel link
cat .vercel/project.json
```

---

## Step 6: Test Full Flow

1. Open your Vercel URL
2. Enter a username
3. Create a room → share the code
4. Open another tab/device → join the room
5. Host clicks Start Game
6. Play! 🎮

---

## Local Development

```bash
# Terminal 1 — Backend
cd backend
cp .env.example .env
npm install
npm run dev
# Runs on http://localhost:4000

# Terminal 2 — Frontend
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
# Runs on http://localhost:3000
```

---

## Troubleshooting

**"Not connected to server"**
- Check `NEXT_PUBLIC_SOCKET_URL` is set correctly in Vercel
- Make sure backend is running on Railway

**CORS errors**
- Make sure `CLIENT_URL` in Railway matches your exact Vercel URL

**Socket not connecting on production**
- Railway uses HTTPS — make sure socket URL uses `https://` not `http://`
- Socket.io will auto-upgrade to WSS (secure websockets)
