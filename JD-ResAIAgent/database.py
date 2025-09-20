"""
Database configuration and models for RecurAI Resume Screening System
"""

import os
from sqlalchemy import create_engine, Column, String, Integer, DateTime, Text, Boolean, DECIMAL, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from datetime import datetime
from typing import Optional

# Database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://recur_ai_app:app_password_123@localhost:5432/recur_ai_db"
)

# Create engine
engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clerk_id = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    role = Column(String(50), default="recruiter")
    company_name = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    job_postings = relationship("JobPosting", back_populates="user")
    resumes = relationship("Resume", back_populates="user")
    analysis_sessions = relationship("AnalysisSession", back_populates="user")

class JobPosting(Base):
    __tablename__ = "job_postings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    requirements = Column(Text)
    location = Column(String(255))
    salary_range = Column(String(100))
    employment_type = Column(String(50))
    experience_level = Column(String(50))
    status = Column(String(50), default="active")
    s3_jd_key = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="job_postings")
    resumes = relationship("Resume", back_populates="job_posting")
    analysis_sessions = relationship("AnalysisSession", back_populates="job_posting")

class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    job_posting_id = Column(UUID(as_uuid=True), ForeignKey("job_postings.id"), nullable=False)
    candidate_name = Column(String(255), nullable=False)
    candidate_email = Column(String(255))
    candidate_phone = Column(String(50))
    s3_resume_key = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer)
    file_type = Column(String(50))
    status = Column(String(50), default="uploaded")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="resumes")
    job_posting = relationship("JobPosting", back_populates="resumes")
    analyses = relationship("ResumeAnalysis", back_populates="resume")
    skills = relationship("ExtractedSkill", back_populates="resume")
    experiences = relationship("ExtractedExperience", back_populates="resume")
    education = relationship("ExtractedEducation", back_populates="resume")

class AnalysisSession(Base):
    __tablename__ = "analysis_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    job_posting_id = Column(UUID(as_uuid=True), ForeignKey("job_postings.id"), nullable=False)
    session_name = Column(String(255))
    status = Column(String(50), default="pending")
    total_resumes = Column(Integer, default=0)
    processed_resumes = Column(Integer, default=0)
    faiss_job_id = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User", back_populates="analysis_sessions")
    job_posting = relationship("JobPosting", back_populates="analysis_sessions")
    analyses = relationship("ResumeAnalysis", back_populates="analysis_session")

class ResumeAnalysis(Base):
    __tablename__ = "resume_analyses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    analysis_session_id = Column(UUID(as_uuid=True), ForeignKey("analysis_sessions.id"), nullable=False)
    resume_id = Column(UUID(as_uuid=True), ForeignKey("resumes.id"), nullable=False)
    overall_fit_score = Column(DECIMAL(5, 2), nullable=False)
    skill_match_score = Column(DECIMAL(5, 2), nullable=False)
    project_relevance_score = Column(DECIMAL(5, 2), nullable=False)
    problem_solving_score = Column(DECIMAL(5, 2), nullable=False)
    tools_score = Column(DECIMAL(5, 2), nullable=False)
    summary = Column(Text, nullable=False)
    ranking_position = Column(Integer)
    analysis_metadata = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    analysis_session = relationship("AnalysisSession", back_populates="analyses")
    resume = relationship("Resume", back_populates="analyses")

class ExtractedSkill(Base):
    __tablename__ = "extracted_skills"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resume_id = Column(UUID(as_uuid=True), ForeignKey("resumes.id"), nullable=False)
    skill_name = Column(String(255), nullable=False)
    skill_category = Column(String(100))
    confidence_score = Column(DECIMAL(3, 2))
    source_text = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    resume = relationship("Resume", back_populates="skills")

class ExtractedExperience(Base):
    __tablename__ = "extracted_experience"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resume_id = Column(UUID(as_uuid=True), ForeignKey("resumes.id"), nullable=False)
    company_name = Column(String(255))
    job_title = Column(String(255))
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    duration_months = Column(Integer)
    description = Column(Text)
    is_current = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    resume = relationship("Resume", back_populates="experiences")

class ExtractedEducation(Base):
    __tablename__ = "extracted_education"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resume_id = Column(UUID(as_uuid=True), ForeignKey("resumes.id"), nullable=False)
    institution_name = Column(String(255))
    degree = Column(String(255))
    field_of_study = Column(String(255))
    graduation_date = Column(DateTime)
    gpa = Column(DECIMAL(3, 2))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    resume = relationship("Resume", back_populates="education")

class FeedbackEmail(Base):
    __tablename__ = "feedback_emails"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resume_id = Column(UUID(as_uuid=True), ForeignKey("resumes.id"), nullable=False)
    analysis_session_id = Column(UUID(as_uuid=True), ForeignKey("analysis_sessions.id"), nullable=False)
    recruiter_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    candidate_email = Column(String(255), nullable=False)
    candidate_name = Column(String(255), nullable=False)
    feedback_content = Column(Text, nullable=False)
    email_subject = Column(String(500), nullable=False)
    status = Column(String(50), default="sent")  # sent, failed, bounced, delivered, opened
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
    delivered_at = Column(DateTime(timezone=True))
    opened_at = Column(DateTime(timezone=True))
    clicked_at = Column(DateTime(timezone=True))
    error_message = Column(Text)
    email_provider_message_id = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    resume = relationship("Resume")
    analysis_session = relationship("AnalysisSession")
    recruiter = relationship("User")

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create all tables
def create_tables():
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    create_tables()
    print("Database tables created successfully!")

