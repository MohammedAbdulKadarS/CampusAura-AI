from groq import Groq
import os
from fastapi import FastAPI, Depends, BackgroundTasks, UploadFile, File
from sqlalchemy.orm import Session
from . import models
from .database import engine, get_db
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from pypdf import PdfReader
import io
import uvicorn

# --- Database Setup ---
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# --- CORS Configuration ---
origins = [
    "http://localhost:3000",
    "https://campus-aura-ai.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Production-la specific-aa venum na origins list kudukkalam, ipo '*' safe path fix-ku
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Groq Client Initialization ---
# Render Environment Variables-la GROQ_API_KEY nu name vachukko
api_key = os.getenv("GROQ_API_KEY", "PASTE_YOUR_KEY_HERE_IF_NOT_IN_ENV")
client = Groq(api_key=api_key)

# --- Models ---
class ChatRequest(BaseModel):
    user_id: int
    agent_id: str
    message: str
    session_id: str = "default"

@app.get("/")
def read_root():
    return {"message": "CampusAura AI Backend is Running Successfully!"}

# --- CHAT ROUTE ---
@app.post("/chat")
def chat_with_agent(request: ChatRequest, db: Session = Depends(get_db)):
    # 1. Save User Message
    user_msg = models.ChatHistory(
        user_id=request.user_id,
        agent_id=request.agent_id,
        session_id=request.session_id,
        message=request.message,
        sender="user"
    )
    db.add(user_msg)
    db.commit()

    # --- System Prompt Logic ---
    if request.agent_id.lower() == "marcus":
        system_content = (
            "You are Auditor Marcus, a world-class ATS Compliance Lead. Tone: Strict, Professional.\n\n"
            "STRICT OUTPUT STRUCTURE:\n"
            "1. **ATS COMPATIBILITY SCORE**\n"
            "2. **PARSING ERRORS**\n"
            "3. **KEYWORD ANALYSIS**\n"
            "4. **QUANTITATIVE GAPS**\n"
            "5. **MARCUS'S DIRECTIVE**\n\n"
            "Add exactly TWO EMPTY LINES between every section."
        )
    else:
        system_content = (
            f"You are {request.agent_id}, a personal career mentor at CampusAura. "
            "Tone: Encouraging senior trainer.\n\n"
            "STRICT RULES:\n"
            "- Use bold headers and bullet points.\n"
            "- Add TWO blank lines between sections.\n"
            "- Keep responses concise (2-3 sentences max).\n"
        )

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_content},
                {"role": "user", "content": request.message}
            ],
        )
        ai_response_text = completion.choices[0].message.content
    except Exception as e:
        print(f"Groq Error: {e}")
        ai_response_text = "Sorry machan, Groq API-la chinna issue. Un key check pannu!"

    # 2. Save AI Response
    ai_msg = models.ChatHistory(
        user_id=request.user_id,
        agent_id=request.agent_id,
        session_id=request.session_id,
        message=ai_response_text,
        sender="ai"
    )
    db.add(ai_msg)
    db.commit()
    
    return {"response": ai_response_text}

# --- HISTORY ROUTE ---
@app.get("/history/{user_id}/{agent_id}")
def get_history(user_id: int, agent_id: str, session_id: str = "default", db: Session = Depends(get_db)):
    chats = db.query(models.ChatHistory).filter(
        models.ChatHistory.user_id == user_id,
        models.ChatHistory.agent_id == agent_id,
        models.ChatHistory.session_id == session_id
    ).order_by(models.ChatHistory.timestamp.asc()).all()
    
    return [{"sender": c.sender, "text": c.message} for c in chats]

# --- SESSIONS ROUTE ---
@app.get("/sessions/{user_id}/{agent_id}")
def get_user_sessions(user_id: int, agent_id: str, db: Session = Depends(get_db)):
    sessions_raw = db.query(
        models.ChatHistory.session_id,
        models.ChatHistory.message
    ).filter(
        models.ChatHistory.user_id == user_id,
        models.ChatHistory.agent_id == agent_id,
        models.ChatHistory.sender == "user"
    ).order_by(models.ChatHistory.id.asc()).all()

    unique_sessions = {}
    for s in sessions_raw:
        if s.session_id not in unique_sessions:
            clean_message = s.message.replace('\n', ' ').strip()
            title = clean_message[:30] + "..." if len(clean_message) > 30 else clean_message
            unique_sessions[s.session_id] = title.upper()

    result = [{"id": sid, "title": title} for sid, title in unique_sessions.items()]
    return result[::-1]

# --- PDF UPLOAD ROUTE ---
@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        reader = PdfReader(io.BytesIO(contents))
        extracted_text = ""
        for page in reader.pages:
            text = page.extract_text()
            if text:
                extracted_text += text
        return {"text": extracted_text}
    except Exception as e:
        return {"error": str(e)}

# --- Port Binding for Render ---
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)