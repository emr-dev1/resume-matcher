#!/usr/bin/env python3

import asyncio
import os
import sys
import sqlite3
from sqlalchemy.ext.asyncio import create_async_engine
from app.models.database import Base, engine

async def add_indexes():
    """Add indexes to the matches table for better performance"""
    
    # Get the database URL from the environment or use default
    db_path = os.getenv('DATABASE_URL', 'sqlite:///./people_matcher.db').replace('sqlite:///', '')
    
    print(f"Adding indexes to database: {db_path}")
    
    if not os.path.exists(db_path):
        print(f"Database file {db_path} does not exist!")
        return False
    
    try:
        # Use synchronous SQLite connection for index creation
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if indexes already exist
        cursor.execute("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_match_project_position_rank'")
        if cursor.fetchone():
            print("Indexes already exist, skipping...")
            conn.close()
            return True
        
        print("Creating indexes...")
        
        # Create composite indexes for common query patterns
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_match_project_id ON matches(project_id)",
            "CREATE INDEX IF NOT EXISTS idx_match_position_id ON matches(position_id)", 
            "CREATE INDEX IF NOT EXISTS idx_match_resume_id ON matches(resume_id)",
            "CREATE INDEX IF NOT EXISTS idx_match_similarity_score ON matches(similarity_score)",
            "CREATE INDEX IF NOT EXISTS idx_match_rank ON matches(rank)",
            "CREATE INDEX IF NOT EXISTS idx_match_project_position_rank ON matches(project_id, position_id, rank)",
            "CREATE INDEX IF NOT EXISTS idx_match_project_score ON matches(project_id, similarity_score)"
        ]
        
        for index_sql in indexes:
            print(f"Executing: {index_sql}")
            cursor.execute(index_sql)
        
        conn.commit()
        conn.close()
        
        print("✅ All indexes created successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error creating indexes: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(add_indexes())
    sys.exit(0 if success else 1)