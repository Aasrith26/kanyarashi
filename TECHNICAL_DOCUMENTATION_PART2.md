# RecurAI Resume Parser - Part II: AI/ML Implementation & Features

## AI/ML Pipeline

### Overview
The AI/ML pipeline processes resumes through multiple stages to extract information, generate embeddings, and provide intelligent analysis.

### Pipeline Stages

#### 1. Document Processing
```python
class ResumeAnalyzer:
    def extract_resume_text(self, file_content: bytes, file_type: str) -> str:
        """Extract text from various document formats"""
        if file_type == "application/pdf":
            return self._extract_from_pdf(file_content)
        elif file_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            return self._extract_from_docx(file_content)
        else:
            return "Unsupported file type"
```

#### 2. Information Extraction
```python
def extract_contact_info(text: str):
    """Extract email and phone using precise regex patterns"""
    email = re.findall(r"\b[\w\.\-]+@[\w\.\-]+\.[a-zA-Z]{2,}\b", text)
    phone = re.findall(r"\+?\d[\d\s\-]{8,13}\d", text)
    return email[0] if email else "", phone[0] if phone else ""

def extract_candidate_name_from_resume(self, resume_text: str) -> str:
    """Extract candidate name using NLP techniques"""
    # Implementation uses pattern matching and NLP
```

#### 3. Text Chunking and Embedding
```python
self.text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)

# Generate embeddings using HuggingFace
embedding_model = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",
    model_kwargs={'device': 'cpu'},
    encode_kwargs={'normalize_embeddings': False}
)
```

#### 4. Vector Storage and Retrieval
```python
# Store embeddings in FAISS vector store
vector_store = FAISS.from_texts(chunks, embedding_model)

# Similarity search for relevant content
results = vector_store.similarity_search_with_score(query, k=5)
```

### AI Model Configuration

#### LLM Models Used
| Model | Provider | Purpose | Rate Limits |
|-------|----------|---------|-------------|
| `qwen/qwen3-14b:free` | OpenRouter | Resume Analysis | 50 requests/day |
| `gpt-3.5-turbo` | OpenRouter | Feedback Generation | Higher limits |
| `sentence-transformers/all-MiniLM-L6-v2` | HuggingFace | Text Embeddings | Local processing |

#### Model Initialization
```python
# Resume Analysis LLM
llm = ChatOpenAI(
    model="qwen/qwen3-14b:free",
    temperature=0.3,
    max_tokens=2000,
    timeout=60
)

# Feedback Generation LLM
feedback_llm = ChatOpenAI(
    model="gpt-3.5-turbo",
    temperature=0.7,
    max_tokens=1000
)
```

---

## Resume Analysis Engine

### Analysis Framework

#### Prompt Template for Resume Analysis
```python
template = """
You are a technical recruiter AI assistant. Evaluate the candidate's resume against the job description.
When summarizing candidate, provide a comprehensive 5-6 sentence analysis that covers their strengths, relevant experience, technical skills, and overall fit for the role. Be specific and detailed in your assessment.

Job Description: {jd}
Candidate Summary: {resume_summary}

Return a single, valid JSON object with no commentary or explanations. The format must be exactly:
{{
  "Skill Match": <score out of 100>,
  "Project Relevance": <score out of 100>,
  "Problem Solving": <score out of 100>,
  "Tools": <score out of 100>,
  "Overall Fit": <score out of 100>,
  "Summary": "<5-6 sentence comprehensive analysis covering: 1) Technical skills alignment, 2) Relevant experience, 3) Project relevance, 4) Problem-solving abilities, 5) Tools proficiency, 6) Overall fit assessment>"
}}
"""
```

### Scoring Methodology

#### Evaluation Criteria
1. **Skill Match (0-100)**: Alignment between candidate skills and job requirements
2. **Project Relevance (0-100)**: Relevance of candidate's project experience
3. **Problem Solving (0-100)**: Demonstrated problem-solving abilities
4. **Tools & Technology (0-100)**: Proficiency with required tools/technologies
5. **Overall Fit (0-100)**: Comprehensive assessment of candidate suitability

#### Analysis Process
```python
async def analyze_resume_with_ai(self, resume_text: str, job_description: str) -> Dict:
    """Analyze resume using AI with comprehensive evaluation"""
    try:
        response = await asyncio.to_thread(
            self.chain.invoke,
            {"jd": job_description, "resume_summary": resume_text}
        )
        
        result = json.loads(response)
        
        # Ensure all required fields exist
        required_fields = ["Overall Fit", "Skill Match", "Project Relevance", "Problem Solving", "Tools", "Summary"]
        for field in required_fields:
            if field not in result:
                result[field] = 70 if field != "Summary" else "Analysis completed"
        
        return result
        
    except Exception as e:
        return self._get_fallback_analysis()
```

