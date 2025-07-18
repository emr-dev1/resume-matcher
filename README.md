# Resume Position Matcher

A fully offline AI-powered tool that matches resumes to job positions using local Ollama embeddings. Built with FastAPI backend and React frontend with TailwindCSS.

## Features

- **Offline Operation**: All processing happens locally using Ollama embeddings
- **Smart Matching**: Uses AI embeddings to calculate similarity between resumes and positions
- **Flexible Input**: Supports CSV/Excel for positions and PDF for resumes
- **Column Selection**: Choose which position columns to use for matching and output
- **Project Management**: Track multiple comparison sessions with embedded data persistence
- **Export Options**: Download results as CSV or Excel files
- **Real-time Status**: Monitor processing progress with live updates

## Prerequisites

- **Python 3.8+** - For the backend
- **Node.js 16+** - For the frontend
- **Ollama** - For local AI embeddings ([Install from ollama.com](https://ollama.com/))

## Quick Start

### Option 1: Automatic Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd people-matcher
   ```

2. **Run setup script**
   ```bash
   # On Mac/Linux
   ./setup.sh
   
   # On Windows
   setup.bat
   ```

3. **Start Ollama service**
   ```bash
   ollama serve
   ```

4. **Run the application**
   ```bash
   # On Mac/Linux
   ./run-local.sh
   
   # On Windows
   run-local.bat
   ```

### Option 2: Docker Deployment

1. **Install Ollama and start the service**
   ```bash
   curl -fsSL https://ollama.com/install.sh | sh
   ollama serve  # Keep this running
   ollama pull nomic-embed-text
   ```

2. **Build and run with Docker**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost:8000

### Option 3: Manual Setup

1. **Install Ollama**
   ```bash
   curl -fsSL https://ollama.com/install.sh | sh
   ollama pull nomic-embed-text
   ```

2. **Setup Backend**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Setup Frontend**
   ```bash
   cd client
   npm install
   ```

4. **Create environment files**
   ```bash
   cp backend/.env.example backend/.env
   cp client/.env.example client/.env
   ```

5. **Start services**
   ```bash
   # Terminal 1: Start Ollama
   ollama serve
   
   # Terminal 2: Start backend
   cd backend
   source venv/bin/activate
   uvicorn app.main:app --reload --port 8000
   
   # Terminal 3: Start frontend
   cd client
   npm run dev
   ```

## Usage

1. **Create a Project**: Start by creating a new project to organize your comparisons

2. **Upload Positions**: Upload a CSV or Excel file containing job positions
   - Select which columns to use for embedding generation (job title, description, requirements, etc.)
   - Choose which columns to include in the output results

3. **Upload Resumes**: Upload PDF resume files (supports multiple files at once)
   - Text is automatically extracted using PyPDF2
   - Falls back to OCR (EasyOCR) for image-based PDFs

4. **Start Processing**: Initiate the matching process
   - Embeddings are generated using local Ollama API
   - Similarity scores are calculated using cosine similarity
   - Results are ranked by best matches for each position

5. **View Results**: Browse match results with sortable and filterable tables
   - See similarity scores and rankings
   - View detailed match information
   - Export results as CSV or Excel

## Project Structure

```
people-matcher/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── models/         # Database models
│   │   ├── services/       # Business logic
│   │   └── main.py         # FastAPI app
│   ├── requirements.txt
│   └── Dockerfile
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client
│   │   └── App.jsx
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml      # Docker configuration
├── setup.sh               # Setup script (Unix)
├── setup.bat              # Setup script (Windows)
├── run-local.sh           # Local run script (Unix)
├── run-local.bat          # Local run script (Windows)
└── README.md
```

## API Documentation

Once the backend is running, visit http://localhost:8000/docs for interactive API documentation.

Key endpoints:
- `POST /api/projects` - Create new project
- `POST /api/projects/{id}/positions` - Upload positions
- `POST /api/projects/{id}/resumes` - Upload resumes
- `POST /api/projects/{id}/process` - Start matching
- `GET /api/projects/{id}/matches` - Get results

## Configuration

### Backend Environment Variables
```bash
OLLAMA_HOST=localhost:11434          # Ollama API host
DATABASE_URL=sqlite:///./data/app.db # Database connection
UPLOAD_DIR=./uploads                 # File upload directory
CORS_ORIGINS=["http://localhost:5173"] # Allowed origins
```

### Frontend Environment Variables
```bash
VITE_API_URL=http://localhost:8000   # Backend API URL
```

## Troubleshooting

### Ollama Connection Issues
- Ensure Ollama is running: `ollama serve`
- Check if the model is installed: `ollama list`
- Pull the embedding model: `ollama pull nomic-embed-text`

### PDF Processing Issues
- For image-based PDFs, EasyOCR is used as fallback
- Large PDFs may take longer to process
- Ensure PDFs are not password-protected

### Port Conflicts
- Backend runs on port 8000 by default
- Frontend runs on port 5173 (Vite) or 80 (Docker)
- Modify ports in environment files if needed

### Memory Issues
- Large batches of resumes may consume significant memory
- Process files in smaller batches if needed
- Monitor system resources during processing

## Technical Details

### Embedding Generation
- Uses Ollama's `nomic-embed-text` model for generating embeddings
- Position embeddings are created from selected columns
- Resume embeddings are generated from extracted text
- All embeddings are stored in SQLite for reuse

### Similarity Calculation
- Cosine similarity is used for matching
- Scores range from 0 (no similarity) to 1 (identical)
- Results are ranked by similarity score for each position

### Data Storage
- SQLite database for all project data
- Embeddings stored as binary data for efficiency
- File uploads stored locally with metadata tracking
- Projects maintain embedding data for incremental additions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Your License Here]