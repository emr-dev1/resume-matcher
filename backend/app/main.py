from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from app.config import settings
from app.models.database import init_db
from app.api import projects, upload, processing, results




@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(settings.upload_dir, exist_ok=True)
    os.makedirs("data", exist_ok=True)
    await init_db()
    yield


app = FastAPI(
    title="Resume Position Matcher",
    description="Match resumes to job positions using AI embeddings",
    version="1.0.0",
    lifespan=lifespan
)

# Add standard CORS middleware only
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=False,  # Set to False when using allow_origins=["*"]
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],  # Expose all headers
)

app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(processing.router, prefix="/api", tags=["processing"])
app.include_router(results.router, prefix="/api", tags=["results"])


@app.get("/")
async def root():
    return {"message": "Resume Position Matcher API", "status": "online"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}




