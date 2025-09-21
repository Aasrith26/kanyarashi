# RecurAI Resume Parser - Comprehensive Technical Documentation

## Table of Contents

### Part I: System Architecture & Core Components (Pages 1-15)
1. [Executive Summary](#executive-summary)
2. [System Architecture Overview](#system-architecture-overview)
3. [Technology Stack](#technology-stack)
4. [Database Design](#database-design)
5. [API Architecture](#api-architecture)

### Part II: AI/ML Implementation & Features (Pages 16-30)
6. [AI/ML Pipeline](#aiml-pipeline)
7. [Resume Analysis Engine](#resume-analysis-engine)
8. [Feedback Generation System](#feedback-generation-system)
9. [Email Service Integration](#email-service-integration)
10. [Performance & Optimization](#performance--optimization)

### Part III: Frontend, Deployment & Operations (Pages 31-45)
11. [Frontend Architecture](#frontend-architecture)
12. [User Interface Components](#user-interface-components)
13. [Authentication & Security](#authentication--security)
14. [Deployment & Infrastructure](#deployment--infrastructure)
15. [Known Issues & Blind Spots](#known-issues--blind-spots)

---

## Executive Summary

**RecurAI Resume Parser** is a comprehensive AI-powered recruitment platform that automates resume screening, candidate evaluation, and feedback generation. The system combines advanced machine learning models with a modern web application to provide recruiters with intelligent candidate assessment tools.

### Key Features
- **AI-Powered Resume Analysis**: Automated extraction and scoring of candidate qualifications
- **Job Description Matching**: Semantic analysis to match candidates with job requirements
- **Automated Feedback Generation**: LLM-generated personalized feedback for candidates
- **Email Integration**: Automated email delivery of feedback to candidates
- **Multi-tenant Architecture**: Support for multiple recruiters and organizations
- **Cloud Storage**: Scalable file storage with AWS S3 integration

### Business Value
- **Time Savings**: Reduces manual resume screening time by 80%
- **Consistency**: Standardized evaluation criteria across all candidates
- **Scalability**: Handles large volumes of applications efficiently
- **Candidate Experience**: Provides constructive feedback to improve candidate engagement

---

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   AI/ML Engine  │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│   (LangChain)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Clerk Auth    │    │   PostgreSQL    │    │   OpenRouter    │
│   (Auth)        │    │   Database      │    │   (LLM API)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   AWS S3        │
                       │   (File Storage)│
                       └─────────────────┘
```

### Component Interaction Flow

1. **User Authentication**: Clerk handles user authentication and session management
2. **File Upload**: Resumes and job descriptions uploaded to S3 via FastAPI
3. **AI Processing**: LangChain processes documents through embedding and LLM models
4. **Analysis Storage**: Results stored in PostgreSQL database
5. **Feedback Generation**: LLM generates personalized feedback for candidates
6. **Email Delivery**: Automated email sending via SMTP services

---

## Technology Stack

### Backend Technologies

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Web Framework** | FastAPI | 0.115.0+ | REST API development |
| **ASGI Server** | Uvicorn | 0.32.0+ | Production server |
| **Database** | PostgreSQL | Latest | Primary data storage |
| **Database Driver** | psycopg2-binary | 2.9.0+ | PostgreSQL connectivity |
| **File Storage** | AWS S3 | Latest | Document storage |
| **AI Framework** | LangChain | 0.3.0+ | LLM orchestration |
| **Embeddings** | Sentence Transformers | 2.6.0+ | Text vectorization |
| **Vector Store** | FAISS | 1.9.0+ | Similarity search |
| **LLM Provider** | OpenRouter | Latest | Model access |
| **Email Service** | SMTP | - | Email delivery |

### Frontend Technologies

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Framework** | Next.js | 15.4.2 | React framework |
| **Language** | TypeScript | 5.x | Type safety |
| **Styling** | Tailwind CSS | 3.4.17 | Utility-first CSS |
| **UI Components** | Radix UI | Latest | Accessible components |
| **Authentication** | Clerk | 6.27.1 | User management |
| **HTTP Client** | Axios | 1.11.0 | API communication |
| **File Upload** | React Dropzone | 14.3.8 | Drag-and-drop uploads |

### AI/ML Dependencies

| Library | Version | Purpose |
|---------|---------|---------|
| **openai** | 1.6.1+ | OpenAI API client |
| **langchain-openai** | 0.2.0+ | OpenAI integration |
| **langchain-huggingface** | 0.1.0+ | HuggingFace models |
| **sentence-transformers** | 2.6.0+ | Text embeddings |
| **faiss-cpu** | 1.9.0+ | Vector similarity search |
| **numpy** | 1.26.0+ | Numerical computing |
| **pandas** | 2.2.0+ | Data manipulation |
| **scikit-learn** | 1.4.0+ | Machine learning utilities |

### File Processing Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| **PyPDF2** | 3.0.0+ | PDF text extraction |
| **pypdf** | 5.0.0+ | Modern PDF processing |
| **pdfplumber** | 0.11.0+ | Advanced PDF parsing |
| **python-docx** | 1.1.0+ | Word document processing |

---

## Database Design

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'recruiter',
    company_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Job Postings Table
```sql
CREATE TABLE job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    location VARCHAR(255),
    salary_range VARCHAR(100),
    employment_type VARCHAR(50),
    experience_level VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    s3_jd_key VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Resumes Table
```sql
CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    job_posting_id UUID REFERENCES job_postings(id) ON DELETE CASCADE,
    candidate_name VARCHAR(255) NOT NULL,
    candidate_email VARCHAR(255),
    candidate_phone VARCHAR(50),
    s3_resume_key VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'uploaded',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Analysis Sessions Table
```sql
CREATE TABLE analysis_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_name VARCHAR(255) NOT NULL,
    job_posting_id UUID REFERENCES job_postings(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Resume Analyses Table
```sql
CREATE TABLE resume_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
    analysis_session_id UUID REFERENCES analysis_sessions(id) ON DELETE CASCADE,
    overall_fit_score DECIMAL(3,2),
    skill_match_score DECIMAL(3,2),
    project_relevance_score DECIMAL(3,2),
    problem_solving_score DECIMAL(3,2),
    tools_score DECIMAL(3,2),
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Feedback Emails Table
```sql
CREATE TABLE feedback_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
    analysis_session_id UUID REFERENCES analysis_sessions(id) ON DELETE CASCADE,
    recruiter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    candidate_email VARCHAR(255) NOT NULL,
    candidate_name VARCHAR(255) NOT NULL,
    feedback_content TEXT NOT NULL,
    email_subject VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    email_provider_message_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Database Relationships

```
users (1) ──→ (N) job_postings
users (1) ──→ (N) resumes
users (1) ──→ (N) analysis_sessions
users (1) ──→ (N) feedback_emails

job_postings (1) ──→ (N) resumes
job_postings (1) ──→ (N) analysis_sessions

analysis_sessions (1) ──→ (N) resume_analyses
analysis_sessions (1) ──→ (N) feedback_emails

resumes (1) ──→ (N) resume_analyses
resumes (1) ──→ (N) feedback_emails
```

### Indexes and Performance

```sql
-- Performance indexes
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_job_posting_id ON resumes(job_posting_id);
CREATE INDEX idx_analysis_sessions_user_id ON analysis_sessions(user_id);
CREATE INDEX idx_resume_analyses_resume_id ON resume_analyses(resume_id);
CREATE INDEX idx_resume_analyses_session_id ON resume_analyses(analysis_session_id);
CREATE INDEX idx_feedback_emails_candidate_email ON feedback_emails(candidate_email);
CREATE INDEX idx_feedback_emails_status ON feedback_emails(status);

-- Composite indexes for common queries
CREATE INDEX idx_resumes_user_job ON resumes(user_id, job_posting_id);
CREATE INDEX idx_analyses_resume_session ON resume_analyses(resume_id, analysis_session_id);
```

---

## API Architecture

### Core API Endpoints

#### Authentication & User Management
- `GET /` - API health check
- `GET /health` - Detailed health status
- `POST /users/` - Create user profile

#### Job Posting Management
- `POST /job-postings/` - Create new job posting
- `GET /job-postings/?clerk_id={id}` - Get user's job postings
- `GET /job-postings/{id}` - Get specific job posting
- `PUT /job-postings/{id}` - Update job posting
- `DELETE /job-postings/{id}` - Delete job posting

#### Resume Management
- `POST /resumes/upload` - Upload resume file
- `GET /resumes/s3/?clerk_id={id}` - Get user's resumes
- `GET /resumes/{id}` - Get specific resume
- `DELETE /resumes/{id}` - Delete resume

#### Analysis & Processing
- `POST /analysis-sessions/` - Create analysis session
- `GET /analysis-sessions/?clerk_id={id}` - Get user's sessions
- `GET /analysis-sessions/{id}` - Get session results
- `POST /resumes/analyze` - Trigger resume analysis

#### Feedback System
- `POST /feedback/generate/{resume_id}` - Generate feedback preview
- `POST /feedback/send` - Send feedback email
- `POST /feedback/send-bulk` - Send bulk feedback emails
- `GET /feedback/history` - Get feedback history

### API Request/Response Patterns

#### Standard Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": { ... }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Authentication Flow

1. **Frontend**: User authenticates via Clerk
2. **API Calls**: Frontend includes `clerk_id` in requests
3. **Backend**: Validates user exists, creates if needed
4. **Authorization**: All operations scoped to user's data

### CORS Configuration

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://kanyarashi.vercel.app",
        "https://*.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

*[Continue to Part II: AI/ML Implementation & Features]*
