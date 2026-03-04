#!/bin/bash
# Start both backend and frontend concurrently

echo "Starting Persuasion Detector..."

# Start backend
cd backend
pip install -r requirements.txt -q
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
echo "Backend started (PID $BACKEND_PID) at http://localhost:8000"

# Start frontend
cd ../frontend
npm install -q
npm run dev &
FRONTEND_PID=$!
echo "Frontend started (PID $FRONTEND_PID) at http://localhost:5173"

echo ""
echo "Open http://localhost:5173 in your browser"
echo "Press Ctrl+C to stop both servers"

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
