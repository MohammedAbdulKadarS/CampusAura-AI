from sqlalchemy import Column, Integer, String, Text, DateTime
from database import Base
import datetime

# User details store panna intha table
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    placement_score = Column(Integer, default=0) # Namma sonna PRS score inga thaan save aagum

# Chat history (Student vs Faculty) save panna intha table
# Chat history (Student vs Faculty) save panna intha table
class ChatHistory(Base):
    __tablename__ = "chat_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    agent_id = Column(String) # aryan, vikram, zara, etc.
    session_id = Column(String, default="default") # Puthu session handling-ku idhu venum
    message = Column(Text)
    sender = Column(String) # 'user' or 'ai'
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)