import os
import re
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document

RESUME_FOLDER = "resume_data"
FAISS_DB_PATH = "embeddings/faiss_resume_db"
MODEL_NAME = "all-MiniLM-L6-v2"

embedding_model = HuggingFaceEmbeddings(model_name=MODEL_NAME)
splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
all_chunks = []

def extract_contact_info(text):
    email = re.findall(r"[a-zA-Z0-9.\-_]+@[a-zA-Z0-9\-_]+\.[a-zA-Z.]+", text)
    phone = re.findall(r"\+?\d[\d\s\-]{8,13}\d", text)
    return email[0] if email else "", phone[0] if phone else ""

def is_relevant_section(text):
    sections = ["skills", "experience", "project", "education"]
    return any(sec in text.lower() for sec in sections)

for filename in os.listdir(RESUME_FOLDER):
    if not filename.endswith(".pdf"):
        continue

    path = os.path.join(RESUME_FOLDER, filename)
    print(f"Loading: {filename}")

    loader = PyMuPDFLoader(path)
    documents = loader.load()

    full_text = "\n".join(doc.page_content for doc in documents if doc.page_content.strip())

    first_line = documents[0].page_content.strip().split("\n")[0]
    name = first_line if len(first_line.split()) in [2, 3] else "Unknown"
    email, phone = extract_contact_info(full_text)
    print(f"[DEBUG] email: {email}, phone:{phone}")

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
        if email == "aasrithreddy399@gmail.com":
            print(all_chunks)
print(f"\nTotal relevant chunks to embed: {len(all_chunks)}")

if all_chunks:
    vectorstore = FAISS.from_documents(all_chunks, embedding_model)
    vectorstore.save_local(FAISS_DB_PATH)
    print(f"Embedded and saved to: {FAISS_DB_PATH}")
else:
    print("No relevant chunks found. Check your filtering logic or resumes.")