### Batch Processing

#### Concurrent Analysis
```python
async def get_evaluation(jd, summary, resume_id):
    """Process individual resume analysis"""
    try:
        response_content = await chain.ainvoke({"jd": jd, "resume_summary": summary})
        return json.loads(response_content)
    except Exception as e:
        return {"Error": f"Failed to get or parse LLM evaluation: {str(e)}"}

# Process multiple resumes concurrently
tasks = []
for resume_id, _, chunks in top_resumes:
    top_chunks = sorted(chunks, key=lambda x: x[1])[:5]
    summary_text = "\n---\n".join(doc.page_content.strip() for doc, _ in top_chunks)
    tasks.append(get_evaluation(jd_text, summary_text, resume_id))

evaluations = await asyncio.gather(*tasks)
```

---

## Feedback Generation System

### Architecture Overview

The feedback generation system creates personalized, constructive feedback for candidates using advanced LLM capabilities.

#### Core Components
```python
class FeedbackGenerator:
    def __init__(self, llm_model: str = "gpt-3.5-turbo"):
        self.llm = ChatOpenAI(
            model=llm_model,
            temperature=0.7,
            max_tokens=1000
        )
        self.prompt_template = self._create_prompt_template()
        self.chain = self.prompt_template | self.llm | StrOutputParser()
```

### Feedback Generation Process

#### 1. Data Collection
```python
class FeedbackRequest(BaseModel):
    candidate_name: str
    resume_content: str
    analysis_results: Dict
    job_description: str
    job_title: Optional[str] = None
    company_name: str = "Innomatics Research Lab"
```

#### 2. Prompt Engineering
```python
template = """
You are a senior technical mentor and career advisor from Innomatics Research Lab, a leading research and development organization. Your role is to provide constructive, encouraging, and professional feedback to candidates who have applied for positions.

Your feedback should be:
1. **Constructive and Specific**: Point out specific areas for improvement with actionable advice
2. **Encouraging**: Maintain a positive, supportive tone that motivates the candidate
3. **Professional**: Use formal but warm language appropriate for a research lab
4. **Educational**: Help the candidate understand industry expectations and best practices
5. **Personalized**: Reference specific aspects of their resume and analysis

**Candidate Information:**
- Name: {candidate_name}
- Company: {company_name}
- Job Title: {job_title}

**Resume Analysis Results:**
- Overall Fit Score: {overall_fit}/100
- Skill Match Score: {skill_match}/100
- Project Relevance Score: {project_relevance}/100
- Problem Solving Score: {problem_solving}/100
- Tools & Technology Score: {tools_score}/100
- AI Summary: {ai_summary}

**Job Description:**
{job_description}

**Resume Content (Key Sections):**
{resume_content}

**Instructions:**
Generate a comprehensive feedback email that:

1. **Acknowledges their application** and thanks them for their interest
2. **Highlights their strengths** based on the analysis
3. **Provides specific improvement suggestions** in 3-4 key areas:
   - Technical skills development
   - Project experience enhancement
   - Resume presentation and formatting
   - Industry knowledge and trends
4. **Offers encouragement** and next steps for career development
5. **Maintains professional tone** from Innomatics Research Lab

**Format your response as:**
FEEDBACK:
[Your detailed feedback content here - 4-6 paragraphs]

SUBJECT:
[Suggested email subject line]

TONE:
[constructive/encouraging/professional]

KEY_AREAS:
[Comma-separated list of 3-4 key improvement areas]

Remember: Be specific, actionable, and encouraging. Help them grow professionally while maintaining the prestige and professionalism of Innomatics Research Lab.
"""
```

