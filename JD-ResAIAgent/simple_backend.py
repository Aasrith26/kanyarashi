"""
Simple RecurAI Backend for Testing
"""

import os
import json
import uuid
from datetime import datetime
from typing import List, Dict, Optional

import psycopg2
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="RecurAI Simple Backend",
    description="Simple backend for testing RecurAI functionality",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection function
def get_db_connection():
    try:
        conn = psycopg2.connect(
            host="localhost",
            port="5432",
            database="recur_ai_db",
            user="postgres",
            password="prameela@65"  # Replace with your actual password
        )
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

# Pydantic models
class UserCreate(BaseModel):
    clerk_id: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company_name: Optional[str] = None

class JobPostingCreate(BaseModel):
    title: str
    description: str
    requirements: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    employment_type: Optional[str] = None
    experience_level: Optional[str] = None

# API Routes
@app.get("/")
def read_root():
    return {
        "status": "ok", 
        "message": "RecurAI Simple Backend is running!",
        "version": "1.0.0",
        "database": "Connected ✅"
    }

@app.get("/health")
def health_check():
    conn = get_db_connection()
    if conn:
        conn.close()
        return {"status": "healthy", "database": "connected"}
    else:
        return {"status": "unhealthy", "database": "disconnected"}

@app.post("/users/")
def create_user(user_data: UserCreate):
    """Create a new user"""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cur = conn.cursor()
        
        # Check if user already exists
        cur.execute("SELECT id FROM users WHERE clerk_id = %s", (user_data.clerk_id,))
        existing_user = cur.fetchone()
        
        if existing_user:
            return {"message": "User already exists", "user_id": str(existing_user[0])}
        
        # Create new user
        cur.execute("""
            INSERT INTO users (clerk_id, email, first_name, last_name, company_name)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """, (user_data.clerk_id, user_data.email, user_data.first_name, 
              user_data.last_name, user_data.company_name))
        
        user_id = cur.fetchone()[0]
        conn.commit()
        
        return {"message": "User created successfully", "user_id": str(user_id)}
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")
    finally:
        cur.close()
        conn.close()

@app.post("/job-postings/")
def create_job_posting(job_data: JobPostingCreate, clerk_id: str):
    """Create a new job posting"""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cur = conn.cursor()
        
        # Get user
        cur.execute("SELECT id FROM users WHERE clerk_id = %s", (clerk_id,))
        user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Create job posting
        cur.execute("""
            INSERT INTO job_postings (user_id, title, description, requirements, 
                                    location, salary_range, employment_type, experience_level)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (user[0], job_data.title, job_data.description, job_data.requirements,
              job_data.location, job_data.salary_range, job_data.employment_type, 
              job_data.experience_level))
        
        job_id = cur.fetchone()[0]
        conn.commit()
        
        return {"message": "Job posting created successfully", "job_id": str(job_id)}
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating job posting: {str(e)}")
    finally:
        cur.close()
        conn.close()

@app.get("/users/{clerk_id}")
def get_user(clerk_id: str):
    """Get user by clerk_id"""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT id, clerk_id, email, first_name, last_name, company_name, created_at
            FROM users WHERE clerk_id = %s
        """, (clerk_id,))
        
        user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "id": str(user[0]),
            "clerk_id": user[1],
            "email": user[2],
            "first_name": user[3],
            "last_name": user[4],
            "company_name": user[5],
            "created_at": user[6].isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving user: {str(e)}")
    finally:
        cur.close()
        conn.close()

@app.get("/job-postings/")
def get_job_postings(clerk_id: str):
    """Get all job postings for a user"""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT jp.id, jp.title, jp.description, jp.location, jp.status, jp.created_at
            FROM job_postings jp
            JOIN users u ON jp.user_id = u.id
            WHERE u.clerk_id = %s
            ORDER BY jp.created_at DESC
        """, (clerk_id,))
        
        jobs = cur.fetchall()
        return [
            {
                "id": str(job[0]),
                "title": job[1],
                "description": job[2],
                "location": job[3],
                "status": job[4],
                "created_at": job[5].isoformat()
            }
            for job in jobs
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving job postings: {str(e)}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting RecurAI Simple Backend...")
    print("📊 Database connection test...")
    
    # Test database connection
    conn = get_db_connection()
    if conn:
        print("✅ Database connected successfully!")
        conn.close()
    else:
        print("❌ Database connection failed!")
        exit(1)
    
    print("🌐 Starting server on http://localhost:8000")
    print("📚 API docs available at http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)
