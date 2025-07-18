#!/bin/bash

echo "People Matcher Setup Script"
echo "=========================="

# Check Python version
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    echo "Please install Python 3.8 or higher"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install Node.js 16 or higher"
    exit 1
fi

# Check and install Ollama
if ! command -v ollama &> /dev/null; then
    echo "Installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
    
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install Ollama"
        exit 1
    fi
else
    echo "Ollama is already installed"
fi

# Pull the embedding model
echo "Pulling Ollama embedding model..."
ollama pull nomic-embed-text

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to pull embedding model"
    echo "Please make sure Ollama is running: ollama serve"
    exit 1
fi

# Create directories
echo "Creating directories..."
mkdir -p data uploads logs

# Setup backend
echo "Setting up backend..."
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install Python dependencies"
    exit 1
fi

cd ..

# Setup frontend
echo "Setting up frontend..."
cd client

# Install dependencies
npm install

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install Node.js dependencies"
    exit 1
fi

cd ..

# Create .env files from examples
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "Created backend/.env from example"
fi

if [ ! -f client/.env ]; then
    cp client/.env.example client/.env
    echo "Created client/.env from example"
fi

echo "=========================="
echo "Setup complete!"
echo ""
echo "To run the application:"
echo "With Docker: docker-compose up"
echo "Locally: ./run-local.sh"
echo ""
echo "Make sure Ollama is running before starting:"
echo "ollama serve"