import re
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

# 1. Import Shared Models
from models.schemas import SchemeRequest, SchemeRow, WorksheetResponse, WorksheetRequest

# 2. Import Services
from services.llm_teacher_engine_old import (
    generate_scheme_with_ai,
    generate_weekly_plan_with_ai,
    generate_specific_lesson_plan,
    generate_structured_worksheet
)
from services.syllabus_manager import load_syllabus
from services.file_manager import (
    save_generated_scheme,
    load_generated_scheme,
    save_weekly_plan,
    save_lesson_plan,
    save_resource
)
from services.credit_manager import check_and_deduct_credit

router = APIRouter()


# ------------------------------------------------------------------
# Schemas
# ------------------------------------------------------------------
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
    schoolId: Optional[str] = None  # 👈 Added schoolId

class LessonPlanRequest(BaseModel):
    uid: str
    grade: str
    subject: str
    term: str
    school: Optional[str] = "Unknown School"
    teacherName: Optional[str] = "Class Teacher"
    topic: str
    subtopic: str
    weekNumber: int
    date: str
    timeStart: str = "08:00"
    timeEnd: str = "08:40"
    boys: Optional[int] = 0
    girls: Optional[int] = 0
    objectives: List[str] = []
    schoolId: Optional[str] = None  # 👈 Added schoolId


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------
def get_month_name(week_num: int) -> str:
    if week_num <= 4: return "January"
    if week_num <= 8: return "February"
    return "March"

def extract_week_number(week_value) -> int:
    if isinstance(week_value, int):
        return week_value
    match = re.search(r"\d+", str(week_value))
    return int(match.group()) if match else 1

def resolve_user_id(x_user_id: Optional[str], payload_uid: Optional[str]) -> str:
    return x_user_id or payload_uid or "default_user"


# ------------------------------------------------------------------
# 1. Generate Scheme of Work
# ------------------------------------------------------------------
@router.post("/generate-scheme", response_model=List[SchemeRow])
async def generate_scheme(
    request: SchemeRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    x_school_id: Optional[str] = Header(None, alias="X-School-ID")  # 👈 Added Header
):
    uid = resolve_user_id(x_user_id, request.uid)
    # Fallback to body schoolId if header missing
    school_id = x_school_id or getattr(request, "schoolId", None)

    print(f"📅 Generating Scheme: {request.subject} | Grade {request.grade} | School: {school_id}")

    # 1️⃣ Check Cache (Free if cached)
    cached = load_generated_scheme(uid, request.subject, request.grade, request.term)
    if cached:
        print("✅ Using cached scheme (No credit deduction)")
        ai_scheme = cached
    else:
        # 2️⃣ DEDUCT CREDIT (Only if generating new)
        try:
            # ✅ Updated to use school_id
            check_and_deduct_credit(uid, cost=1, school_id=school_id)
        except Exception as e:
            raise HTTPException(status_code=402, detail=str(e)) # 402 Payment Required

        # 3️⃣ Generate
        syllabus_data = load_syllabus("Zambia", request.grade, request.subject)
        try:
            ai_scheme = await generate_scheme_with_ai(
                syllabus_data=syllabus_data,
                subject=request.subject,
                grade=request.grade,
                term=request.term,
                num_weeks=request.weeks,
            )

            if isinstance(ai_scheme, dict):
                ai_scheme = ai_scheme.get("scheme", [])

            if ai_scheme:
                save_generated_scheme(
                    uid=uid,
                    subject=request.subject,
                    grade=request.grade,
                    term=request.term,
                    school_name=request.schoolName,
                    data=ai_scheme,
                )

        except Exception as e:
            print(f"❌ Scheme generation failed: {e}")
            return []

    # 4️⃣ Normalize for frontend
    rows: List[SchemeRow] = []
    for item in ai_scheme or []:
        week_num = extract_week_number(item.get("week_number") or item.get("week"))
        
        # --- 🛠️ FIX STARTS HERE: Force references to be a List ---
        raw_refs = item.get("references")
        if isinstance(raw_refs, str):
            final_refs = [raw_refs]  # Convert string to list
        elif isinstance(raw_refs, list):
            final_refs = raw_refs    # Keep as list
        else:
            final_refs = ["Syllabus Ref"] # Default
        # --------------------------------------------------------

        rows.append(
            SchemeRow(
                month=item.get("month") or get_month_name(week_num),
                week=str(item.get("week", f"Week {week_num}")),
                topic=item.get("topic", ""),
                content=item.get("content", []),
                outcomes=item.get("outcomes", []),
                references=final_refs, # ✅ Use the sanitized list
                isSpecialRow=item.get("isSpecialRow", False),
            )
        )

    return rows


