#!/bin/bash
# MemoryVault — Quick Start
# Run this from the project root: ./start.sh

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

if [ ! -f "$ROOT/.env" ]; then
  echo "ERROR: .env file not found."
  echo "Create one: echo 'GEMINI_API_KEY=your_key_here' > .env"
  echo "Get your key at: https://ai.google.dev/"
  exit 1
fi

echo ""
echo "🧠 Starting MemoryVault..."
echo ""

# Start backend
echo "→ Starting FastAPI backend on http://localhost:8000"
cd "$ROOT/backend"
./venv/bin/uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# Start frontend
echo "→ Starting Next.js frontend on http://localhost:3000"
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers running!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop both."
echo ""

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
