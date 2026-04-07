#!/bin/bash
set -e

echo "🎮 Rialo Arena — Setup Script"
echo "=============================="

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Install from https://nodejs.org (v18+)"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js v18+ required. Current: $(node -v)"
  exit 1
fi

echo "✅ Node.js $(node -v) found"

# Backend setup
echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Created backend/.env from example"
fi
cd ..

# Frontend setup
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
if [ ! -f .env.local ]; then
  cp .env.local.example .env.local
  echo "✅ Created frontend/.env.local from example"
fi
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start development:"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd frontend && npm run dev"
echo ""
echo "Then open: http://localhost:3000"
echo ""
echo "📖 Deployment guide: docs/DEPLOYMENT.md"
