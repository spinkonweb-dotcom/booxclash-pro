from pydantic import BaseModel, Field, validator, ConfigDict
from typing import List, Optional, Any, Dict, Literal, Union

# ==========================================
# 🚀 GENERATION REQUEST (The Main Input Model)
# ==========================================
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
    
    # 🗓️ TIMING & TERM
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

    model_config = ConfigDict(extra='ignore')

# ==========================================
# 📅 WEEKLY PLAN REQUEST (CRITICAL FIX)
# ==========================================
class WeeklyPlanRequest(BaseModel):
    uid: str
    grade: str
    subject: str
    term: str
    school: Optional[str] = "Unknown School"
    weekNumber: int
    days: Optional[int] = 5
    startDate: Optional[str] = None
    
    # Allow both 'topic' and 'theme'
    topic: Optional[str] = None 
    theme: Optional[str] = None
    schoolId: Optional[str] = None 
    
    # ✅ FIX: Added 'references' so the data is accepted from frontend
    references: Optional[str] = None

    model_config = ConfigDict(extra='ignore')

# ==========================================
# 🍎 SCHEME MODELS
# ==========================================

class SchemeRequest(BaseModel):
    schoolName: str 
    term: str = "Term 1"
    subject: str
    grade: str
    weeks: int
    startDate: Optional[str] = None
    uid: Optional[str] = None
    schoolId: Optional[str] = None 

class SchemeRow(BaseModel):
    # 1. CORE IDENTIFIERS
    week: Union[str, int]
    week_number: Optional[int] = None
    
    # ✅ NEW FIELDS (Required for the new PDF/Table format)
    date_range: Optional[str] = "" 
    topic_content: Optional[str] = "" 
    
    # Standard identifiers
    topic: Optional[str] = ""
    subtopic: Optional[str] = ""
    unit: Optional[str] = "" 
    theme: Optional[str] = ""

    # 2. COMPETENCE & OUTCOMES
    outcomes: List[str] = [] 
    
    # Legacy fields
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

    # 🛡️ VALIDATORS: Auto-fix AI mapping errors (String -> List conversion)
    
    # ✅ FIX: This validator intercepts Strings and converts them to Lists
    # before Pydantic throws a validation error.
    @validator('methods', 'resources', 'references', 'content', 'outcomes', 'assessment', 'learning_activities', pre=True)
    def coerce_to_list(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            # If it has newlines, split by newline (common in AI bullet points)
            if "\n" in v:
                return [x.strip() for x in v.split("\n") if x.strip()]
            # If it has commas, split by comma (common in CSV style)
            if "," in v:
                return [x.strip() for x in v.split(",") if x.strip()]
            # Otherwise, just wrap the single string in a list
            return [v.strip()]
        return v

    @validator('outcomes', pre=True, always=True)
    def populate_outcomes(cls, v, values):
        if not v:
            return values.get('specific_competences') or values.get('specific_outcomes') or []
        return v

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

    model_config = ConfigDict(populate_by_name=True, extra='allow')

class SchemeResponse(BaseModel):
    intro: Dict[str, Any] = {} 
    rows: List[SchemeRow]
    
    model_config = ConfigDict(extra='allow')

# ==========================================
# 📝 WORKSHEET MODELS
# ==========================================

class WorksheetRequest(BaseModel):
    uid: Optional[str] = None
    grade: str
    subject: str
    topic: str
    subtopic: Optional[str] = ""
    term: Optional[str] = "Term 1"
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    school_name: str
    schoolId: Optional[str] = None

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