"""
Enhanced RecurAI Resume Screening System with PostgreSQL Integration
"""

import os
import re
import json
import asyncio
import uuid
from io import BytesIO
from typing import List, Dict, Optional
from collections import defaultdict
from datetime import datetime

import aioboto3
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from docx import Document as DocxDocument
import pdfplumber
from sqlalchemy.orm import Session

from langchain_core.documents import Document as LangchainDocument
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser

from database import get_db, create_tables, User, JobPosting, Resume, AnalysisSession, ResumeAnalysis

print("🚀 [INIT] Initializing enhanced RecurAI application...")
load_dotenv()

# CORS origins
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

# Settings
class Settings(BaseModel):
    s3_bucket: str = os.getenv("S3_BUCKET")
    aws_access_key: str = os.getenv("AWS_ACCESS_KEY")
    aws_secret_key: str = os.getenv("AWS_SECRET_KEY")
    aws_region: str = os.getenv("AWS_REGION", "ap-south-1")
    resumes_prefix: str = "resume/"
    jd_prefix: str = "jd/"
    embedding_model_name: str = "sentence-transformers/all-MiniLM-L6-v2"
    llm_model: str = "qwen/qwen3-14b:free"

settings = Settings()
print(f"✅ [INIT] Settings loaded for bucket: {settings.s3_bucket}")

# Configure OpenRouter
if os.getenv("OPENROUTER_API_KEY"):
    os.environ["OPENAI_API_BASE"] = "https://openrouter.ai/api/v1"
    os.environ["OPENAI_API_KEY"] = os.getenv("OPENROUTER_API_KEY")
    print("✅ [INIT] Configured to use OpenRouter.")

