@echo off

REM Check if Ollama is running
curl -s http://localhost:11434/api/tags >nul 2>&1
if errorlevel 1 (
    echo ERROR: Ollama is not running. Please start Ollama first.
    echo Run: ollama serve
    exit /b 1
)

REM Create necessary directories
if not exist data mkdir data
if not exist uploads mkdir uploads
if not exist logs mkdir logs

REM Check if virtual environment exists
if not exist backend\venv (
    echo Creating Python virtual environment...
    cd backend
    python -m venv venv
    call venv\Scripts\activate
    pip install -r requirements.txt
    cd ..
) else (
    call backend\venv\Scripts\activate
)

REM Start backend
echo Starting backend server...
cd backend
set OLLAMA_HOST=localhost:11434
set DATABASE_URL=sqlite:///data/app.db
start cmd /k "python -m uvicorn app.main:app --reload --port 8000"
cd ..

REM Install frontend dependencies if needed
if not exist client\node_modules (
    echo Installing frontend dependencies...
    cd client
    npm install
    cd ..
)

REM Start frontend
echo Starting frontend server...
cd client
set VITE_API_URL=http://localhost:8000
start cmd /k "npm run dev"
cd ..

echo ================================
echo Application started successfully!
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:8000
echo Close the command windows to stop
echo ================================
pause