# FILE: models/schemas.py
from pydantic import BaseModel, Field
from typing import Optional, List, Dict

class StudentProfile(BaseModel):
    uid: Optional[str] = None
    student_name: str = Field(alias="name") 
    grade: str
    subject: str
    country: str = "Zambia"
    credits: Optional[int] = 5  # ✅ ADDED: Defaults to 5 if missing
    
    class Config:
        populate_by_name = True 

class StartSessionRequest(StudentProfile):
    mode: str = "tutor"

class ToolRequest(BaseModel):
    tool_name: str
    context_topic: Optional[str] = ""
    arguments: dict = {}
    student: StudentProfile 

class QuizResult(BaseModel):
    topic: str
    grade: str = "8"
    score: int
    total_questions: int
    mistakes: List[Dict[str, str]]

class SchemeRequest(BaseModel):
    schoolName: str
    term: str
    subject: str
    grade: str
    weeks: int
    startDate: Optional[str] = None
    uid: Optional[str] = None

class SchemeRow(BaseModel):
    month: Optional[str] = None
    week: str
    topic: Optional[str] = None
    content: List[str] = []
    outcomes: List[str] = []
    references: List[str] = []
    isSpecialRow: bool = False