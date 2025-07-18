@echo off

echo People Matcher Setup Script
echo ==========================

REM Check Python version
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed
    echo Please install Python 3.8 or higher
    exit /b 1
)

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed
    echo Please install Node.js 16 or higher
    exit /b 1
)

REM Check Ollama
ollama --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Ollama is not installed
    echo Please install Ollama from https://ollama.com/
    exit /b 1
) else (
    echo Ollama is already installed
)

REM Pull the embedding model
echo Pulling Ollama embedding model...
ollama pull nomic-embed-text

if errorlevel 1 (
    echo ERROR: Failed to pull embedding model
    echo Please make sure Ollama is running: ollama serve
    exit /b 1
)

REM Create directories
echo Creating directories...
if not exist data mkdir data
if not exist uploads mkdir uploads
if not exist logs mkdir logs

REM Setup backend
echo Setting up backend...
cd backend

REM Create virtual environment
python -m venv venv
call venv\Scripts\activate

REM Install dependencies
pip install -r requirements.txt

if errorlevel 1 (
    echo ERROR: Failed to install Python dependencies
    exit /b 1
)

cd ..

REM Setup frontend
echo Setting up frontend...
cd client

REM Install dependencies
npm install

if errorlevel 1 (
    echo ERROR: Failed to install Node.js dependencies
    exit /b 1
)

cd ..

REM Create .env files from examples
if not exist backend\.env (
    copy backend\.env.example backend\.env
    echo Created backend\.env from example
)

if not exist client\.env (
    copy client\.env.example client\.env
    echo Created client\.env from example
)

echo ==========================
echo Setup complete!
echo.
echo To run the application:
echo With Docker: docker-compose up
echo Locally: run-local.bat
echo.
echo Make sure Ollama is running before starting:
echo ollama serve
pause