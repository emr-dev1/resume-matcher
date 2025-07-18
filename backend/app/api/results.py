from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import pandas as pd
import io

from app.models.database import Project, Position, Resume, Match, get_db
from pydantic import BaseModel

router = APIRouter()


class MatchResult(BaseModel):
    match_id: int
    position_id: int
    resume_id: int
    resume_filename: str
    similarity_score: float
    rank: int
    position_data: dict


@router.get("/projects/{project_id}/matches", response_model=List[MatchResult])
async def get_project_matches(
    project_id: int,
    position_id: Optional[int] = None,
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """Get match results for a project"""
    query = select(Match, Resume, Position).join(Resume).join(Position).where(
        Match.project_id == project_id
    )
    
    if position_id:
        query = query.where(Match.position_id == position_id)
    
    query = query.order_by(Match.position_id, Match.rank).limit(limit).offset(offset)
    
    result = await db.execute(query)
    
    matches = []
    for match, resume, position in result:
        matches.append(MatchResult(
            match_id=match.id,
            position_id=match.position_id,
            resume_id=match.resume_id,
            resume_filename=resume.filename,
            similarity_score=match.similarity_score,
            rank=match.rank,
            position_data={col: position.original_data.get(col) for col in position.output_columns}
        ))
    
    return matches


@router.get("/matches/{match_id}")
async def get_match_details(match_id: int, db: AsyncSession = Depends(get_db)):
    """Get detailed information about a specific match"""
    result = await db.execute(
        select(Match, Resume, Position)
        .join(Resume)
        .join(Position)
        .where(Match.id == match_id)
    )
    
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Match not found")
    
    match, resume, position = row
    
    return {
        "match_id": match.id,
        "similarity_score": match.similarity_score,
        "rank": match.rank,
        "resume": {
            "id": resume.id,
            "filename": resume.filename,
            "extracted_text": resume.extracted_text[:500] + "..." if len(resume.extracted_text) > 500 else resume.extracted_text
        },
        "position": {
            "id": position.id,
            "data": position.original_data,
            "embedding_columns": position.embedding_columns,
            "output_columns": position.output_columns
        }
    }


@router.get("/projects/{project_id}/export")
async def export_results(
    project_id: int,
    format: str = "csv",
    db: AsyncSession = Depends(get_db)
):
    """Export match results as CSV or Excel"""
    # Get all matches for the project
    result = await db.execute(
        select(Match, Resume, Position)
        .join(Resume)
        .join(Position)
        .where(Match.project_id == project_id)
        .order_by(Match.position_id, Match.rank)
    )
    
    data = []
    for match, resume, position in result:
        row = {
            "Resume": resume.filename,
            "Similarity Score": match.similarity_score,
            "Rank": match.rank
        }
        
        # Add position data columns
        for col in position.output_columns:
            row[f"Position_{col}"] = position.original_data.get(col)
        
        data.append(row)
    
    if not data:
        raise HTTPException(status_code=404, detail="No matches found for export")
    
    df = pd.DataFrame(data)
    
    if format == "csv":
        output = io.StringIO()
        df.to_csv(output, index=False)
        content = output.getvalue()
        media_type = "text/csv"
        filename = f"matches_project_{project_id}.csv"
    else:
        output = io.BytesIO()
        df.to_excel(output, index=False)
        content = output.getvalue()
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        filename = f"matches_project_{project_id}.xlsx"
    
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )