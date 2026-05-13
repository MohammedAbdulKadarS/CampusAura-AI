from groq import Groq
import os
from fastapi import FastAPI, Depends, UploadFile, File
from sqlalchemy.orm import Session
from . import models
from .database import engine, get_db
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader
import io

# Initialize DB Tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# 🛡️ THE ULTIMATE CORS FIX (Open for all during debugging)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Groq Client setup
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class ChatRequest(BaseModel):
    user_id: int
    agent_id: str
    message: str
    session_id: str = "default"

# 🚀 Render Health Check & Root Fix
@app.get("/")
@app.head("/")
def read_root():
    return {"status": "online", "service": "CampusAura AI API"}

# --- CHAT ENDPOINTS ---
@app.post("/chat/")
@app.post("/chat")
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    # 1. Save User Msg
    new_msg = models.ChatHistory(
        user_id=request.user_id, agent_id=request.agent_id,
        session_id=request.session_id, message=request.message, sender="user"
    )
    db.add(new_msg)
    db.commit()

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": request.message}]
        )
        response_text = completion.choices[0].message.content
    except Exception as e:
        response_text = f"Machan, Groq connection-la issue: {str(e)}"

    # 2. Save AI Msg
    ai_msg = models.ChatHistory(
        user_id=request.user_id, agent_id=request.agent_id,
        session_id=request.session_id, message=response_text, sender="ai"
    )
    db.add(ai_msg)
    db.commit()
    return {"response": response_text}

# --- HISTORY ENDPOINTS ---
@app.get("/history/{user_id}/{agent_id}/")
@app.get("/history/{user_id}/{agent_id}")
def get_history(user_id: int, agent_id: str, db: Session = Depends(get_db)):
    chats = db.query(models.ChatHistory).filter(
        models.ChatHistory.user_id == user_id,
        models.ChatHistory.agent_id == agent_id
    ).order_by(models.ChatHistory.timestamp.asc()).all()
    return [{"sender": c.sender, "text": c.message} for c in chats]

# --- SESSIONS ENDPOINTS ---
@app.get("/sessions/{user_id}/{agent_id}/")
@app.get("/sessions/{user_id}/{agent_id}")
def get_sessions(user_id: int, agent_id: str, db: Session = Depends(get_db)):
    # Sidebar empty-ah irukka koodathu nu chinna logic
    sessions_raw = db.query(models.ChatHistory.session_id).filter(
        models.ChatHistory.user_id == user_id,
        models.ChatHistory.agent_id == agent_id
    ).distinct().all()
    
    return [{"id": s[0], "title": f"Chat Session {s[0][:8] if s[0] else ''}"} for s in sessions_raw]

# --- RESUME UPLOAD ---
@app.post("/upload-resume/")
@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        reader = PdfReader(io.BytesIO(contents))
        extracted_text = ""
        for page in reader.pages:
            text = page.extract_text()
            if text: extracted_text += text
        return {"text": extracted_text}
    except Exception as e:
        return {"error": str(e)}