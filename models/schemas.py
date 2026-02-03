from pydantic import BaseModel, Field, validator
from typing import List, Optional, Any, Dict, Literal

# ==========================================
# 🚀 GENERATION REQUEST (The Main Input Model)
# ==========================================
# This fixes the "AttributeError: 'GenerationRequest' object has no attribute 'term'"
class GenerationRequest(BaseModel):
    # Request Meta
    type: str = "lesson"  # 'lesson', 'weekly', 'scheme'
    uid: Optional[str] = None
    school_id: Optional[str] = None
    
    # Curriculum Data
    grade: Optional[str] = "Grade 9"
    subject: Optional[str] = "Mathematics"
    topic: Optional[str] = ""
    subtopic: Optional[str] = ""
    
    # 🗓️ TIMING & TERM (Updated with Defaults)
    # ✅ FIX: Defaults to "Term 1" to prevent crashes
    term: Optional[str] = "Term 1" 
    weekNumber: Optional[int] = 1
    weeks: Optional[int] = 13
    days: Optional[int] = 5
    startDate: Optional[str] = None
    
    # Lesson Specifics
    date: Optional[str] = None
    timeStart: Optional[str] = "08:00"
    timeEnd: Optional[str] = "09:00"
    objectives: Optional[List[str]] = []
    teacherName: Optional[str] = "Teacher"
    
    # Demographics
    boys: Optional[int] = 0
    girls: Optional[int] = 0

    class Config:
        extra = "ignore" # Ignores extra fields from frontend instead of crashing

# ==========================================
# 🍎 SCHEME MODELS
# ==========================================

class SchemeRequest(BaseModel):
    schoolName: str 
    # ✅ FIX: Defaults to "Term 1"
    term: str = "Term 1"
    subject: str
    grade: str
    weeks: int
    startDate: Optional[str] = None
    uid: Optional[str] = None

class SchemeRow(BaseModel):
    # 1. CORE IDENTIFIERS
    week: str
    week_number: Optional[int] = None
    topic: Optional[str] = ""
    subtopic: Optional[str] = ""
    
    # Unit/Theme support
    unit: Optional[str] = "" 
    theme: Optional[str] = ""

    # 2. COMPETENCE FIELDS
    prescribed_competences: List[str] = []
    specific_competences: List[str] = []
    
    # 3. CONTENT & ACTIVITIES
    content: List[str] = []
    learning_activities: List[str] = [] 
    
    # 4. PEDAGOGY & RESOURCES
    methods: List[str] = []
    assessment: List[str] = []
    resources: List[str] = []
    references: List[str] = []

    # 5. METADATA
    month: Optional[str] = None
    isSpecialRow: bool = False

    # 🛡️ VALIDATORS: Auto-fix common AI mapping errors
    
    @validator('learning_activities', pre=True)
    def check_activities_alias(cls, v, values):
        if not v:
            return values.get('activities') or values.get('activity') or []
        return v

    @validator('prescribed_competences', pre=True)
    def check_prescribed_alias(cls, v, values):
        if not v:
            return values.get('competences') or values.get('general_competences') or []
        return v

    @validator('specific_competences', pre=True)
    def check_specific_alias(cls, v, values):
        if not v:
            return values.get('outcomes') or values.get('objectives') or []
        return v

    class Config:
        populate_by_name = True
        extra = "allow" 

class SchemeResponse(BaseModel):
    intro: Dict[str, Any] = {} 
    rows: List[SchemeRow]
    
    class Config:
        extra = "allow"

# ==========================================
# 📝 WORKSHEET MODELS
# ==========================================

class WorksheetRequest(BaseModel):
    uid: Optional[str] = None
    grade: str
    subject: str
    topic: str
    subtopic: Optional[str] = ""
    # ✅ Added Term here for consistency (Optional)
    term: Optional[str] = "Term 1"
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    school_name: str

class WorksheetBlock(BaseModel):
    id: int
    type: Literal["mcq", "matching", "fill_blank", "svg_diagram", "open_question"]
    instruction: str
    content: Any 
    answer_key: str 

class WorksheetResponse(BaseModel):
    title: str
    grade: str
    blocks: List[WorksheetBlock]