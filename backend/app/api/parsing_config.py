from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Dict, List, Optional

from app.models.database import Project, ParsingConfiguration, get_db
from app.services.section_parser import section_parser

router = APIRouter()


class ParsingConfigCreate(BaseModel):
    parsing_method: str = "full_text"  # 'full_text' or 'section_based'
    section_headers: Optional[Dict[str, List[str]]] = None
    use_default_headers: bool = True
    filter_strings: Optional[List[str]] = None


class ParsingConfigResponse(BaseModel):
    id: int
    project_id: int
    parsing_method: str
    section_headers: Optional[Dict[str, List[str]]]
    use_default_headers: bool
    filter_strings: Optional[List[str]]
    default_section_headers: Dict[str, List[str]]  # Always include defaults for reference
    
    class Config:
        from_attributes = True


@router.get("/projects/{project_id}/parsing-config", response_model=ParsingConfigResponse)
async def get_parsing_config(project_id: int, db: AsyncSession = Depends(get_db)):
    """Get parsing configuration for a project"""
    # Verify project exists
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get existing config
    result = await db.execute(
        select(ParsingConfiguration).where(ParsingConfiguration.project_id == project_id)
    )
    config = result.scalar_one_or_none()
    
    if not config:
        # Return default configuration
        return {
            "id": 0,
            "project_id": project_id,
            "parsing_method": "full_text",
            "section_headers": None,
            "use_default_headers": True,
            "filter_strings": None,
            "default_section_headers": section_parser.target_sections
        }
    
    return {
        "id": config.id,
        "project_id": config.project_id,
        "parsing_method": config.parsing_method,
        "section_headers": config.section_headers,
        "use_default_headers": bool(config.use_default_headers),
        "filter_strings": config.filter_strings,
        "default_section_headers": section_parser.target_sections
    }


@router.post("/projects/{project_id}/parsing-config", response_model=ParsingConfigResponse)
async def create_parsing_config(
    project_id: int,
    config_data: ParsingConfigCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create or update parsing configuration for a project"""
    # Verify project exists
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check if config already exists
    result = await db.execute(
        select(ParsingConfiguration).where(ParsingConfiguration.project_id == project_id)
    )
    existing_config = result.scalar_one_or_none()
    
    if existing_config:
        # Update existing config
        existing_config.parsing_method = config_data.parsing_method
        existing_config.section_headers = config_data.section_headers
        existing_config.use_default_headers = 1 if config_data.use_default_headers else 0
        existing_config.filter_strings = config_data.filter_strings
        db_config = existing_config
    else:
        # Create new config
        db_config = ParsingConfiguration(
            project_id=project_id,
            parsing_method=config_data.parsing_method,
            section_headers=config_data.section_headers,
            use_default_headers=1 if config_data.use_default_headers else 0,
            filter_strings=config_data.filter_strings
        )
        db.add(db_config)
    
    await db.commit()
    await db.refresh(db_config)
    
    return {
        "id": db_config.id,
        "project_id": db_config.project_id,
        "parsing_method": db_config.parsing_method,
        "section_headers": db_config.section_headers,
        "use_default_headers": bool(db_config.use_default_headers),
        "filter_strings": db_config.filter_strings,
        "default_section_headers": section_parser.target_sections
    }


@router.put("/projects/{project_id}/parsing-config", response_model=ParsingConfigResponse)
async def update_parsing_config(
    project_id: int,
    config_data: ParsingConfigCreate,
    db: AsyncSession = Depends(get_db)
):
    """Update parsing configuration for a project"""
    return await create_parsing_config(project_id, config_data, db)


@router.delete("/projects/{project_id}/parsing-config")
async def delete_parsing_config(project_id: int, db: AsyncSession = Depends(get_db)):
    """Delete parsing configuration for a project (reverts to defaults)"""
    # Verify project exists
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get existing config
    result = await db.execute(
        select(ParsingConfiguration).where(ParsingConfiguration.project_id == project_id)
    )
    config = result.scalar_one_or_none()
    
    if config:
        await db.delete(config)
        await db.commit()
    
    return {"message": "Parsing configuration deleted successfully"}


@router.get("/parsing-config/default-sections")
async def get_default_sections():
    """Get default section headers used by the parser"""
    return {
        "default_sections": section_parser.target_sections,
        "section_descriptions": {
            "summary": "Professional summary or career objective",
            "specialization": "Area of expertise or specialization",
            "skills": "Technical skills and competencies",
            "current_project": "Current role or project",
            "prior_experience": "Previous work experience",
            "education": "Educational background",
            "certifications": "Professional certifications and licenses"
        }
    }


@router.get("/parsing-config/exact-skills")
async def get_exact_skills():
    """Get list of skills that are matched exactly"""
    return {
        "exact_skills": section_parser.exact_skills,
        "total_count": len(section_parser.exact_skills)
    }