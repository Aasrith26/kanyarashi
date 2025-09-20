from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from collections import defaultdict
from langchain_ollama import OllamaLLM
from langchain_core.prompts import PromptTemplate
from fastapi import FastAPI

app = FastAPI()

jd_text = """We are looking for a Machine Learning Engineer with strong experience in object detection, particularly using YOLO. 
The ideal candidate should also be familiar with convolutional neural networks, especially residual networks like ResNet or InceptionResNet.
Experience with FastAPI for deploying models and building inference APIs is highly desirable."""

embedding_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
vectorstore = FAISS.load_local("embeddings/faiss_resume_db", embedding_model, allow_dangerous_deserialization=True)

results = vectorstore.similarity_search_with_score(jd_text, k=20)
grouped = defaultdict(list)
for doc, score in results:
    grouped[doc.metadata["resume_id"]].append((doc, score))

prompt = PromptTemplate(
    input_variables=["jd", "resume_summary"],
    template="""
You are a technical recruiter screening resumes for a given job description. 
Based on the candidate's skills, experience, and projects, evaluate their fit for the role.
Job Description:
{jd}

Candidate Summary:
{resume_summary}

Please return:
1. A short and clear justification of how well this candidate fits the job role.
2. A final match score out of 100.

Format:
Reasoning: <summary>
Score: <number>
"""
)

llm = OllamaLLM(model="llama3")
chain = prompt | llm

print("\nFinal Results (LLaMA 3):\n")

for resume_id, chunks in grouped.items():
    top_chunks = sorted(chunks, key=lambda x: x[1])[:5]
    summary = "\n".join(doc.page_content.strip() for doc, _ in top_chunks)

    metadata = top_chunks[0][0].metadata
    name = metadata.get("name", "Unknown")
    email = metadata.get("email", "N/A")
    phone = metadata.get("phone", "N/A")

    try:
        response = chain.invoke({"jd": jd_text, "resume_summary": summary})
    except Exception as e:
        response = f"Error from LLaMA: {str(e)}"

    print(f"Name: {name}")
    print(f"Email: {email} | Phone: {phone}")
    print(f"Resume: {resume_id}")
    print(response.strip())
    print("-" * 50)
