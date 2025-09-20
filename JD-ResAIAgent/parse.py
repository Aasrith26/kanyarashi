import os
import re
import json
import asyncio
import uuid
from io import BytesIO
from typing import List, Dict
from collections import defaultdict

import aioboto3
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel, Field
from docx import Document as DocxDocument
import pdfplumber

from langchain_core.documents import Document as LangchainDocument
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser
from starlette.middleware.cors import CORSMiddleware



print("🚀 [INIT] Initializing application...")
load_dotenv()

origins = [
    "http://localhost:3000",
"http://127.0.0.1:3000"
]

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

if os.getenv("OPENROUTER_API_KEY"):
    os.environ["OPENAI_API_BASE"] = "https://openrouter.ai/api/v1"
    os.environ["OPENAI_API_KEY"] = os.getenv("OPENROUTER_API_KEY")
    print("✅ [INIT] Configured to use OpenRouter.")

app = FastAPI(title="Stateful Resume Analyzer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


print("⏳ [INIT] Loading embedding model...")
embedding_model = HuggingFaceEmbeddings(model_name=settings.embedding_model_name)
print(f"✅ [INIT] Embedding model loaded: {settings.embedding_model_name}")

splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
llm = ChatOpenAI(model=settings.llm_model, temperature=0.2)
print(f"✅ [INIT] LLM model configured: {settings.llm_model}")

prompt = PromptTemplate(
    input_variables=["jd", "resume_summary"],
    template="""
You are a technical recruiter AI assistant. Evaluate the candidate’s resume against the job description.
When summarizing candidate,summarise kindly without directly mentioning lack of skill.
Job Description: {jd}
Candidate Summary: {resume_summary}
Return a single, valid JSON object with no commentary or explanations. The format must be exactly:
{{
  "Skill Match": <score out of 100>,
  "Project Relevance": <score out of 100>,
  "Problem Solving": <score out of 100>,
  "Tools": <score out of 100>,
  "Overall Fit": <score out of 100>,
  "Summary": "<4-5 line justification>"
}}
"""
)
chain = prompt | llm | StrOutputParser()


class AnalyzeRequest(BaseModel):
    jd_filename: str
    top_k: int = Field(5, gt=0, description="The number of top resumes to return.")


JOB_STORE: Dict[str, FAISS] = {}
print("✅ [INIT] In-memory job store initialized.")


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
    # More precise email regex that stops at word boundaries
    email = re.findall(r"\b[\w\.\-]+@[\w\.\-]+\.[a-zA-Z]{2,}\b", text)
    phone = re.findall(r"\+?\d[\d\s\-]{8,13}\d", text)
    return email[0] if email else "", phone[0] if phone else ""


@app.get("/")
def read_root():
    print("✅ [API HIT] Root endpoint '/' was called successfully!")
    return {"status": "ok", "message": "API is running!"}


@app.post("/load-resumes", summary="Step 1: Process all resumes from S3 and create a job")
async def load_resumes(s3_client=Depends(get_s3_client)):
    job_id = str(uuid.uuid4())
    print(f"\n✅ [API HIT] /load-resumes. New Job ID created: {job_id}")

    print(f"   [S3] Listing files in bucket '{settings.s3_bucket}' with prefix '{settings.resumes_prefix}'")
    paginator = s3_client.get_paginator('list_objects_v2')
    pages = paginator.paginate(Bucket=settings.s3_bucket, Prefix=settings.resumes_prefix)

    all_chunks = []
    resume_count = 0
    async for page in pages:
        for obj in page.get("Contents", []):
            key = obj.get("Key")
            if not key or key == settings.resumes_prefix:
                continue

            resume_count += 1
            filename = os.path.basename(key)
            print(f"\n   [PROCESSING] Downloading and parsing resume: {filename}")

            try:
                response = await s3_client.get_object(Bucket=settings.s3_bucket, Key=key)
                file_bytes = await response["Body"].read()
                full_text = await asyncio.to_thread(read_file_content, file_bytes, filename)

                name = full_text.strip().split("\n")[0]
                name = name if len(name.split()) < 4 else "Unknown Candidate"
                email, phone = extract_contact_info(full_text)

                chunks = await asyncio.to_thread(splitter.create_documents, [full_text])
                print(f"      [CHUNKING] Split '{filename}' into {len(chunks)} chunks.")

                for chunk in chunks:
                    chunk.metadata = {"resume_id": filename, "name": name, "email": email, "phone": phone}

                all_chunks.extend(chunks)
            except Exception as e:
                print(f"      [ERROR] Skipping file {filename} due to error: {e}")

    if not all_chunks:
        print("   [ERROR] No resume content could be processed from S3.")
        raise HTTPException(status_code=404, detail="No processable resumes found in S3.")

    print(f"\n   [EMBEDDING] Creating FAISS index from {len(all_chunks)} total chunks from {resume_count} resumes.")
    vectorstore = await asyncio.to_thread(FAISS.from_documents, all_chunks, embedding_model)
    print("   [EMBEDDING] FAISS index created successfully.")

    JOB_STORE[job_id] = vectorstore
    print(f"   [STATE] Saved vector store to in-memory JOB_STORE with ID: {job_id}")

    return {"job_id": job_id, "message": f"Successfully processed {resume_count} resumes."}


@app.post("/analyze/{job_id}", summary="Step 2: Analyze against loaded resumes using a JD from S3")
async def analyze(
        job_id: str,
        request: AnalyzeRequest,
        s3_client=Depends(get_s3_client)
):
    print(f"\n✅ [API HIT] /analyze/{job_id}. Using JD from S3: '{request.jd_filename}', Top K: {request.top_k}")

    print(f"   [STATE] Attempting to retrieve vector store for job ID: {job_id}")
    vectorstore = JOB_STORE.get(job_id)
    if not vectorstore:
        print(f"   [ERROR] Job ID {job_id} not found in JOB_STORE.")
        raise HTTPException(status_code=404, detail="Job ID not found. Please run /load-resumes first.")
    print("   [STATE] Successfully retrieved vector store from memory.")

    try:
        jd_key = f"{request.jd_filename}"
        print(f"   [S3] Fetching JD from S3 path: {jd_key}")
        response = await s3_client.get_object(Bucket=settings.s3_bucket, Key=jd_key)
        jd_bytes = await response["Body"].read()
        jd_text = await asyncio.to_thread(read_file_content, jd_bytes, request.jd_filename)
        print("   [PROCESSING] Successfully read and parsed JD file from S3.")
    except Exception as e:
        print(f"   [ERROR] Could not find or read JD '{request.jd_filename}' from S3. Error: {e}")
        raise HTTPException(status_code=404, detail=f"JD file '{request.jd_filename}' not found in S3.")


    k_to_fetch = request.top_k * 5
    print(f"   [ANALYSIS] Performing similarity search to fetch up to {k_to_fetch} chunks...")
    results = await asyncio.to_thread(
        vectorstore.similarity_search_with_score,
        jd_text, k=k_to_fetch
    )
    print(f"   [ANALYSIS] Similarity search returned {len(results)} chunks.")

    grouped_by_resume = defaultdict(list)
    for doc, score in results:
        grouped_by_resume[doc.metadata["resume_id"]].append((doc, score))

    # Slice the sorted list to the requested top_k value
    top_resumes = sorted(
        [(rid, min(s for _, s in chunks), chunks) for rid, chunks in grouped_by_resume.items()],
        key=lambda x: x[1]
    )[:request.top_k]
    print(f"   [ANALYSIS] Grouped and sorted results into {len(top_resumes)} top candidate resumes.")

    print(f"   [LLM] Preparing {len(top_resumes)} concurrent requests for LLM evaluation...")

    async def get_evaluation(jd, summary, resume_id):
        print(f"      -> [LLM] Sending request for resume: {resume_id}")
        try:
            response_content = await chain.ainvoke({"jd": jd, "resume_summary": summary})
            print(f"      <- [LLM] Received response for resume: {resume_id}")
            print(f"[RESPONSE] {response_content}")
            return json.loads(response_content)
        except Exception as e:
            print(f"      [ERROR] LLM evaluation failed for {resume_id}: {e}")
            return {"Error": f"Failed to get or parse LLM evaluation: {str(e)}"}

    tasks = []
    for resume_id, _, chunks in top_resumes:
        top_chunks = sorted(chunks, key=lambda x: x[1])[:5]
        summary_text = "\n---\n".join(doc.page_content.strip() for doc, _ in top_chunks)
        tasks.append(get_evaluation(jd_text, summary_text, resume_id))

    evaluations = await asyncio.gather(*tasks)
    print("   [LLM] All evaluations completed.")

    final_output = []
    for i, (resume_id, _, chunks) in enumerate(top_resumes):
        meta = chunks[0][0].metadata
        final_output.append({
            "name": meta.get("name", "Unknown"),
            "email": meta.get("email", "N/A"),
            "phone": meta.get("phone", "N/A"),
            "resume": resume_id,
            "evaluation": evaluations[i]
        })

    print(f"\n✅ [COMPLETE] Analysis for job {job_id} finished. Returning results.")
    return final_output