from pydantic import BaseModel, Field, validator
from typing import List, Optional, Any, Dict, Literal
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
        extra = "ignore" 

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
    # 1. CORE IDENTIFIERS
    week: str
    week_number: Optional[int] = None
    topic: Optional[str] = ""
    subtopic: Optional[str] = ""
    
    # Unit/Theme support (Critical for Weekly Plans)
    unit: Optional[str] = "" 
    theme: Optional[str] = ""

    # 2. COMPETENCE FIELDS (Critical for CBC)
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
        # If the AI sends 'activities' or 'activity' instead of 'learning_activities', fix it.
        if not v:
            return values.get('activities') or values.get('activity') or []
        return v

    @validator('prescribed_competences', pre=True)
    def check_prescribed_alias(cls, v, values):
        # Map 'competences' or 'general_competences' to 'prescribed_competences'
        if not v:
            return values.get('competences') or values.get('general_competences') or []
        return v

    @validator('specific_competences', pre=True)
    def check_specific_alias(cls, v, values):
        # Map 'outcomes' or 'objectives' to 'specific_competences' if needed
        if not v:
            return values.get('outcomes') or values.get('objectives') or []
        return v

    class Config:
        populate_by_name = True
        # ✅ CRITICAL: "allow" ensures extra fields (like 'competencies') are saved to DB 
        # instead of being thrown away, preventing data loss.
        extra = "allow" 

class SchemeResponse(BaseModel):
    intro: Dict[str, Any] = {} # Stores { "philosophy": "...", "goals": [...] }
    rows: List[SchemeRow]
    
    class Config:
        extra = "allow"



class WorksheetRequest(BaseModel):
    uid: Optional[str] = None
    grade: str
    subject: str
    topic: str
    subtopic: Optional[str] = ""
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    school_name: str

# A single building block of a worksheet
class WorksheetBlock(BaseModel):
    id: int
    type: Literal["mcq", "matching", "fill_blank", "svg_diagram", "open_question"]
    instruction: str
    content: Any # Dynamic: can be a string (SVG), list (MCQ options), or dict (Matching pairs)
    answer_key: str 

class WorksheetResponse(BaseModel):
    title: str
    grade: str
    blocks: List[WorksheetBlock]