# FILE: models/schemas.py
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

# -----------------------------------
# 🎓 STUDENT / TUTOR MODELS
# -----------------------------------
class StudentProfile(BaseModel):
    uid: Optional[str] = None
    student_name: str = Field(alias="name") 
    grade: str
    subject: str
    country: str = "Zambia"
    credits: Optional[int] = 3  # ✅ Defaults to 3 if missing
    
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

# -----------------------------------
# 🍎 TEACHER / SCHEME MODELS
# -----------------------------------

class SchemeRequest(BaseModel):
    schoolName: str  # ✅ Used for both Old and New schemes header
    term: str
    subject: str
    grade: str
    weeks: int
    startDate: Optional[str] = None
    uid: Optional[str] = None

class SchemeRow(BaseModel):
    # Common Fields
    month: Optional[str] = None
    week: str
    topic: Optional[str] = None
    subtopic: Optional[str] = None
    
    # ✅ OLD CURRICULUM FIELDS (Traditional)
    content: List[str] = []
    outcomes: List[str] = []
    references: List[str] = []
    
    # ✅ NEW CURRICULUM FIELDS (CBC / 2013)
    prescribed_competences: List[str] = []
    specific_competences: List[str] = []
    learning_activities: List[str] = []
    methods: List[str] = []
    assessment: List[str] = []
    resources: List[str] = []
    
    # Utility
    isSpecialRow: bool = False

class SchemeResponse(BaseModel):
    intro: Dict[str, Any] = {} # Stores { "philosophy": "...", "goals": [...] }
    rows: List[SchemeRow]