from typing import List, Dict, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
import logging

from app.models.database import Project, Position, Resume, Match
from app.services.embedding_service import embedding_service

logger = logging.getLogger(__name__)


class MatchingService:
    
    async def calculate_matches(self, project_id: int, db: AsyncSession) -> Dict[str, any]:
        """Calculate similarity matches for all resumes and positions in a project"""
        try:
            # Get all positions and resumes with embeddings
            positions_result = await db.execute(
                select(Position).where(
                    Position.project_id == project_id,
                    Position.embedding.isnot(None)
                )
            )
            positions = positions_result.scalars().all()
            
            resumes_result = await db.execute(
                select(Resume).where(
                    Resume.project_id == project_id,
                    Resume.embedding.isnot(None)
                )
            )
            resumes = resumes_result.scalars().all()
            
            if not positions or not resumes:
                return {
                    "status": "error",
                    "message": "No positions or resumes with embeddings found"
                }
            
            # Delete existing matches for this project
            await db.execute(
                delete(Match).where(Match.project_id == project_id)
            )
            
            # Calculate all matches
            total_matches = len(positions) * len(resumes)
            matches_created = 0
            
            for position in positions:
                position_matches = []
                
                for resume in resumes:
                    # Calculate similarity
                    similarity = embedding_service.calculate_similarity(
                        position.embedding,
                        resume.embedding
                    )
                    
                    position_matches.append({
                        'resume_id': resume.id,
                        'similarity': similarity
                    })
                
                # Sort by similarity and assign ranks
                position_matches.sort(key=lambda x: x['similarity'], reverse=True)
                
                # Create match records
                for rank, match_data in enumerate(position_matches, 1):
                    match = Match(
                        project_id=project_id,
                        position_id=position.id,
                        resume_id=match_data['resume_id'],
                        similarity_score=match_data['similarity'],
                        rank=rank
                    )
                    db.add(match)
                    matches_created += 1
            
            await db.commit()
            
            return {
                "status": "success",
                "positions_processed": len(positions),
                "resumes_processed": len(resumes),
                "matches_created": matches_created
            }
            
        except Exception as e:
            logger.error(f"Error calculating matches: {e}")
            await db.rollback()
            return {
                "status": "error",
                "message": str(e)
            }
    
    async def get_top_matches(
        self, 
        project_id: int, 
        position_id: int, 
        limit: int, 
        db: AsyncSession
    ) -> List[Dict]:
        """Get top matches for a specific position"""
        result = await db.execute(
            select(Match, Resume).join(Resume).where(
                Match.project_id == project_id,
                Match.position_id == position_id
            ).order_by(Match.rank).limit(limit)
        )
        
        matches = []
        for match, resume in result:
            matches.append({
                "match_id": match.id,
                "resume_id": resume.id,
                "filename": resume.filename,
                "similarity_score": match.similarity_score,
                "rank": match.rank
            })
            
        return matches


matching_service = MatchingService()