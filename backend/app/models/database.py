from sqlalchemy import create_engine, Column, Integer, String, Float, Text, DateTime, ForeignKey, JSON, LargeBinary
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from datetime import datetime

from app.config import settings

Base = declarative_base()

engine = create_async_engine(
    settings.database_url.replace("sqlite:///", "sqlite+aiosqlite:///"),
    echo=True
)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(String, default="active")
    
    positions = relationship("Position", back_populates="project", cascade="all, delete-orphan")
    resumes = relationship("Resume", back_populates="project", cascade="all, delete-orphan")
    matches = relationship("Match", back_populates="project", cascade="all, delete-orphan")
    processing_jobs = relationship("ProcessingJob", back_populates="project", cascade="all, delete-orphan")


class Position(Base):
    __tablename__ = "positions"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    original_data = Column(JSON, nullable=False)
    embedding_columns = Column(JSON, nullable=False)
    output_columns = Column(JSON, nullable=False)
    embedding = Column(LargeBinary)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    project = relationship("Project", back_populates="positions")
    matches = relationship("Match", back_populates="position", cascade="all, delete-orphan")


class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    extracted_text = Column(Text)
    embedding = Column(LargeBinary)
    file_metadata = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    project = relationship("Project", back_populates="resumes")
    matches = relationship("Match", back_populates="resume", cascade="all, delete-orphan")


class Match(Base):
    __tablename__ = "matches"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    position_id = Column(Integer, ForeignKey("positions.id"))
    resume_id = Column(Integer, ForeignKey("resumes.id"))
    similarity_score = Column(Float, nullable=False)
    rank = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    project = relationship("Project", back_populates="matches")
    position = relationship("Position", back_populates="matches")
    resume = relationship("Resume", back_populates="matches")


class ProcessingJob(Base):
    __tablename__ = "processing_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    status = Column(String, nullable=False)
    progress = Column(Integer, default=0)
    error_message = Column(Text)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    
    project = relationship("Project", back_populates="processing_jobs")


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session