import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ollama_host: str = "localhost:11434"
    database_url: str = "sqlite:///./data/app.db"
    upload_dir: str = "./uploads"
    cors_origins: List[str] = ["*"]  # Allow all origins - can be restricted in production
    secret_key: str = "your-secret-key-here-change-in-production"
    
    class Config:
        env_file = ".env"


settings = Settings()