import os
import json
from datetime import datetime
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel

from services.file_manager import (
    load_generated_scheme, 
    save_weekly_plan, 
    load_weekly_plan, 
    save_lesson_plan 
)
from services.credit_manager import check_and_deduct_credit
from services.syllabus_manager import get_subjects_for_grade
# ✅ ADDED: Database import to fetch user details
from services.firebase_setup import db 

from services.llm_teacher_engine_new import (
    generate_weekly_plan_from_scheme,
    generate_specific_lesson_plan,
)

router = APIRouter()

# ⚡️ CONFIGURATION: STRICT MAPPING
# Keys = What the user might ask for (Old/Alt terms)
# Values = Where the ACTUAL files are stored (Current System)
GRADE_MAP = {
    # Lower Secondary: "Grade 8" files don't exist -> Map to "Form 1"
    "grade 8": "Form 1",
    "grade 9": "Form 2",
    
    # Upper Secondary: "Form 3" files don't exist -> Map to "Grade 10"
    "form 3": "Grade 10",
    "form 4": "Grade 11",
    "form 5": "Grade 12",
    "form 6": "Grade 13", 
}

class PlanQuery(BaseModel):
    grade: str
    subject: str
    term: str
    weekNumber: int

# ... (get_weekly_plan remains the same) ...
@router.post("/get-weekly-plan")
async def get_weekly_plan(
    query: PlanQuery, 
    x_user_id: str = Header(None, alias="X-User-ID")
):
    print(f"📂 Requesting Local Weekly Plan: {query.subject} Grade {query.grade} Week {query.weekNumber}")
    uid = x_user_id if x_user_id else "default_user"
    
    data = load_weekly_plan(uid=uid, subject=query.subject, grade=query.grade, term=query.term, week=query.weekNumber)

    if not data and uid != "default_user":
        data = load_weekly_plan(uid="default_user", subject=query.subject, grade=query.grade, term=query.term, week=query.weekNumber)

    if not data:
        raise HTTPException(status_code=404, detail="Weekly Plan file not found locally.")

    return data


@router.get("/get-subjects/{grade}")
async def get_subjects_endpoint(grade: str):
    """
    Handles fetching subjects with strict curriculum mapping.
    
    SCENARIOS:
    1. Input "Form 1" -> Returns subjects from "Form 1" folder. (No Map)
    2. Input "Grade 8" -> Maps to "Form 1" -> Returns subjects from "Form 1" folder.
    3. Input "Grade 10" -> Returns subjects from "Grade 10" folder. (No Map)
    4. Input "Form 3" -> Maps to "Grade 10" -> Returns subjects from "Grade 10" folder.
    """
    
    # Normalize input to lowercase for key lookup
    normalized_key = grade.lower().strip()
    
    # Default target is exactly what was requested
    target_grade = grade 

    # Check if this grade needs to be redirected to a valid folder name
    if normalized_key in GRADE_MAP:
        mapped_grade = GRADE_MAP[normalized_key]
        print(f"🔄 Mapping Request '{grade}' -> '{mapped_grade}' (File System Source)")
        target_grade = mapped_grade
    
    # Fetch subjects from the correct folder
    subjects = get_subjects_for_grade(target_grade)
    
    if not subjects:
        # Fallback: Just in case the mapping was wrong and the original actually exists
        if target_grade != grade:
             print(f"⚠️ Target '{target_grade}' empty. Retrying original '{grade}'...")
             subjects = get_subjects_for_grade(grade)

    if not subjects:
        return {"subjects": [], "message": f"No syllabus files found for {grade} (checked {target_grade})"}
        
    return {"subjects": subjects}
