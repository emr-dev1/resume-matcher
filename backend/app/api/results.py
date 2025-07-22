from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional, Any
import pandas as pd
import numpy as np
import io

from app.models.database import Project, Position, Resume, Match, get_db
from pydantic import BaseModel

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


class MatchResult(BaseModel):
    match_id: int
    position_id: int
    resume_id: int
    resume_filename: str
    similarity_score: float
    rank: int
    position_data: dict


@router.get("/projects/{project_id}/matches/count")
async def get_project_matches_count(
    project_id: int,
    position_id: Optional[int] = None,
    min_score: Optional[float] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get total count of matches for a project"""
    from sqlalchemy import func
    
    query = select(func.count(Match.id)).where(Match.project_id == project_id)
    
    if position_id:
        query = query.where(Match.position_id == position_id)
    
    if min_score is not None:
        query = query.where(Match.similarity_score >= min_score)
    
    result = await db.execute(query)
    count = result.scalar()
    
    return {"total_matches": count}


@router.get("/projects/{project_id}/matches", response_model=List[MatchResult])
async def get_project_matches(
    project_id: int,
    position_id: Optional[int] = None,
    limit: Optional[int] = None,
    offset: int = 0,
    min_score: Optional[float] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get match results for a project"""
    query = select(Match, Resume, Position).join(Resume).join(Position).where(
        Match.project_id == project_id
    )
    
    if position_id:
        query = query.where(Match.position_id == position_id)
    
    if min_score is not None:
        query = query.where(Match.similarity_score >= min_score)
    
    query = query.order_by(Match.position_id, Match.rank)
    
    if limit is not None:
        query = query.limit(limit)
    
    if offset > 0:
        query = query.offset(offset)
    
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
            position_data=clean_nan_values({col: position.original_data.get(col) for col in position.output_columns})
        ))
    
    return matches


@router.get("/projects/{project_id}/matches/statistics")
async def get_match_statistics(
    project_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get match statistics for analytics"""
    
    # Score distribution (histogram data)
    score_ranges = [
        (0.0, 0.2), (0.2, 0.4), (0.4, 0.6), 
        (0.6, 0.7), (0.7, 0.8), (0.8, 0.9), (0.9, 1.0)
    ]
    
    score_distribution = []
    for min_score, max_score in score_ranges:
        count_query = select(func.count(Match.id)).where(
            Match.project_id == project_id,
            Match.similarity_score >= min_score,
            Match.similarity_score < max_score
        )
        result = await db.execute(count_query)
        count = result.scalar()
        
        score_distribution.append({
            "range": f"{int(min_score*100)}-{int(max_score*100)}%",
            "min_score": min_score,
            "max_score": max_score,
            "count": count
        })
    
    # Top positions by match count
    top_positions_query = select(
        Position.id,
        Position.original_data,
        func.count(Match.id).label('match_count'),
        func.avg(Match.similarity_score).label('avg_score')
    ).join(Match).where(
        Match.project_id == project_id
    ).group_by(Position.id).order_by(func.count(Match.id).desc()).limit(10)
    
    result = await db.execute(top_positions_query)
    top_positions = []
    for position_id, original_data, match_count, avg_score in result:
        # Get position title from original_data
        title = "Unknown Position"
        if original_data and isinstance(original_data, dict):
            title = original_data.get('title') or original_data.get('job_title') or original_data.get('position') or f"Position {position_id}"
        
        top_positions.append({
            "position_id": position_id,
            "title": title,
            "match_count": match_count,
            "avg_score": float(avg_score) if avg_score else 0.0
        })
    
    # Overall statistics
    stats_query = select(
        func.count(Match.id).label('total_matches'),
        func.avg(Match.similarity_score).label('avg_score'),
        func.min(Match.similarity_score).label('min_score'),
        func.max(Match.similarity_score).label('max_score')
    ).where(Match.project_id == project_id)
    
    result = await db.execute(stats_query)
    stats = result.first()
    
    # Quality breakdown
    excellent_count = await db.execute(
        select(func.count(Match.id)).where(
            Match.project_id == project_id, 
            Match.similarity_score >= 0.8
        )
    )
    good_count = await db.execute(
        select(func.count(Match.id)).where(
            Match.project_id == project_id, 
            Match.similarity_score >= 0.6,
            Match.similarity_score < 0.8
        )
    )
    poor_count = await db.execute(
        select(func.count(Match.id)).where(
            Match.project_id == project_id, 
            Match.similarity_score < 0.6
        )
    )
    
    return {
        "score_distribution": score_distribution,
        "top_positions": top_positions,
        "overall_stats": {
            "total_matches": stats.total_matches or 0,
            "avg_score": float(stats.avg_score) if stats.avg_score else 0.0,
            "min_score": float(stats.min_score) if stats.min_score else 0.0,
            "max_score": float(stats.max_score) if stats.max_score else 0.0
        },
        "quality_breakdown": {
            "excellent": excellent_count.scalar() or 0,  # >= 80%
            "good": good_count.scalar() or 0,           # 60-80%
            "poor": poor_count.scalar() or 0            # < 60%
        }
    }


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
            "data": clean_nan_values(position.original_data),
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
            value = position.original_data.get(col)
            # Clean NaN values for export
            if pd.isna(value) or (isinstance(value, float) and (np.isnan(value) or np.isinf(value))):
                row[f"Position_{col}"] = None
            else:
                row[f"Position_{col}"] = value
        
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