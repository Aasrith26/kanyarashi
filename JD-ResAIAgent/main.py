import os
import re
import json
from io import BytesIO
from typing import List
from collections import defaultdict

import boto3
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from docx import Document as DocxDocument
import pdfplumber

from langchain_core.documents import Document as LangchainDocument
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI

# Load environment variables
load_dotenv()
os.environ["OPENAI_API_BASE"] = "https://openrouter.ai/api/v1"

# Constants
S3_BUCKET_NAME = os.getenv("S3_BUCKET")
FAISS_DB_PATH = "embeddings/faiss_resume_db"
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

# AWS S3 Client
s3 = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY"),
    aws_secret_access_key=os.getenv("AWS_SECRET_KEY"),
    region_name=os.getenv("AWS_REGION", "ap-south-1")
)

# App & AI setup
app = FastAPI()
embedding_model = HuggingFaceEmbeddings(model_name=MODEL_NAME)
splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
llm = ChatOpenAI(model="qwen/qwen3-14b:free", temperature=0.2)

prompt = PromptTemplate(
    input_variables=["jd", "resume_summary"],
    template="""
You are a technical recruiter AI assistant. Evaluate the candidate’s resume against the job description.

Job Description:
{jd}

Candidate Summary:
{resume_summary}

Return exactly this format:
{{
  "Skill Match": <score out of 100>,
  "Project Relevance": <score out of 100>,
  "Problem Solving": <score out of 100>,
  "Tools": <score out of 100>,
  "Overall Fit": <score out of 100>,
  "Summary": "<4-5 line justification>"
}}

Only return valid JSON. Do not include any commentary or explanation.
And scoring need not to be a round figure.
"""
)
chain = prompt | llm

# ---------------------- Helpers ---------------------- #

def extract_contact_info(text: str):
    email = re.findall(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]+", text)
    phone = re.findall(r"\+?\d[\d\s\-]{8,13}\d", text)
    return email[0] if email else "", phone[0] if phone else ""

def is_relevant_section(text: str):
    keywords = ["skills", "experience", "project", "education"]
    return any(k in text.lower() for k in keywords)

def read_file_content(file_bytes: bytes, filename: str) -> str:
    ext = filename.split(".")[-1].lower()
    if ext == "pdf":
        with pdfplumber.open(BytesIO(file_bytes)) as pdf:
            return "\n".join([page.extract_text() or "" for page in pdf.pages])
    elif ext == "docx":
        doc = DocxDocument(BytesIO(file_bytes))
        return "\n".join([para.text for para in doc.paragraphs])
    elif ext == "txt":
        return file_bytes.decode("utf-8")
    else:
        raise ValueError("Unsupported file type")

# ---------------------- Routes ---------------------- #

@app.post("/upload-resumes/")
async def upload_resumes(files: List[UploadFile] = File(...)):
    uploaded = []
    for file in files:
        s3.upload_fileobj(file.file, S3_BUCKET_NAME, f"resumes/{file.filename}")
        uploaded.append(file.filename)
    return {"message": "Resumes uploaded successfully", "files": uploaded}

@app.post("/upload-jd/")
async def upload_jd(file: UploadFile = File(...)):
    s3.upload_fileobj(file.file, S3_BUCKET_NAME, f"jd/{file.filename}")
    return {"message": "JD uploaded successfully", "file": file.filename}

@app.post("/process-resumes/")
def process_resumes_from_s3():
    all_chunks = []
    response = s3.list_objects_v2(Bucket=S3_BUCKET_NAME, Prefix="resumes/")
    for obj in response.get("Contents", []):
        key = obj["Key"]
        filename = key.split("/")[-1]
        if not filename:
            continue

        file_bytes = s3.get_object(Bucket=S3_BUCKET_NAME, Key=key)["Body"].read()

        try:
            full_text = read_file_content(file_bytes, filename)
        except Exception as e:
            print(f"[WARN] Skipping {filename}: {e}")
            continue

        name = full_text.strip().split("\n")[0]
        name = name if len(name.split()) in [2, 3] else "Unknown"
        email, phone = extract_contact_info(full_text)

        chunks = splitter.create_documents([full_text])
        for chunk in chunks:
            if not is_relevant_section(chunk.page_content):
                continue
            chunk.metadata = {
                "resume_id": filename,
                "name": name,
                "email": email,
                "phone": phone
            }
            all_chunks.append(chunk)

    if not all_chunks:
        return {"message": "No relevant chunks found."}

    vectorstore = FAISS.from_documents(all_chunks, embedding_model)
    vectorstore.save_local(FAISS_DB_PATH)

    return {"message": f"Embedded and saved {len(all_chunks)} relevant chunks."}

class JDRequest(BaseModel):
    jd_filename: str
    top_k: int = 20

@app.post("/analysis/")
def analyze(jd_request: JDRequest):
    jd_key = f"jd/{jd_request.jd_filename}"
    jd_bytes = s3.get_object(Bucket=S3_BUCKET_NAME, Key=jd_key)["Body"].read()
    jd_text = read_file_content(jd_bytes, jd_request.jd_filename)

    vectorstore = FAISS.load_local(
        FAISS_DB_PATH, embedding_model, allow_dangerous_deserialization=True
    )
    results = vectorstore.similarity_search_with_score(jd_text, k=jd_request.top_k * 5)

    grouped = defaultdict(list)
    for doc, score in results:
        grouped[doc.metadata["resume_id"]].append((doc, score))

    top_resumes = sorted(
        [(rid, min(score for _, score in chunks), chunks) for rid, chunks in grouped.items()],
        key=lambda x: x[1]
    )[:jd_request.top_k]

    final_output = []

    for resume_id, _, chunks in top_resumes:
        top_chunks = sorted(chunks, key=lambda x: x[1])[:5]
        summary = "\n".join(doc.page_content.strip() for doc, _ in top_chunks)
        meta = top_chunks[0][0].metadata
        try:
            response = chain.invoke({"jd": jd_text, "resume_summary": summary})
            parsed = json.loads(response.content)
        except Exception as e:
            parsed = {
                "Skill Match": 0,
                "Project Relevance": 0,
                "Problem Solving": 0,
                "Tools": 0,
                "Overall Fit": 0,
                "Summary": f"⚠ Error parsing response: {str(e)}"
            }

        final_output.append({
            "name": meta.get("name", "Unknown"),
            "email": meta.get("email", "N/A"),
            "phone": meta.get("phone", "N/A"),
            "resume": resume_id,
            "evaluation": parsed
        })

    return final_output
