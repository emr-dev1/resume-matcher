import httpx
import asyncio
from typing import List, Optional
import logging

from app.config import settings

logger = logging.getLogger(__name__)


class OllamaService:
    def __init__(self):
        self.base_url = f"http://{settings.ollama_host}"
        self.model = "nomic-embed-text"
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def check_connection(self) -> bool:
        """Check if Ollama service is available"""
        try:
            response = await self.client.get(f"{self.base_url}/api/tags")
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Failed to connect to Ollama: {e}")
            return False
    
    async def generate_embedding(self, text: str, retries: int = 3) -> Optional[List[float]]:
        """Generate embedding for given text with retry logic"""
        for attempt in range(retries):
            try:
                response = await self.client.post(
                    f"{self.base_url}/api/embeddings",
                    json={
                        "model": self.model,
                        "prompt": text
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data.get("embedding")
                else:
                    logger.error(f"Ollama API error: {response.status_code} - {response.text}")
                    
            except Exception as e:
                logger.error(f"Error generating embedding (attempt {attempt + 1}/{retries}): {e}")
                if attempt < retries - 1:
                    await asyncio.sleep(1)
                    
        return None
    
    async def batch_generate_embeddings(self, texts: List[str]) -> List[Optional[List[float]]]:
        """Generate embeddings for multiple texts"""
        embeddings = []
        
        for text in texts:
            embedding = await self.generate_embedding(text)
            embeddings.append(embedding)
            
        return embeddings
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()


ollama_service = OllamaService()