# Create FastAPI app
app = FastAPI(
    title="RecurAI Resume Screening API",
    description="AI-powered resume screening and job matching platform",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI models
print("⏳ [INIT] Loading embedding model...")
embedding_model = HuggingFaceEmbeddings(model_name=settings.embedding_model_name)
print(f"✅ [INIT] Embedding model loaded: {settings.embedding_model_name}")

splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
llm = ChatOpenAI(model=settings.llm_model, temperature=0.2)
print(f"✅ [INIT] LLM model configured: {settings.llm_model}")

# Enhanced prompt for better analysis
prompt = PromptTemplate(
    input_variables=["jd", "resume_summary"],
    template="""
You are an expert technical recruiter AI assistant. Evaluate the candidate's resume against the job description with precision and fairness.

Job Description:
{jd}

Candidate Summary:
{resume_summary}

Provide a comprehensive evaluation across these dimensions:

1. **Skill Match (0-100)**: How well do the candidate's technical skills align with job requirements?
2. **Project Relevance (0-100)**: How relevant are their past projects to the role?
3. **Problem Solving (0-100)**: Evidence of analytical thinking and problem-solving abilities
4. **Tools & Technologies (0-100)**: Proficiency with required tools and technologies
5. **Overall Fit (0-100)**: Comprehensive assessment considering all factors

Return ONLY a valid JSON object in this exact format:
{{
  "Skill Match": <score>,
  "Project Relevance": <score>,
  "Problem Solving": <score>,
  "Tools": <score>,
  "Overall Fit": <score>,
  "Summary": "<4-5 line detailed justification with specific examples>"
}}

Be precise with scoring and provide constructive feedback.
"""
)
chain = prompt | llm | StrOutputParser()

# In-memory job store for FAISS vector stores
JOB_STORE: Dict[str, FAISS] = {}
print("✅ [INIT] In-memory job store initialized.")

# Create database tables
create_tables()
print("✅ [INIT] Database tables created.")

# Pydantic models
class JobPostingCreate(BaseModel):
    title: str
    description: str
    requirements: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    employment_type: Optional[str] = None
    experience_level: Optional[str] = None

class ResumeUpload(BaseModel):
    job_posting_id: str
    candidate_name: str
    candidate_email: Optional[str] = None
    candidate_phone: Optional[str] = None

class AnalysisRequest(BaseModel):
    job_posting_id: str
    session_name: Optional[str] = None
    top_k: int = Field(5, gt=0, le=50, description="Number of top candidates to return")

class UserCreate(BaseModel):
    clerk_id: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company_name: Optional[str] = None

# Helper functions
async def get_s3_client():
    async with aioboto3.Session().client(
            "s3",
            aws_access_key_id=settings.aws_access_key,
            aws_secret_access_key=settings.aws_secret_key,
            region_name=settings.aws_region
    ) as s3_client:
        yield s3_client

def read_file_content(file_bytes: bytes, filename: str) -> str:
    ext = filename.split(".")[-1].lower()
    print(f"      [HELPER] Reading file '{filename}' with extension '{ext}'")
    if ext == "pdf":
        with pdfplumber.open(BytesIO(file_bytes)) as pdf:
            return "\n".join([page.extract_text() or "" for page in pdf.pages])
    elif ext == "docx":
        doc = DocxDocument(BytesIO(file_bytes))
        return "\n".join([para.text for para in doc.paragraphs])
    elif ext == "txt":
        return file_bytes.decode("utf-8", errors="ignore")
    else:
        raise ValueError(f"Unsupported file type: {ext}")

def extract_contact_info(text: str):
    email = re.findall(r"[\w\.\-]+@[\w\.\-]+", text)
    phone = re.findall(r"\+?\d[\d\s\-]{8,13}\d", text)
    return email[0] if email else "", phone[0] if phone else ""

# API Routes

@app.get("/")
def read_root():
    return {
        "status": "ok", 
        "message": "RecurAI Resume Screening API v2.0",
        "version": "2.0.0",
        "features": [
            "PostgreSQL Integration",
            "Enhanced Resume Analysis",
            "User Management",
            "Job Posting Management",
            "Advanced Scoring System"
        ]
    }

@app.post("/users/", response_model=dict)
def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Create a new user"""
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.clerk_id == user_data.clerk_id).first()
        if existing_user:
            return {"message": "User already exists", "user_id": str(existing_user.id)}
        
        # Create new user
        db_user = User(
            clerk_id=user_data.clerk_id,
            email=user_data.email,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            company_name=user_data.company_name
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return {"message": "User created successfully", "user_id": str(db_user.id)}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")

@app.post("/job-postings/", response_model=dict)
def create_job_posting(
    job_data: JobPostingCreate, 
    clerk_id: str,
    db: Session = Depends(get_db)
):
    """Create a new job posting"""
    try:
        # Get user
        user = db.query(User).filter(User.clerk_id == clerk_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Create job posting
        db_job = JobPosting(
            user_id=user.id,
            title=job_data.title,
            description=job_data.description,
            requirements=job_data.requirements,
            location=job_data.location,
            salary_range=job_data.salary_range,
            employment_type=job_data.employment_type,
            experience_level=job_data.experience_level
        )
        db.add(db_job)
        db.commit()
        db.refresh(db_job)
        
        return {"message": "Job posting created successfully", "job_id": str(db_job.id)}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating job posting: {str(e)}")

@app.post("/upload-jd/")
async def upload_jd(
    file: UploadFile = File(...),
    job_posting_id: str = None,
    s3_client=Depends(get_s3_client)
):
    """Upload job description file"""
    try:
        # Upload to S3
        file_key = f"{settings.jd_prefix}{uuid.uuid4()}-{file.filename}"
        await s3_client.upload_fileobj(file.file, settings.s3_bucket, file_key)
        
        # Update job posting with S3 key if provided
        if job_posting_id:
            # This would require a database update - implement as needed
            pass
        
        return {
            "message": "JD uploaded successfully", 
            "file_key": file_key,
            "filename": file.filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading JD: {str(e)}")

@app.post("/upload-resumes/")
async def upload_resumes(
    files: List[UploadFile] = File(...),
    job_posting_id: str = None,
    clerk_id: str = None,
    s3_client=Depends(get_s3_client),
    db: Session = Depends(get_db)
):
    """Upload multiple resume files"""
    try:
        # Get user and job posting
        user = db.query(User).filter(User.clerk_id == clerk_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        job_posting = db.query(JobPosting).filter(JobPosting.id == job_posting_id).first()
        if not job_posting:
            raise HTTPException(status_code=404, detail="Job posting not found")
        
        uploaded_files = []
        
        for file in files:
            # Upload to S3
            file_key = f"{settings.resumes_prefix}{uuid.uuid4()}-{file.filename}"
            await s3_client.upload_fileobj(file.file, settings.s3_bucket, file_key)
            
            # Extract basic info from file
            file_bytes = await file.read()
            try:
                text_content = read_file_content(file_bytes, file.filename)
                name, email, phone = extract_contact_info(text_content)
                
                # Create resume record
                db_resume = Resume(
                    user_id=user.id,
                    job_posting_id=job_posting.id,
                    candidate_name=name or "Unknown Candidate",
                    candidate_email=email,
                    candidate_phone=phone,
                    s3_resume_key=file_key,
                    file_name=file.filename,
                    file_size=len(file_bytes),
                    file_type=file.content_type
                )
                db.add(db_resume)
                uploaded_files.append({
                    "filename": file.filename,
                    "resume_id": str(db_resume.id),
                    "candidate_name": name or "Unknown Candidate"
                })
            except Exception as e:
                print(f"Error processing {file.filename}: {e}")
                continue
        
        db.commit()
        
        return {
            "message": f"Successfully uploaded {len(uploaded_files)} resumes",
            "files": uploaded_files
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error uploading resumes: {str(e)}")

@app.post("/analyze/{job_posting_id}")
async def analyze_resumes(
    job_posting_id: str,
    request: AnalysisRequest,
    clerk_id: str,
    s3_client=Depends(get_s3_client),
    db: Session = Depends(get_db)
):
    """Analyze resumes against job description"""
    try:
        # Get user and job posting
        user = db.query(User).filter(User.clerk_id == clerk_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        job_posting = db.query(JobPosting).filter(JobPosting.id == job_posting_id).first()
        if not job_posting:
            raise HTTPException(status_code=404, detail="Job posting not found")
        
        # Create analysis session
        session = AnalysisSession(
            user_id=user.id,
            job_posting_id=job_posting.id,
            session_name=request.session_name or f"Analysis {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            status="processing"
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        
        # Get resumes for this job posting
        resumes = db.query(Resume).filter(Resume.job_posting_id == job_posting_id).all()
        if not resumes:
            raise HTTPException(status_code=404, detail="No resumes found for this job posting")
        
        # Process resumes and create embeddings
        all_chunks = []
        for resume in resumes:
            try:
                # Download resume from S3
                response = await s3_client.get_object(Bucket=settings.s3_bucket, Key=resume.s3_resume_key)
                file_bytes = await response["Body"].read()
                full_text = read_file_content(file_bytes, resume.file_name)
                
                # Create chunks
                chunks = splitter.create_documents([full_text])
                for chunk in chunks:
                    chunk.metadata = {
                        "resume_id": str(resume.id),
                        "candidate_name": resume.candidate_name,
                        "candidate_email": resume.candidate_email,
                        "candidate_phone": resume.candidate_phone
                    }
                all_chunks.extend(chunks)
            except Exception as e:
                print(f"Error processing resume {resume.id}: {e}")
                continue
        
        if not all_chunks:
            raise HTTPException(status_code=500, detail="No resume content could be processed")
        
        # Create FAISS vector store
        vectorstore = await asyncio.to_thread(FAISS.from_documents, all_chunks, embedding_model)
        job_id = str(uuid.uuid4())
        JOB_STORE[job_id] = vectorstore
        
        # Get job description
        jd_text = job_posting.description
        if job_posting.requirements:
            jd_text += f"\n\nRequirements:\n{job_posting.requirements}"
        
        # Perform similarity search
        k_to_fetch = request.top_k * 5
        results = await asyncio.to_thread(
            vectorstore.similarity_search_with_score,
            jd_text, k=k_to_fetch
        )
        
        # Group results by resume
        grouped_by_resume = defaultdict(list)
        for doc, score in results:
            grouped_by_resume[doc.metadata["resume_id"]].append((doc, score))
        
        # Get top resumes
        top_resumes = sorted(
            [(rid, min(s for _, s in chunks), chunks) for rid, chunks in grouped_by_resume.items()],
            key=lambda x: x[1]
        )[:request.top_k]
        
        # Analyze each resume
        async def get_evaluation(jd, summary, resume_id):
            try:
                response_content = await chain.ainvoke({"jd": jd, "resume_summary": summary})
                return json.loads(response_content)
            except Exception as e:
                print(f"LLM evaluation failed for {resume_id}: {e}")
                return {
                    "Skill Match": 0,
                    "Project Relevance": 0,
                    "Problem Solving": 0,
                    "Tools": 0,
                    "Overall Fit": 0,
                    "Summary": f"Error in analysis: {str(e)}"
                }
        
        tasks = []
        for resume_id, _, chunks in top_resumes:
            top_chunks = sorted(chunks, key=lambda x: x[1])[:5]
            summary_text = "\n---\n".join(doc.page_content.strip() for doc, _ in top_chunks)
            tasks.append(get_evaluation(jd_text, summary_text, resume_id))
        
        evaluations = await asyncio.gather(*tasks)
        
        # Save analysis results
        final_output = []
        for i, (resume_id, _, chunks) in enumerate(top_resumes):
            resume = db.query(Resume).filter(Resume.id == resume_id).first()
            if not resume:
                continue
            
            evaluation = evaluations[i]
            
            # Save to database
            analysis = ResumeAnalysis(
                analysis_session_id=session.id,
                resume_id=resume.id,
                overall_fit_score=float(evaluation["Overall Fit"]),
                skill_match_score=float(evaluation["Skill Match"]),
                project_relevance_score=float(evaluation["Project Relevance"]),
                problem_solving_score=float(evaluation["Problem Solving"]),
                tools_score=float(evaluation["Tools"]),
                summary=evaluation["Summary"],
                ranking_position=i + 1
            )
            db.add(analysis)
            
            final_output.append({
                "name": resume.candidate_name,
                "email": resume.candidate_email,
                "phone": resume.candidate_phone,
                "resume_id": str(resume.id),
                "evaluation": evaluation
            })
        
        # Update session status
        session.status = "completed"
        session.completed_at = datetime.now()
        session.total_resumes = len(resumes)
        session.processed_resumes = len(final_output)
        session.faiss_job_id = job_id
        
        db.commit()
        
        return {
            "session_id": str(session.id),
            "message": f"Analysis completed successfully",
            "results": final_output
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error analyzing resumes: {str(e)}")

@app.get("/analysis-sessions/{session_id}")
def get_analysis_session(session_id: str, db: Session = Depends(get_db)):
    """Get analysis session results"""
    try:
        session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Analysis session not found")
        
        # Get analysis results
        analyses = db.query(ResumeAnalysis).filter(
            ResumeAnalysis.analysis_session_id == session.id
        ).order_by(ResumeAnalysis.overall_fit_score.desc()).all()
        
        results = []
        for analysis in analyses:
            resume = db.query(Resume).filter(Resume.id == analysis.resume_id).first()
            if resume:
                results.append({
                    "name": resume.candidate_name,
                    "email": resume.candidate_email,
                    "phone": resume.candidate_phone,
                    "resume_id": str(resume.id),
                    "evaluation": {
                        "Overall Fit": float(analysis.overall_fit_score),
                        "Skill Match": float(analysis.skill_match_score),
                        "Project Relevance": float(analysis.project_relevance_score),
                        "Problem Solving": float(analysis.problem_solving_score),
                        "Tools": float(analysis.tools_score),
                        "Summary": analysis.summary
                    }
                })
        
        return {
            "session": {
                "id": str(session.id),
                "name": session.session_name,
                "status": session.status,
                "total_resumes": session.total_resumes,
                "processed_resumes": session.processed_resumes,
                "created_at": session.created_at,
                "completed_at": session.completed_at
            },
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving analysis session: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