# ------------------------------------------------------------------
# 2. Generate Weekly Plan
# ------------------------------------------------------------------
@router.post("/generate-weekly-plan")
async def generate_weekly_plan(
    request: WeeklyPlanRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    x_school_id: Optional[str] = Header(None, alias="X-School-ID") # 👈 Added Header
):
    uid = resolve_user_id(x_user_id, request.uid)
    school_id = x_school_id or request.schoolId

    # 1️⃣ VALIDATE TOPIC BEFORE CREDITS
    clean_topic = request.topic or request.theme
    
    # 🛑 GUARD CLAUSE: Stop here if no topic
    if not clean_topic or clean_topic.strip() == "":
        print("⚠️ ABORTING: No Topic provided. Preventing Credit Deduction.")
        raise HTTPException(
            status_code=400, 
            detail="Topic is required. Please ensure a Scheme of Work exists for this week, or retry."
        )
    
    print(f"📅 Generating Weekly Plan: {request.subject} | Week {request.weekNumber} | Topic: {clean_topic} | School: {school_id}")

    # 2️⃣ DEDUCT CREDIT (Only reached if topic exists)
    try:
        # ✅ Updated to use school_id
        check_and_deduct_credit(uid, cost=1, school_id=school_id)
    except Exception as e:
        raise HTTPException(status_code=402, detail=str(e))

    # 3️⃣ GENERATE
    try:
        plan_data = await generate_weekly_plan_with_ai(
            grade=request.grade,
            subject=request.subject,
            term=request.term,
            week_number=request.weekNumber,
            school_name=request.school,
            start_date=request.startDate,
            days_count=request.days,
            topic=clean_topic
        )

        if not plan_data:
            raise HTTPException(status_code=500, detail="AI failed to generate weekly plan")

        save_weekly_plan(
            uid=uid,
            subject=request.subject,
            grade=request.grade,
            school_name=request.school,
            term=request.term,
            week=request.weekNumber,
            data=plan_data,
        )

        return {"status": "success", "data": plan_data}

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Weekly plan error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------------
# 3. Generate Lesson Plan
# ------------------------------------------------------------------
@router.post("/generate-lesson-plan")
async def generate_lesson_plan(
    request: LessonPlanRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    x_school_id: Optional[str] = Header(None, alias="X-School-ID") # 👈 Added Header
):
    uid = resolve_user_id(x_user_id, request.uid)
    school_id = x_school_id or request.schoolId

    print(f"📝 Generating Lesson Plan: {request.subject} | {request.topic} | School: {school_id}")

    # 1️⃣ DEDUCT CREDIT
    try:
        # ✅ Updated to use school_id
        check_and_deduct_credit(uid, cost=1, school_id=school_id)
    except Exception as e:
        raise HTTPException(status_code=402, detail=str(e))

    try:
        plan_data = await generate_specific_lesson_plan(
            grade=request.grade,
            subject=request.subject,
            theme=request.topic,
            subtopic=request.subtopic,
            objectives=request.objectives,
            date=request.date,
            time_start=request.timeStart,
            time_end=request.timeEnd,
            attendance={"boys": request.boys, "girls": request.girls},
            teacher_name=request.teacherName,
            school_name=request.school
        )

        if not plan_data:
             raise HTTPException(
                status_code=500,
                detail="AI failed to generate lesson plan",
            )

        try:
            save_lesson_plan(
                uid=uid,
                subject=request.subject,
                grade=request.grade,
                data=plan_data,
                term=request.term,
                school_name=request.school,
                week=request.weekNumber,
                topic=request.topic
            )
        except Exception as save_error:
            print(f"⚠️ Could not save lesson plan to DB: {save_error}")

        return {"status": "success", "data": plan_data}

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Lesson plan error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------------
# 4. Generate Worksheet (Structured)
# ------------------------------------------------------------------
@router.post("/generate-worksheet-structured", response_model=WorksheetResponse)
async def api_generate_structured_worksheet(
    request: WorksheetRequest, 
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    x_school_id: Optional[str] = Header(None, alias="X-School-ID") # 👈 Added Header
):
    uid = resolve_user_id(x_user_id, request.uid)
    school_id = x_school_id or getattr(request, "schoolId", None)

    # Check Credits
    try: 
        # ✅ Updated to use school_id
        check_and_deduct_credit(uid, cost=1, school_id=school_id)
    except Exception as e: 
        raise HTTPException(status_code=402, detail=str(e))

    # Generate
    data = await generate_structured_worksheet(request.grade, request.subject, request.topic)
    
    # Save to Firebase
    save_resource(uid, "worksheet", data, request.dict())
    
    return data