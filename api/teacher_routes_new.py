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

# Services: Content Loading
from services.syllabus_manager import load_syllabus, load_module

# Services: Database
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
    schoolId: Optional[str] = None

class WeeklyPlanRequest(BaseModel):
    uid: Optional[str] = None
    grade: str
    subject: str
    term: str
    school: str
    weekNumber: int
    days: int = 5
    startDate: str = "2026-01-13"
    schoolId: Optional[str] = None # ✅ Added

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
    schoolId: Optional[str] = None # ✅ Added

# ==========================================
# 🛠️ HELPERS
# ==========================================

def get_week_metadata(start_date_str: str | None, week_index: int):
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
    user_scheme = load_generated_scheme(user_id, subject, grade, term)
    if user_scheme: return user_scheme
    
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
    x_user_id: str = Header(None, alias="X-User-ID"),
    x_school_id: str = Header(None, alias="X-School-ID") 
):
    user_id = resolve_user_id(x_user_id, request.uid)
    school_id = x_school_id or getattr(request, "schoolId", None)

    print(f"📅 GENERATING SCHEME | User: {user_id} | School: {school_id} | Subject: {request.subject}")
    
    try:
        check_and_deduct_credit(user_id, cost=1, school_id=school_id)
    except Exception as e:
        raise HTTPException(status_code=403, detail=str(e))

    real_syllabus_data = load_syllabus(country="Zambia", grade=request.grade, subject=request.subject)

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
            
            month_name = item.get("month", fallback_month)
            week_display = item.get("week", fallback_week_str)

            refs = item.get("references", [])
            if not refs:
                refs = [f"Syllabus Grade {request.grade}", f"Pupil's Book Grade {request.grade}"]
            
            unit_val = item.get("unit", "N/A")
            topic_text = item.get("topic", "")

            if unit_val == "N/A" or not unit_val:
                match = re.search(r"\b(\d+\.\d+)\b", topic_text)
                if match: unit_val = match.group(1)
            
            row = SchemeRow(
                month=month_name,
                week=week_display,
                unit=unit_val,  
                topic=topic_text if not is_last_week else "End of Term",
                prescribed_competences=item.get("prescribed_competences", []),
                specific_competences=item.get("specific_competences", item.get("outcomes", [])), 
                content=item.get("content", []) if not is_last_week else ["Examinations"],
                learning_activities=item.get("learning_activities", []),
                methods=item.get("methods", []),
                assessment=item.get("assessment", []),
                resources=item.get("resources", []),
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
            data=final_response.dict(),
            school_id=school_id # 👈 FIX 1: Passed School ID here
        )

        return final_response

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/generate-weekly-plan")
async def generate_weekly(
    request: WeeklyPlanRequest,
    x_user_id: str = Header(None, alias="X-User-ID"),
    x_school_id: str = Header(None, alias="X-School-ID") 
):
    user_id = resolve_user_id(x_user_id, request.uid)
    school_id = x_school_id or request.schoolId 

    print(f"📅 WEEKLY PLAN | User: {user_id} | School: {school_id} | Week {request.weekNumber}")

    scheme_context = get_best_available_scheme(user_id, request.subject, request.grade, request.term)
    
    scheme_rows = []
    if scheme_context:
        if isinstance(scheme_context, list):
            scheme_rows = scheme_context
        elif isinstance(scheme_context, dict):
            scheme_rows = scheme_context.get("rows") or scheme_context.get("schemeData") or []

    module_data = load_module(country="Zambia", grade=request.grade, subject=request.subject)

    try:
        check_and_deduct_credit(user_id, cost=1, school_id=school_id)
        
        plan = await generate_weekly_plan_from_scheme(
            school=request.school,
            subject=request.subject,
            grade=request.grade,
            term=request.term,
            week_number=request.weekNumber,
            days=request.days,
            start_date=request.startDate,
            scheme_data=scheme_rows,
            module_data=module_data
        )

        save_weekly_plan(
            uid=user_id, 
            subject=request.subject, 
            grade=request.grade,
            term=request.term, 
            week=request.weekNumber, 
            school_name=request.school, 
            data=plan,
            school_id=school_id # 👈 FIX 2: Passed School ID here
        )
        return {"data": plan}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-lesson-plan")
async def generate_lesson(
    request: LessonPlanRequest,
    x_user_id: str = Header(None, alias="X-User-ID"),
    x_school_id: str = Header(None, alias="X-School-ID") 
):
    user_id = resolve_user_id(x_user_id, request.uid)
    school_id = x_school_id or request.schoolId

    print(f"📝 LESSON PLAN | User: {user_id} | School: {school_id} | Topic: {request.topic}")
    
    try:
        check_and_deduct_credit(user_id, cost=1, school_id=school_id)
        
        attendance = {"boys": request.boys, "girls": request.girls}
        module_data = load_module(country="Zambia", grade=request.grade, subject=request.subject)

        lesson = await generate_specific_lesson_plan(
            grade=request.grade, subject=request.subject, theme=request.topic,
            subtopic=request.subtopic, objectives=request.objectives,
            date=request.date, time_start=request.timeStart, time_end=request.timeEnd,
            attendance=attendance, teacher_name=request.teacherName, school_name=request.school,
            module_data=module_data
        )

        save_lesson_plan(
            uid=user_id, 
            subject=request.subject, 
            grade=request.grade,
            term=request.term, 
            week=request.weekNumber, 
            school_name=request.school, 
            data=lesson,
            school_id=school_id # 👈 FIX 3: Passed School ID here
        )
        return {"data": lesson}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))