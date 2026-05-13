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

# Initialize DB
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# 🛡️ THE ULTIMATE CORS FIX
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class ChatRequest(BaseModel):
    user_id: int
    agent_id: str
    message: str
    session_id: str = "default"

# 🚀 Render Health Check-ku idhu romba mukkiyam
@app.get("/")
@app.head("/")
def read_root():
    return {"status": "online"}

@app.post("/chat")
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    # Save User Msg
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
        response_text = f"Error: {str(e)}"

    # Save AI Msg
    ai_msg = models.ChatHistory(
        user_id=request.user_id, agent_id=request.agent_id,
        session_id=request.session_id, message=response_text, sender="ai"
    )
    db.add(ai_msg)
    db.commit()
    return {"response": response_text}

@app.get("/history/{user_id}/{agent_id}")
def get_history(user_id: int, agent_id: str, db: Session = Depends(get_db)):
    chats = db.query(models.ChatHistory).filter(
        models.ChatHistory.user_id == user_id,
        models.ChatHistory.agent_id == agent_id
    ).all()
    return [{"sender": c.sender, "text": c.message} for c in chats]

@app.get("/sessions/{user_id}/{agent_id}")
def get_sessions(user_id: int, agent_id: str, db: Session = Depends(get_db)):
    return []