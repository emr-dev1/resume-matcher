from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List, Dict, Any
import pandas as pd
import numpy as np
import json
import os
import uuid
from pathlib import Path

from app.models.database import Project, Position, Resume, ParsingConfiguration, get_db
from app.config import settings
from app.services.pdf_processor import pdf_processor
from app.services.embedding_service import embedding_service

router = APIRouter()


def clean_nan_values(data: Any) -> Any:
    """Recursively clean NaN values from data structures"""
    if isinstance(data, dict):
        return {k: clean_nan_values(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [clean_nan_values(item) for item in data]
    elif isinstance(data, float) and (np.isnan(data) or np.isinf(data)):
        return None
    elif pd.isna(data):
        return None
    else:
        return data


@router.post("/projects/{project_id}/positions")
async def upload_positions(
    project_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """Upload positions CSV or Excel file"""
    # Verify project exists
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Read file
    if file.filename.endswith('.csv'):
        df = pd.read_csv(file.file)
    elif file.filename.endswith(('.xlsx', '.xls')):
        df = pd.read_excel(file.file)
    else:
        raise HTTPException(status_code=400, detail="Invalid file format. Use CSV or Excel.")
    
    # Get column names for selection UI
    columns = df.columns.tolist()
    
    # Convert DataFrame to records
    positions_data = df.to_dict('records')
    
    return {
        "message": "Positions file uploaded successfully",
        "columns": columns,
        "row_count": len(positions_data),
        "preview": positions_data[:5]  # First 5 rows for preview
    }


@router.post("/projects/{project_id}/positions/confirm")
async def confirm_positions(
    project_id: int,
    file: UploadFile = File(...),
    embedding_columns: str = Form(...),
    output_columns: str = Form(...),
    db: AsyncSession = Depends(get_db)
):
    """Confirm positions with selected columns and generate embeddings"""
    # Parse column selections
    embedding_cols = json.loads(embedding_columns)
    output_cols = json.loads(output_columns)
    
    # Read file again
    if file.filename.endswith('.csv'):
        df = pd.read_csv(file.file)
    else:
        df = pd.read_excel(file.file)
    
    positions_data = df.to_dict('records')
    
    # Delete existing positions for this project
    await db.execute(delete(Position).where(Position.project_id == project_id))
    
    # Create positions with embeddings
    created_count = 0
    for row_data in positions_data:
        # Generate embedding
        embedding = await embedding_service.generate_position_embedding(
            row_data, embedding_cols
        )
        
        position = Position(
            project_id=project_id,
            original_data=row_data,
            embedding_columns=embedding_cols,
            output_columns=output_cols,
            embedding=embedding
        )
        db.add(position)
        created_count += 1
    
    await db.commit()
    
    return {
        "message": "Positions created successfully",
        "count": created_count
    }


@router.post("/projects/{project_id}/resumes")
async def upload_resumes(
    project_id: int,
    files: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db)
):
    """Upload multiple resume PDFs"""
    # Verify project exists
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get parsing configuration for the project
    config_result = await db.execute(
        select(ParsingConfiguration).where(ParsingConfiguration.project_id == project_id)
    )
    parsing_config = config_result.scalar_one_or_none()
    
    # Determine parsing method
    parsing_method = "full_text"
    custom_headers = None
    if parsing_config:
        parsing_method = parsing_config.parsing_method
        if not parsing_config.use_default_headers and parsing_config.section_headers:
            custom_headers = parsing_config.section_headers
    
    upload_results = []
    
    # Process files in smaller batches to prevent timeouts and memory issues
    batch_size = 50  # Process 50 files at a time
    total_files = len(files)
    
    # Log upload start for large batches
    if total_files > 100:
        print(f"Starting large upload: {total_files} files, processing in batches of {batch_size}")
    
    for batch_start in range(0, total_files, batch_size):
        batch_end = min(batch_start + batch_size, total_files)
        batch_files = files[batch_start:batch_end]
        
        # Log progress for large uploads
        if total_files > 100:
            print(f"Processing batch {batch_start//batch_size + 1}/{(total_files + batch_size - 1)//batch_size}: files {batch_start + 1}-{batch_end}")
        
        # Process current batch
        for file in batch_files:
            if not file.filename.endswith('.pdf'):
                upload_results.append({
                    "filename": file.filename,
                    "status": "error",
                    "message": "Not a PDF file"
                })
                continue
        
            try:
                # Save file
                file_id = str(uuid.uuid4())
                file_path = os.path.join(settings.upload_dir, f"{file_id}.pdf")
                
                with open(file_path, "wb") as f:
                    content = await file.read()
                    f.write(content)
                
                # Validate PDF
                if not pdf_processor.validate_pdf(file_path):
                    os.remove(file_path)
                    upload_results.append({
                        "filename": file.filename,
                        "status": "error",
                        "message": "Invalid PDF file"
                    })
                    continue
                
                # Extract text, clean it, and optionally parse sections
                raw_text, cleaned_text, parsed_sections = pdf_processor.extract_and_parse_pdf(
                    file_path, 
                    parsing_method=parsing_method,
                    custom_headers=custom_headers,
                    clean_text=True,
                    cleaning_intensity="medium"
                )
                
                if not raw_text or not cleaned_text:
                    os.remove(file_path)
                    upload_results.append({
                        "filename": file.filename,
                        "status": "error",
                        "message": "Could not extract text from PDF"
                    })
                    continue
                
                # Generate embedding using cleaned text for better results
                embedding = await embedding_service.generate_text_embedding(cleaned_text)
                
                # Create resume record
                resume = Resume(
                    project_id=project_id,
                    filename=file.filename,
                    file_path=file_path,
                    extracted_text=raw_text,  # Store original raw text
                    parsed_sections=parsed_sections.get('raw_sections') if parsed_sections else None,
                    parsing_method=parsing_method,
                    embedding=embedding,  # Generated from cleaned text
                    file_metadata={
                        "original_filename": file.filename,
                        "cleaned_text_length": len(cleaned_text),
                        "raw_text_length": len(raw_text),
                        "compression_ratio": round((len(raw_text) - len(cleaned_text)) / len(raw_text) * 100, 1)
                    }
                )
                db.add(resume)
                
                upload_results.append({
                    "filename": file.filename,
                    "status": "success",
                    "text_length": len(raw_text),
                    "cleaned_text_length": len(cleaned_text),
                    "compression_ratio": round((len(raw_text) - len(cleaned_text)) / len(raw_text) * 100, 1)
                })
                
            except Exception as e:
                upload_results.append({
                    "filename": file.filename,
                    "status": "error",
                    "message": str(e)
                })
        
        # Commit batch to database to prevent timeout on large uploads
        try:
            await db.commit()
        except Exception as e:
            await db.rollback()
            # Mark remaining files in this batch as failed
            for file in batch_files:
                if not any(r["filename"] == file.filename for r in upload_results):
                    upload_results.append({
                        "filename": file.filename,
                        "status": "error",
                        "message": f"Database commit failed: {str(e)}"
                    })
    
    success_count = sum(1 for r in upload_results if r["status"] == "success")
    
    return {
        "message": f"Uploaded {success_count} of {len(files)} resumes",
        "results": upload_results
    }


@router.get("/projects/{project_id}/positions")
async def get_positions(
    project_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get all positions for a project"""
    # Verify project exists
    project_result = await db.execute(select(Project).where(Project.id == project_id))
    project = project_result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get all positions
    result = await db.execute(
        select(Position).where(Position.project_id == project_id).order_by(Position.created_at.desc())
    )
    positions = result.scalars().all()
    
    position_list = []
    for position in positions:
        position_data = {
            "id": position.id,
            "project_id": position.project_id,
            "original_data": clean_nan_values(position.original_data),
            "embedding_columns": position.embedding_columns,
            "output_columns": position.output_columns,
            "created_at": position.created_at.isoformat() if position.created_at else None
        }
        position_list.append(position_data)
    
    return position_list


@router.get("/projects/{project_id}/resumes")
async def get_resumes(
    project_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get all resumes for a project"""
    # Verify project exists
    project_result = await db.execute(select(Project).where(Project.id == project_id))
    project = project_result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get all resumes
    result = await db.execute(
        select(Resume).where(Resume.project_id == project_id).order_by(Resume.created_at.desc())
    )
    resumes = result.scalars().all()
    
    resume_list = []
    for resume in resumes:
        resume_data = {
            "id": resume.id,
            "project_id": resume.project_id,
            "filename": resume.filename,
            "file_path": resume.file_path,
            "extracted_text": resume.extracted_text[:200] + "..." if len(resume.extracted_text) > 200 else resume.extracted_text,  # Truncated for display
            "text_length": len(resume.extracted_text),
            "parsed_sections": clean_nan_values(resume.parsed_sections) if resume.parsed_sections else None,
            "parsing_method": resume.parsing_method or "full_text",
            "file_metadata": clean_nan_values(resume.file_metadata),
            "status": "processed",  # Since it's in DB, it's processed
            "created_at": resume.created_at.isoformat() if resume.created_at else None
        }
        resume_list.append(resume_data)
    
    return resume_list


@router.get("/projects/{project_id}/columns")
async def get_position_columns(
    project_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get position columns for a project"""
    result = await db.execute(
        select(Position).where(Position.project_id == project_id).limit(1)
    )
    position = result.scalar_one_or_none()
    
    if not position:
        return {"embedding_columns": [], "output_columns": []}
    
    return {
        "embedding_columns": position.embedding_columns,
        "output_columns": position.output_columns
    }


@router.get("/projects/{project_id}/resumes/{resume_id}")
async def get_resume_details(
    project_id: int,
    resume_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get detailed resume information including full text"""
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.project_id == project_id)
    )
    resume = result.scalar_one_or_none()
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    return {
        "id": resume.id,
        "project_id": resume.project_id,
        "filename": resume.filename,
        "file_path": resume.file_path,
        "extracted_text": resume.extracted_text,  # Full text for detailed view
        "text_length": len(resume.extracted_text),
        "parsed_sections": clean_nan_values(resume.parsed_sections) if resume.parsed_sections else None,
        "parsing_method": resume.parsing_method or "full_text",
        "file_metadata": clean_nan_values(resume.file_metadata),
        "status": "processed",
        "created_at": resume.created_at.isoformat() if resume.created_at else None
    }


@router.post("/projects/{project_id}/resumes/{resume_id}/reparse")
async def reparse_resume(
    project_id: int,
    resume_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Reparse a resume with current parsing configuration"""
    # Get resume
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.project_id == project_id)
    )
    resume = result.scalar_one_or_none()
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # Get parsing configuration
    config_result = await db.execute(
        select(ParsingConfiguration).where(ParsingConfiguration.project_id == project_id)
    )
    parsing_config = config_result.scalar_one_or_none()
    
    # Determine parsing method
    parsing_method = "full_text"
    custom_headers = None
    if parsing_config:
        parsing_method = parsing_config.parsing_method
        if not parsing_config.use_default_headers and parsing_config.section_headers:
            custom_headers = parsing_config.section_headers
    
    try:
        # Reparse the PDF with text cleaning
        raw_text, cleaned_text, parsed_sections = pdf_processor.extract_and_parse_pdf(
            resume.file_path,
            parsing_method=parsing_method,
            custom_headers=custom_headers,
            clean_text=True,
            cleaning_intensity="medium"
        )
        
        if not raw_text or not cleaned_text:
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")
        
        # Update resume record
        resume.extracted_text = raw_text  # Store original raw text
        resume.parsed_sections = parsed_sections.get('raw_sections') if parsed_sections else None
        resume.parsing_method = parsing_method
        
        # Update metadata with cleaning info
        if not resume.file_metadata:
            resume.file_metadata = {}
        resume.file_metadata.update({
            "cleaned_text_length": len(cleaned_text),
            "raw_text_length": len(raw_text),
            "compression_ratio": round((len(raw_text) - len(cleaned_text)) / len(raw_text) * 100, 1)
        })
        
        # Regenerate embedding using cleaned text
        resume.embedding = await embedding_service.generate_text_embedding(cleaned_text)
        
        await db.commit()
        
        return {
            "message": "Resume reparsed successfully",
            "parsing_method": parsing_method,
            "has_sections": bool(resume.parsed_sections)
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error reparsing resume: {str(e)}")


@router.get("/resumes/{resume_id}/pdf")
async def get_resume_pdf(
    resume_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Serve the PDF file for a resume"""
    # Get resume
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id)
    )
    resume = result.scalar_one_or_none()
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # Check if file exists
    if not resume.file_path or not os.path.exists(resume.file_path):
        raise HTTPException(status_code=404, detail="PDF file not found")
    
    # Return the PDF file
    return FileResponse(
        path=resume.file_path,
        media_type="application/pdf",
        filename=resume.filename
    )