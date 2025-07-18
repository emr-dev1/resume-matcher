import numpy as np
from typing import List, Optional
import pickle
import logging

from app.services.ollama_service import ollama_service

logger = logging.getLogger(__name__)


class EmbeddingService:
    
    @staticmethod
    def serialize_embedding(embedding: List[float]) -> bytes:
        """Serialize embedding to bytes for storage"""
        return pickle.dumps(np.array(embedding))
    
    @staticmethod
    def deserialize_embedding(embedding_bytes: bytes) -> np.ndarray:
        """Deserialize embedding from bytes"""
        return pickle.loads(embedding_bytes)
    
    async def generate_text_embedding(self, text: str) -> Optional[bytes]:
        """Generate and serialize embedding for text"""
        embedding = await ollama_service.generate_embedding(text)
        if embedding:
            return self.serialize_embedding(embedding)
        return None
    
    async def generate_position_embedding(self, position_data: dict, embedding_columns: List[str]) -> Optional[bytes]:
        """Generate embedding for position based on selected columns"""
        text_parts = []
        
        for column in embedding_columns:
            if column in position_data and position_data[column]:
                text_parts.append(f"{column}: {position_data[column]}")
        
        if not text_parts:
            logger.warning("No valid columns found for embedding generation")
            return None
            
        combined_text = "\n".join(text_parts)
        return await self.generate_text_embedding(combined_text)
    
    def calculate_similarity(self, embedding1_bytes: bytes, embedding2_bytes: bytes) -> float:
        """Calculate cosine similarity between two embeddings"""
        try:
            embedding1 = self.deserialize_embedding(embedding1_bytes)
            embedding2 = self.deserialize_embedding(embedding2_bytes)
            
            # Cosine similarity
            dot_product = np.dot(embedding1, embedding2)
            norm1 = np.linalg.norm(embedding1)
            norm2 = np.linalg.norm(embedding2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
                
            similarity = dot_product / (norm1 * norm2)
            return float(similarity)
            
        except Exception as e:
            logger.error(f"Error calculating similarity: {e}")
            return 0.0


embedding_service = EmbeddingService()