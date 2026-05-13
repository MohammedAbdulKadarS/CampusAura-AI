from groq import Groq
import os
from fastapi import FastAPI, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from . import models
from .database import engine, get_db
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from fastapi import UploadFile, File
from pypdf import PdfReader
import io

# Groq Configuration
# Note: In real production, use os.getenv("GROQ_API_KEY") for security
# main.py line 16-la ippadi maathidu:
client = Groq(api_key="PASTE_YOUR_KEY_HERE_LATER")

# Database tables creation
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS Middleware - Next.js connectivity-ku romba mukkiyam
# main.py-la intha section-ah update pannu
from fastapi.middleware.cors import CORSMiddleware

# Intha list-la un Vercel URL-ah add pannanum
# main.py-la intha section-ah ippadiyae paste pannu
origins = [
    "http://localhost:3000",
    "https://campus-aura-ai.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # Inga origins list-ah direct-ah kudukkuroam
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Chat Request Structure
class ChatRequest(BaseModel):
    user_id: int
    agent_id: str
    message: str
    session_id: str = "default"

@app.get("/")
def read_root():
    return {"message": "CampusAura AI Backend is Running Successfully!"}

# --- CHAT ROUTE WITH AGENT ISOLATION & AUDITOR MARCUS LOGIC ---
@app.post("/chat")
def chat_with_agent(request: ChatRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # 1. User message-ai save panrom (Agent ID sethu)
    user_msg = models.ChatHistory(
        user_id=request.user_id,
        agent_id=request.agent_id,
        session_id=request.session_id,
        message=request.message,
        sender="user"
    )
    db.add(user_msg)
    db.commit() 

    # --- DYNAMIC SYSTEM PROMPT LOGIC ---
    if request.agent_id.lower() == "marcus":
        system_content = (
            "You are Auditor Marcus, a world-class ATS (Applicant Tracking System) Compliance Lead. "
            "Your tone is professional, analytical, direct, and slightly strict. You do not engage in small talk. "
            "Your mission is to scrutinize resume content for high-package tech roles.\n\n"
            "STRICT OUTPUT STRUCTURE FOR MARCUS:\n"
            "1. **ATS COMPATIBILITY SCORE**: Provide a percentage (e.g., 75%) based on industry standards.\n"
            "2. **PARSING ERRORS**: Identify formatting issues that might break ATS systems.\n"
            "3. **KEYWORD ANALYSIS**: List critical missing technical keywords for the target role.\n"
            "4. **QUANTITATIVE GAPS**: Highlight where achievements lack metrics (numbers/percentages).\n"
            "5. **MARCUS'S DIRECTIVE**: Provide one final, high-impact instruction to fix the resume.\n\n"
            "Add exactly TWO EMPTY LINES between every section for high readability."
        )
    else:
        system_content = (
            f"You are {request.agent_id}, a personal career mentor at CampusAura. "
            "Your goal is to guide students like a senior and well experienced trainer. "
            "\n\nSTRICT RULES:\n"
            "- Use bold headers for sections.\n"
            "1. Structure your answer with clear bold headers.\n"
            "2. Use bullet points for steps.\n"
            "3. Add TWO blank lines between every major section for readability.\n"
            "4. Don't give robotic data like 'Job Responsibilities'. Instead, give an actionable roadmap.\n"
            "5. Keep your responses concise (2-3 sentences max) and easy to follow.\n"
            "6. Focus on practical steps and actionable advice.\n"
            "7. Use simple language and avoid technical jargon.\n"
            "8. If the user asks about your background, say you're a senior trainer with 10+ years of experience.\n"
            "9. If the user asks about your qualifications, say you're a certified career mentor.\n"
            "10. If the user asks about your availability, say you're available 24/7.\n"
            "11. If the user asks about your fees, say you're a free mentor.\n"
            "12. Use an encouraging tone.\n"
            "13. Add exactly TWO EMPTY LINES between every paragraph for high readability.\n"
            "14. Ensure the response is clean and airy.\n"
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
        ai_response_text = "Sorry machan, chinna technical glitch. Oru vaati thirumba try pannu!"

    # 2. AI response-ai database-la save panrom (Agent ID sethu)
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

# --- HISTORY ROUTE (Specific Session Messages) ---
@app.get("/history/{user_id}/{agent_id}")
def get_history(user_id: int, agent_id: str, session_id: str = "default", db: Session = Depends(get_db)):
    chats = db.query(models.ChatHistory).filter(
        models.ChatHistory.user_id == user_id,
        models.ChatHistory.agent_id == agent_id,
        models.ChatHistory.session_id == session_id
    ).order_by(models.ChatHistory.timestamp.asc()).all()
    
    return [{"sender": c.sender, "text": c.message} for c in chats]

# --- SESSIONS ROUTE (Sidebar History List - Isolated by Agent) ---
@app.get("/sessions/{user_id}/{agent_id}")
def get_user_sessions(user_id: int, agent_id: str, db: Session = Depends(get_db)):
    # Indha query ippo agent_id filter-ah use panni dynamic-aa edukkum
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
            # First message-ah title-aa mathurom
            clean_message = s.message.replace('\n', ' ').strip()
            title = clean_message[:30] + "..." if len(clean_message) > 30 else clean_message
            unique_sessions[s.session_id] = title.upper() # Design-ku etha maari Uppercase

    # Latest sessions top-la vara reverse panni anupurom
    result = [{"id": sid, "title": title} for sid, title in unique_sessions.items()]
    return result[::-1]

    # --- PDF TEXT EXTRACTION ENDPOINT ---
@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    try:
        # PDF contents-ah read panrom
        contents = await file.read()
        reader = PdfReader(io.BytesIO(contents))
        extracted_text = ""
        
        # Ovvoru page-la irundhum text-ah edukkurom
        for page in reader.pages:
            text = page.extract_text()
            if text:
                extracted_text += text
            
        if not extracted_text.strip():
            return {"error": "Machan, PDF empty-ah irukku illa na read panna mudila!"}
            
        # Extracted text-ah frontend-ku thirumba anuppurom
        return {"text": extracted_text}
        
    except Exception as e:
        print(f"PDF Parse Error: {e}")
        return {"error": f"PDF process pannum pothu chinna glitch machan: {str(e)}"}