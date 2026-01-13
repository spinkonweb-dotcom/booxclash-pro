from pydantic import BaseModel, Field
from typing import Optional, List, Dict

class StudentProfile(BaseModel):
    uid: Optional[str] = None
    student_name: str = Field(alias="name") 
    grade: str
    subject: str
    country: str = "Zambia"
    
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
    startDate: Optional[str] = None  # ✅ ADDED THIS FIELD
    uid: Optional[str] = None

class SchemeRow(BaseModel):
    month: Optional[str] = None
    week: str
    topic: Optional[str] = None
    # period: str  # You can keep this if you use it, or make it Optional
    content: List[str] = []
    outcomes: List[str] = []
    references: List[str] = []
    isSpecialRow: bool = False