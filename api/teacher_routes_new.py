import traceback
import re
from datetime import datetime, timedelta
from fastapi import APIRouter, Header, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from firebase_admin import firestore 

# Models
from models.schemas import SchemeRequest, SchemeRow, SchemeResponse

# Services
from services.llm_teacher_engine_new import (
    generate_scheme_with_ai, 
    generate_weekly_plan_from_scheme, 
    generate_specific_lesson_plan,
    generate_lesson_notes
)

# ✅ UPDATED: Import load_module here
from services.syllabus_manager import load_syllabus, load_module

from services.file_manager import (
    save_generated_scheme, 
    load_generated_scheme, 
    save_weekly_plan, 
    save_lesson_plan
)
from services.credit_manager import check_and_deduct_credit

router = APIRouter()
db = firestore.client()

# ==========================================
# 📌 REQUEST MODELS
# ==========================================
class LessonNotesRequest(BaseModel):
    uid: Optional[str] = None
    grade: str
    subject: str
    topic: str
    subtopic: str

class WeeklyPlanRequest(BaseModel):
    uid: Optional[str] = None
    grade: str
    subject: str
    term: str
    school: str
    weekNumber: int
    days: int = 5
    startDate: str = "2026-01-13"

class LessonPlanRequest(BaseModel):
    uid: Optional[str] = None
    grade: str
    subject: str
    term: str
    school: str
    teacherName: str
    topic: str
    subtopic: str
    weekNumber: int
    date: str
    timeStart: str = "08:00"
    timeEnd: str = "08:40"
    boys: int = 0
    girls: int = 0
    objectives: List[str] = []

# ==========================================
# 🛠️ HELPERS
# ==========================================

def get_week_metadata(start_date_str: str | None, week_index: int):
    """
    Calculates correct Month and Date Range for the Scheme of Work.
    Output Format: Week 1 (January) (12.01.2026 - 16.01.2026)
    """
    try:
        if not start_date_str:
            base_date = datetime.now()
        else:
            base_date = datetime.strptime(start_date_str, "%Y-%m-%d")

        monday = base_date + timedelta(weeks=week_index)
        friday = monday + timedelta(days=4)

        month_name = monday.strftime("%B")
        date_range = f"({monday.strftime('%d.%m.%Y')} - {friday.strftime('%d.%m.%Y')})"
        
        return month_name, date_range, f"Week {week_index + 1} ({month_name}) {date_range}"
    except Exception as e:
        print(f"Error calculating dates: {e}")
        return "", "", f"Week {week_index + 1}"

def resolve_user_id(x_user_id: str | None, payload_uid: str | None) -> str:
    return x_user_id or payload_uid or "default_user"

def get_best_available_scheme(user_id: str, subject: str, grade: str, term: str):
    # 1. Try User Cache
    user_scheme = load_generated_scheme(user_id, subject, grade, term)
    if user_scheme: return user_scheme
    
    # 2. Global Fallback
    try:
        docs = db.collection("generated_schemes")\
            .where("subject", "==", subject)\
            .where("grade", "==", grade)\
            .where("term", "==", term)\
            .limit(1)\
            .stream()
        for doc in docs: return doc.to_dict()
    except: pass
    return None

# ==========================================
# 🚀 ROUTES
# ==========================================