#### 3. Response Processing
```python
def _parse_response(self, response: str) -> FeedbackResponse:
    """Parse the LLM response into structured format"""
    lines = response.strip().split('\n')
    feedback_content = ""
    subject_suggestion = ""
    tone = "constructive"
    key_areas = []
    
    current_section = None
    
    for line in lines:
        line = line.strip()
        
        if line.startswith("FEEDBACK:"):
            current_section = "feedback"
            feedback_content = line.replace("FEEDBACK:", "").strip()
        elif line.startswith("SUBJECT:"):
            current_section = "subject"
            subject_suggestion = line.replace("SUBJECT:", "").strip()
        elif line.startswith("TONE:"):
            current_section = "tone"
            tone = line.replace("TONE:", "").strip().lower()
        elif line.startswith("KEY_AREAS:"):
            current_section = "key_areas"
            areas_str = line.replace("KEY_AREAS:", "").strip()
            key_areas = [area.strip() for area in areas_str.split(',') if area.strip()]
        elif current_section == "feedback" and line:
            feedback_content += "\n" + line
        elif current_section == "subject" and line:
            subject_suggestion += " " + line
    
    return FeedbackResponse(
        feedback_content=feedback_content.strip(),
        subject_suggestion=subject_suggestion.strip(),
        tone=tone,
        key_areas=key_areas
    )
```

### Fallback Mechanisms

#### Error Handling
```python
def _generate_fallback_feedback(self, request: FeedbackRequest) -> FeedbackResponse:
    """Generate fallback feedback when LLM fails"""
    analysis = request.analysis_results
    overall_fit = analysis.get("Overall Fit", 70)
    
    if overall_fit >= 80:
        # High-performing candidate feedback
        feedback_content = f"""
Dear {request.candidate_name},

Thank you for your application to Innomatics Research Lab. We were impressed by your qualifications and the effort you put into your application.

Your resume demonstrates strong technical skills and relevant experience. We particularly noted your attention to detail and the comprehensive nature of your project descriptions.

To further strengthen your candidacy for future opportunities, we recommend:

1. **Technical Skills Enhancement**: Consider expanding your knowledge in emerging technologies and industry best practices. Online courses and certifications can be valuable additions.

2. **Project Documentation**: While your projects are well-described, consider adding more quantitative results and impact metrics to demonstrate the value you've delivered.

3. **Industry Engagement**: Stay updated with the latest trends in your field through professional networks, conferences, and industry publications.

4. **Continuous Learning**: The technology landscape evolves rapidly. Consider setting up a learning plan to stay current with new tools and methodologies.

We encourage you to continue developing your skills and exploring opportunities in the technology sector. Your dedication to professional growth is commendable.

Best regards,
Innomatics Research Lab Team
        """
    # Additional fallback templates for different score ranges...
```

---

## Email Service Integration

### Email Service Architecture

#### Multi-Provider Support
```python
class EmailConfig(BaseModel):
    provider: str  # gmail, outlook, yahoo, custom_smtp
    smtp_server: str
    smtp_port: int
    smtp_username: str
    smtp_password: str
    from_email: str
    from_name: str
    reply_to_email: Optional[str] = None
    use_tls: bool = True
    use_ssl: bool = False

class EmailService:
    def __init__(self, config: EmailConfig):
        self.config = config
        self._setup_smtp_config()
```

#### Provider-Specific Configuration
```python
def _setup_smtp_config(self):
    """Configure SMTP settings based on provider"""
    if self.config.provider == "gmail":
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587
        self.use_tls = True
    elif self.config.provider == "outlook":
        self.smtp_server = "smtp-mail.outlook.com"
        self.smtp_port = 587
        self.use_tls = True
    elif self.config.provider == "yahoo":
        self.smtp_server = "smtp.mail.yahoo.com"
        self.smtp_port = 587
        self.use_tls = True
    else:  # custom_smtp
        self.smtp_server = self.config.smtp_server
        self.smtp_port = self.config.smtp_port
        self.use_tls = self.config.use_tls
```

### Email Sending Process

#### SMTP Implementation
```python
async def _send_via_smtp(self, to_email: str, subject: str, html_content: str) -> EmailResult:
    """Send email via SMTP"""
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{self.config.from_name} <{self.config.from_email}>"
        msg['To'] = to_email
        
        if self.config.reply_to_email:
            msg['Reply-To'] = self.config.reply_to_email
        
        # Create HTML part
        html_part = MIMEText(html_content, 'html', 'utf-8')
        msg.attach(html_part)
        
        # Send email
        with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
            if self.use_tls:
                server.starttls()
            server.login(self.config.smtp_username, self.config.smtp_password)
            server.send_message(msg)
        
        return EmailResult(
            success=True,
            message_id=f"smtp_{int(time.time())}",
            delivered_at=datetime.now()
        )
        
    except Exception as e:
        return EmailResult(
            success=False,
            error_message=str(e)
        )
```

