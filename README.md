# 🎮 Reflex Arena: Rialo Edition

A competitive real-time multiplayer quiz & reflex game built on Web3/Rialo.

## Stack
- **Frontend:** Next.js 14 → deployed to Vercel
- **Backend:** Node.js + Socket.io → deployed to Railway
- **Monorepo:** Both in one GitHub repo

## Project Structure
```
rialo-arena/
├── frontend/          # Next.js app
├── backend/           # Node.js + Socket.io server
├── .github/workflows/ # CI/CD pipelines
└── README.md
```

## Quick Start

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/rialo-arena.git
cd rialo-arena

# Backend
cd backend && npm install && npm run dev

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

## Environment Variables

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

### Backend (`backend/.env`)
```
PORT=4000
CLIENT_URL=http://localhost:3000
```

## Deployment
- Frontend → Vercel (auto-deploy on push to main)
- Backend → Railway (auto-deploy on push to main)

See `/docs/DEPLOYMENT.md` for full guide.
