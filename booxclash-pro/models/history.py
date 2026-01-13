from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

class SessionMode(str, Enum):
    TEACHER = "teacher"
    EXAM = "exam"
    TUTOR = "tutor"

class HistoryBase(BaseModel):
    user_name: str
    grade: str
    subject: str
    topic: Optional[str] = None
    mode: SessionMode
    
    # Flexible container for specific data
    # Teacher: { "lesson_plan": "...", "schemes": "..." }
    # Exam: { "score": 80, "questions": [...], "corrections": "..." }
    # Tutor: { "summary": "...", "chat_log": [...] }
    content: Dict[str, Any] = {} 

class HistoryCreate(HistoryBase):
    """Schema for creating a new entry"""
    pass

class HistoryDB(HistoryBase):
    """Schema for reading from DB"""
    id: str = Field(alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "user_name": "Jane Doe",
                "grade": "12",
                "subject": "Biology",
                "mode": "exam",
                "content": {
                    "score": "85%",
                    "topics_covered": ["Mitosis", "Cell Division"]
                }
            }
        }