#### Email Templates
```python
def _create_feedback_email_template(self, candidate_name: str, feedback_content: str, job_title: str) -> str:
    """Create HTML email template for feedback"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Feedback from Innomatics Research Lab</title>
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }}
            .container {{
                background-color: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }}
            .header {{
                text-align: center;
                border-bottom: 2px solid #4a90e2;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }}
            .logo {{
                font-size: 24px;
                font-weight: bold;
                color: #4a90e2;
            }}
            .content {{
                margin-bottom: 30px;
            }}
            .footer {{
                text-align: center;
                font-size: 12px;
                color: #666;
                border-top: 1px solid #eee;
                padding-top: 20px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">Innomatics Research Lab</div>
            </div>
            <div class="content">
                {feedback_content}
            </div>
            <div class="footer">
                <p>This email was sent from Innomatics Research Lab's automated feedback system.</p>
                <p>If you have any questions, please contact us at support@innomatics.com</p>
            </div>
        </div>
    </body>
    </html>
    """
```

### Email Tracking and Analytics

#### Database Integration
```python
async def send_feedback_email_async(
    candidate_name: str,
    candidate_email: str,
    feedback_content: str,
    job_title: str,
    custom_subject: Optional[str] = None
) -> EmailResult:
    """Send feedback email and track in database"""
    
    # Generate email content
    subject = custom_subject or f"Feedback on Your Application - {job_title}"
    html_content = email_service._create_feedback_email_template(
        candidate_name, feedback_content, job_title
    )
    
    # Send email
    result = await email_service.send_email(
        to_email=candidate_email,
        subject=subject,
        html_content=html_content
    )
    
    # Store in database for tracking
    if result.success:
        # Update feedback_emails table with delivery status
        pass
    
    return result
```

---

## Performance & Optimization

### Caching Strategies

#### Model Caching
```python
# Global model instances (loaded once)
ai_model = None
embedding_model = None
llm = None
resume_analyzer = None

if AI_AVAILABLE:
    try:
        # Initialize models once at startup
        embedding_model = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': False}
        )
        
        llm = ChatOpenAI(
            model="qwen/qwen3-14b:free",
            temperature=0.3,
            max_tokens=2000,
            timeout=60
        )
        
        resume_analyzer = ResumeAnalyzer()
        
    except Exception as e:
        AI_AVAILABLE = False
```

#### Database Connection Pooling
```python
def get_db_connection():
    """Get database connection with error handling"""
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            database=os.getenv("DB_NAME", "recur_ai_db"),
            user=os.getenv("DB_USER", "recur_ai_app"),
            password=os.getenv("DB_PASSWORD", "app_password_123"),
            port=os.getenv("DB_PORT", "5432")
        )
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None
```

### Rate Limiting and Error Handling

#### LLM Rate Limit Management
```python
# Different models have different rate limits
RATE_LIMITS = {
    "qwen/qwen3-14b:free": 50,  # requests per day
    "gpt-3.5-turbo": 1000,      # requests per day (paid)
}

# Fallback when rate limits exceeded
def _get_fallback_analysis():
    return {
        "Overall Fit": 70,
        "Skill Match": 70,
        "Project Relevance": 70,
        "Problem Solving": 70,
        "Tools": 70,
        "Summary": "AI analysis temporarily unavailable due to rate limits. Please try again later or contact support to increase your API quota."
    }
```

#### Async Processing
```python
async def process_single_resume(resume_id: str, session_id: str, job_description: str = None):
    """Process resume analysis asynchronously"""
    try:
        # Download from S3
        content = await download_from_s3(s3_key)
        
        # Extract text
        resume_text = resume_analyzer.extract_resume_text(content, file_type)
        
        # AI analysis
        ai_result = await resume_analyzer.analyze_resume_with_ai(resume_text, job_description)
        
        # Store results
        await store_analysis_results(resume_id, session_id, ai_result)
        
    except Exception as e:
        print(f"Error processing resume {resume_id}: {e}")
```

### Memory Management

#### Text Chunking Strategy
```python
# Optimize chunk size for memory efficiency
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,      # Balance between context and memory
    chunk_overlap=200     # Ensure continuity between chunks
)

# Limit resume content for feedback generation
resume_content = request.resume_content[:2000] + "..." if len(request.resume_content) > 2000 else request.resume_content
job_description = request.job_description[:1000] + "..." if len(request.job_description) > 1000 else request.job_description
```

---

*[Continue to Part III: Frontend, Deployment & Operations]*
