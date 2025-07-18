#!/bin/bash

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "ERROR: Ollama is not running. Please start Ollama first."
    echo "Run: ollama serve"
    exit 1
fi

# Create necessary directories
mkdir -p data uploads logs

# Check if virtual environment exists
if [ ! -d "backend/venv" ]; then
    echo "Creating Python virtual environment..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
else
    source backend/venv/bin/activate
fi

# Start backend
echo "Starting backend server..."
cd backend
export OLLAMA_HOST=localhost:11434
export DATABASE_URL=sqlite:///data/app.db
python -m uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Install frontend dependencies if needed
if [ ! -d "client/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd client
    npm install
    cd ..
fi

# Start frontend
echo "Starting frontend server..."
cd client
export VITE_API_URL=http://localhost:8000
npm run dev &
FRONTEND_PID=$!
cd ..

echo "================================"
echo "Application started successfully!"
echo "Frontend: http://localhost:5173"
echo "Backend API: http://localhost:8000"
echo "Press Ctrl+C to stop"
echo "================================"

# Handle shutdown
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT

# Wait for processes
wait