@router.post("/generate-scheme", response_model=SchemeResponse)
async def generate_scheme(
    request: SchemeRequest,
    x_user_id: str = Header(None, alias="X-User-ID")
):
    user_id = resolve_user_id(x_user_id, request.uid)
    print(f"📅 GENERATING SCHEME | User: {user_id} | Subject: {request.subject}")
    
    try:
        check_and_deduct_credit(user_id)
    except Exception as e:
        raise HTTPException(status_code=403, detail=str(e))

    real_syllabus_data = load_syllabus(country="Zambia", grade=request.grade, subject=request.subject)
    print(f"📚 Syllabus Loaded: {'YES' if real_syllabus_data else 'NO'} ({len(real_syllabus_data) if real_syllabus_data else 0} topics)")

    try:
        ai_result = await generate_scheme_with_ai(
            syllabus_data=real_syllabus_data,
            subject=request.subject,
            grade=request.grade,
            term=request.term,
            num_weeks=request.weeks,
            start_date=request.startDate or "2026-01-13"
        )

        intro_data = ai_result.get("intro_info", {})
        scheme_weeks = ai_result.get("weeks", [])

        structured_rows: List[SchemeRow] = []
        
        for i in range(request.weeks):
            fallback_month, fallback_range, fallback_week_str = get_week_metadata(request.startDate, i)
            is_last_week = (i == request.weeks - 1)
            
            item = scheme_weeks[i] if i < len(scheme_weeks) else {}
            
            # 1. Handle Month and Week Display
            month_name = item.get("month", fallback_month)
            week_display = item.get("week", fallback_week_str)

            # 2. Handle References (Strict Syllabus + Page format)
            refs = item.get("references", [])
            if not refs or len(refs) == 0:
                refs = [
                    f"Syllabus Grade {request.grade} Pg {10 + i}", 
                    f"Pupil's Book Grade {request.grade} Pg {15 + (i*2)}"
                ]
            
            # 3. Handle Unit Number (Smart Extraction)
            unit_val = item.get("unit", "N/A")
            topic_text = item.get("topic", "")

            if unit_val == "N/A" or not unit_val:
                match = re.search(r"\b(\d+\.\d+)\b", topic_text)
                if match: 
                    unit_val = match.group(1)
            
            row = SchemeRow(
                month=month_name,
                week=week_display,
                unit=unit_val,  
                topic=topic_text if not is_last_week else "End of Term",
                prescribed_competences=item.get("prescribed_competences", ["Communication", "Critical Thinking"]),
                specific_competences=item.get("specific_competences", item.get("outcomes", ["Learners should be able to..."])), 
                content=item.get("content", ["Revision Content"]) if not is_last_week else ["Examinations"],
                learning_activities=item.get("learning_activities", ["Group Discussion"]),
                methods=item.get("methods", ["Learner-centered approach"]),
                assessment=item.get("assessment", ["Written Exercise"]),
                resources=item.get("resources", ["Textbook", "Charts"]),
                references=refs,
                isSpecialRow=item.get("isSpecialRow", is_last_week)
            )
            structured_rows.append(row)

        final_response = SchemeResponse(intro=intro_data, rows=structured_rows)

        save_generated_scheme(
            uid=user_id, 
            subject=request.subject, 
            grade=request.grade,
            term=request.term, 
            school_name=request.schoolName,
            data=final_response.dict() 
        )

        return final_response

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/generate-weekly-plan")
async def generate_weekly(
    request: WeeklyPlanRequest,
    x_user_id: str = Header(None, alias="X-User-ID")
):
    user_id = resolve_user_id(x_user_id, request.uid)
    print(f"📅 WEEKLY PLAN | User: {user_id} | Week {request.weekNumber}")

    # Get context from the previously generated scheme
    scheme_context = get_best_available_scheme(user_id, request.subject, request.grade, request.term)
    
    scheme_rows = []
    if scheme_context:
        if isinstance(scheme_context, list):
            scheme_rows = scheme_context
        elif isinstance(scheme_context, dict):
            scheme_rows = scheme_context.get("rows") or scheme_context.get("schemeData") or scheme_context.get("weeks") or []

    # ✅ UPDATED: Load Module
    module_data = load_module(country="Zambia", grade=request.grade, subject=request.subject)
    print(f"📦 Module Loaded: {'YES' if module_data else 'NO'}")

    try:
        check_and_deduct_credit(user_id)
        
        plan = await generate_weekly_plan_from_scheme(
            school=request.school,
            subject=request.subject,
            grade=request.grade,
            term=request.term,
            week_number=request.weekNumber,
            days=request.days,
            start_date=request.startDate,
            scheme_data=scheme_rows,
            module_data=module_data  # 👈 Passed here
        )

        save_weekly_plan(
            uid=user_id, subject=request.subject, grade=request.grade,
            term=request.term, week=request.weekNumber,school_name=request.school, data=plan
        )
        return {"data": plan}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-lesson-plan")
async def generate_lesson(
    request: LessonPlanRequest,
    x_user_id: str = Header(None, alias="X-User-ID")
):
    user_id = resolve_user_id(x_user_id, request.uid)
    print(f"📝 LESSON PLAN | User: {user_id} | Topic: {request.topic}")
    
    try:
        check_and_deduct_credit(user_id)
        attendance = {"boys": request.boys, "girls": request.girls}
        
        # ✅ UPDATED: Load Module
        module_data = load_module(country="Zambia", grade=request.grade, subject=request.subject)
        print(f"📦 Module Loaded: {'YES' if module_data else 'NO'}")

        lesson = await generate_specific_lesson_plan(
            grade=request.grade, subject=request.subject, theme=request.topic,
            subtopic=request.subtopic, objectives=request.objectives,
            date=request.date, time_start=request.timeStart, time_end=request.timeEnd,
            attendance=attendance, teacher_name=request.teacherName, school_name=request.school,
            module_data=module_data # 👈 Passed here
        )

        save_lesson_plan(
            uid=user_id, subject=request.subject, grade=request.grade,
            term=request.term, week=request.weekNumber,school_name=request.school, data=lesson
        )
        return {"data": lesson}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-lesson-notes")
async def generate_notes(
    request: LessonNotesRequest,
    x_user_id: str = Header(None, alias="X-User-ID")
):
    user_id = resolve_user_id(x_user_id, request.uid)
    print(f"📒 LESSON NOTES | User: {user_id} | {request.topic}")

    try:
        check_and_deduct_credit(user_id)
        
        # 1. Load Module
        module_data = load_module(country="Zambia", grade=request.grade, subject=request.subject)
        
        # 2. Generate Notes
        notes = await generate_lesson_notes(
            grade=request.grade,
            subject=request.subject,
            topic=request.topic,
            subtopic=request.subtopic,
            module_data=module_data
        )
        
        # 3. Save (Optional - assuming you have a save_lesson_notes function, otherwise skip)
        # save_lesson_notes(user_id, request.subject, request.grade, request.topic, notes)

        return {"data": notes}

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))