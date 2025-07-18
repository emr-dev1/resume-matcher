from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime

from app.models.database import Project, ProcessingJob, Position, Resume, get_db, AsyncSessionLocal
from app.services.matching_service import matching_service
from app.services.ollama_service import ollama_service

router = APIRouter()


async def process_matches_background(project_id: int):
    """Background task to process matches"""
    async with AsyncSessionLocal() as db:
        try:
            # Update job status to started
            result = await db.execute(
                select(ProcessingJob).where(
                    ProcessingJob.project_id == project_id,
                    ProcessingJob.status == "pending"
                ).order_by(ProcessingJob.id.desc()).limit(1)
            )
            job = result.scalar_one_or_none()
            
            if job:
                job.status = "processing"
                job.started_at = datetime.utcnow()
                await db.commit()
                
                # Calculate matches
                result = await matching_service.calculate_matches(project_id, db)
                
                # Update job status
                if result["status"] == "success":
                    job.status = "completed"
                    job.progress = 100
                else:
                    job.status = "failed"
                    job.error_message = result.get("message", "Unknown error")
                
                job.completed_at = datetime.utcnow()
                await db.commit()
                
        except Exception as e:
            if job:
                job.status = "failed"
                job.error_message = str(e)
                job.completed_at = datetime.utcnow()
                await db.commit()


@router.post("/projects/{project_id}/process")
async def start_processing(
    project_id: int,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Start matching process for a project"""
    # Verify project exists
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check if Ollama is available
    if not await ollama_service.check_connection():
        raise HTTPException(
            status_code=503,
            detail="Ollama service is not available. Please ensure Ollama is running."
        )
    
    # Check if project has positions and resumes
    positions_count = await db.scalar(
        select(func.count()).select_from(Position).where(Position.project_id == project_id)
    )
    resumes_count = await db.scalar(
        select(func.count()).select_from(Resume).where(Resume.project_id == project_id)
    )
    
    if positions_count == 0:
        raise HTTPException(status_code=400, detail="No positions found in project")
    if resumes_count == 0:
        raise HTTPException(status_code=400, detail="No resumes found in project")
    
    # Create processing job
    job = ProcessingJob(
        project_id=project_id,
        status="pending",
        progress=0
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    
    # Start background processing
    background_tasks.add_task(process_matches_background, project_id)
    
    return {
        "job_id": job.id,
        "status": "started",
        "message": f"Processing {positions_count} positions against {resumes_count} resumes"
    }


@router.get("/jobs/{job_id}/status")
async def get_job_status(job_id: int, db: AsyncSession = Depends(get_db)):
    """Get processing job status"""
    result = await db.execute(select(ProcessingJob).where(ProcessingJob.id == job_id))
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return {
        "job_id": job.id,
        "status": job.status,
        "progress": job.progress,
        "error_message": job.error_message,
        "started_at": job.started_at,
        "completed_at": job.completed_at
    }


@router.post("/embeddings/generate")
async def test_embedding_generation(text: str):
    """Test endpoint to generate embeddings via Ollama"""
    if not await ollama_service.check_connection():
        raise HTTPException(
            status_code=503,
            detail="Ollama service is not available"
        )
    
    embedding = await ollama_service.generate_embedding(text)
    
    if embedding:
        return {
            "text": text,
            "embedding_size": len(embedding),
            "sample": embedding[:5]  # First 5 values
        }
    else:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate embedding"
        )