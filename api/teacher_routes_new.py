import re
import traceback
from datetime import datetime, timedelta
from fastapi import APIRouter, Header, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from firebase_admin import firestore 

# Models
from models.schemas import SchemeRequest, SchemeRow, SchemeResponse

# Services (Refactored Structure)
from services.llm_teacher_engine_new import (
    generate_scheme_with_ai, 
    generate_weekly_plan_from_scheme, 
    generate_specific_lesson_plan,
    generate_lesson_notes,
    generate_record_of_work  
)

# Services: Content Loading
from services.syllabus_manager import load_syllabus, load_module

# Services: Database
from services.file_manager import (
    save_generated_scheme, 
    load_generated_scheme, 
    save_weekly_plan, 
    save_lesson_plan,
    save_record_of_work 
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
    startDate: str = "2026-01-12"
    schoolId: Optional[str] = None
    lessonTitle: Optional[str] = None # ✅ ADDED: Subtopic Override
    topic: Optional[str] = None         
    references: Optional[str] = None
    schoolLogo: Optional[str] = None  # ✅ ADDED: Logo URL Support

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
    schoolId: Optional[str] = None
    schoolLogo: Optional[str] = None # ✅ ADDED: Logo URL Support
    # Bloom's Level from Frontend
    bloomsLevel: Optional[str] = "" 

class RecordOfWorkRequest(BaseModel): 
    uid: Optional[str] = None
    grade: str
    subject: str
    term: str
    school: str
    teacherName: str
    year: str
    weekNumber: int
    days: int
    startDate: str
    topic: str
    references: Optional[str] = None
    schoolId: Optional[str] = None
    schoolLogo: Optional[str] = None # ✅ ADDED: Logo URL Support

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
    """
    Attempts to load a generated scheme from Firestore to provide context 
    (Topics, References) to other generators.
    """
    # 1. Try file system cache (if implemented)
    user_scheme = load_generated_scheme(user_id, subject, grade, term)
    if user_scheme: return user_scheme
    
    # 2. Try Firestore Query
    try:
        docs = db.collection("generated_schemes")\
            .where("userId", "==", user_id)\
            .where("subject", "==", subject)\
            .where("grade", "==", grade)\
            .where("term", "==", term)\
            .order_by("createdAt", direction=firestore.Query.DESCENDING)\
            .limit(1)\
            .stream()
            
        for doc in docs: 
            return doc.to_dict()
    except Exception as e: 
        print(f"⚠️ Warning: Could not fetch scheme context: {e}")
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
            # Fallback refs if empty
            if not refs:
                refs = [f"Syllabus Grade {request.grade}", f"Pupil's Book Grade {request.grade}"]
            
            unit_val = item.get("unit", "N/A")
            topic_text = item.get("topic", "")

            # Try extract unit number from topic if missing
            if unit_val == "N/A" or not unit_val:
                match = re.search(r"\b(\d+\.\d+)\b", topic_text)
                if match: unit_val = match.group(1)
            
            row = SchemeRow(
                month=month_name,
                week=week_display,
                week_number=item.get("week_number", i+1), # Ensure week number is saved
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
            school_id=school_id 
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

    print(f"📅 WEEKLY PLAN | User: {user_id} | Week {request.weekNumber} | Topic: {request.topic}")

    # 1. Try to get context from Scheme
    scheme_context = get_best_available_scheme(user_id, request.subject, request.grade, request.term)
    
    scheme_rows = []
    if scheme_context:
        if isinstance(scheme_context, list):
            scheme_rows = scheme_context
        elif isinstance(scheme_context, dict):
            scheme_rows = scheme_context.get("schemeData", {}).get("rows", []) or \
                          scheme_context.get("rows", []) or \
                          scheme_context.get("weeks", [])

    # 2. Get Module Data
    module_data = load_module(country="Zambia", grade=request.grade, subject=request.subject)

    try:
        check_and_deduct_credit(user_id, cost=1, school_id=school_id)
        
        # ⚡️ ENHANCEMENT: 
        # If the user selected a topic/subtopic from the dropdown, we want the LLM 
        # to focus on THAT specific content, regardless of the 'weekNumber' digits.
        plan = await generate_weekly_plan_from_scheme(
            school=request.school,
            subject=request.subject,
            grade=request.grade,
            term=request.term,
            week_number=request.weekNumber,
            days=request.days,
            start_date=request.startDate,
            scheme_data=scheme_rows,
            module_data=module_data,
            school_logo=request.schoolLogo,
            # Pass these as overrides if your engine supports them, 
            # or ensure they are injected into the prompt context
            manual_topic=request.topic, 
            manual_subtopic=request.lessonTitle 
        )

        # 3. Inject Manual Overrides into the final plan metadata
        if request.topic:
            plan["meta"] = plan.get("meta", {})
            plan["meta"]["main_topic"] = request.topic 
        if request.lessonTitle:
            plan["meta"]["sub_topic"] = request.lessonTitle
        
        save_weekly_plan(
            uid=user_id, 
            subject=request.subject, 
            grade=request.grade, 
            term=request.term, 
            week=request.weekNumber, 
            school_name=request.school, 
            data=plan,
            school_id=school_id 
        )
        return {"data": plan}
    except Exception as e:
        import traceback
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

    # ✅ UPDATED LOG: Bloom's Level & Logo visibility
    print(f"📝 LESSON PLAN | User: {user_id} | Topic: {request.topic} | Bloom's: {request.bloomsLevel} | Logo: {'Yes' if request.schoolLogo else 'No'}")
    
    try:
        check_and_deduct_credit(user_id, cost=1, school_id=school_id)
        
        attendance = {"boys": request.boys, "girls": request.girls}
        module_data = load_module(country="Zambia", grade=request.grade, subject=request.subject)

        lesson = await generate_specific_lesson_plan(
            grade=request.grade, subject=request.subject, theme=request.topic,
            subtopic=request.subtopic, objectives=request.objectives,
            date=request.date, time_start=request.timeStart, time_end=request.timeEnd,
            attendance=attendance, teacher_name=request.teacherName, school_name=request.school,
            module_data=module_data,
            # ✅ PASS PARAM: Send Bloom's Level to the generator
            blooms_level=request.bloomsLevel,
            school_logo=request.schoolLogo # ✅ PASS LOGO
        )

        # 🛠️ FLATTEN DATA FOR FRONTEND COMPATIBILITY
        if isinstance(lesson, dict):
            if "header" in lesson and isinstance(lesson["header"], dict):
                lesson.update(lesson.pop("header"))
            if "meta" in lesson and isinstance(lesson["meta"], dict):
                lesson.update(lesson.pop("meta"))
            if "steps" in lesson and "lesson_steps" not in lesson:
                lesson["lesson_steps"] = lesson["steps"]

        # ✅ FIX: Explicitly extract topic and subtopic from the GENERATED lesson
        generated_topic = lesson.get("topic") or request.topic or "General Topic"
        generated_subtopic = lesson.get("subtopic") or request.subtopic or generated_topic

        save_lesson_plan(
            uid=user_id, 
            subject=request.subject, 
            grade=request.grade, 
            term=request.term, 
            week=request.weekNumber, 
            school_name=request.school, 
            data=lesson,
            school_id=school_id,
            topic=generated_topic 
        )
        return {"data": lesson}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# 📋 GENERATE RECORD OF WORK (NEW)
# ==========================================
@router.post("/generate-record-of-work")
async def generate_record_route(
    request: RecordOfWorkRequest,
    x_user_id: str = Header(None, alias="X-User-ID"),
    x_school_id: str = Header(None, alias="X-School-ID")
):
    user_id = resolve_user_id(x_user_id, request.uid)
    school_id = x_school_id or request.schoolId

    print(f"🔔 [API] Generating Record of Work for Week {request.weekNumber} | Logo: {'Yes' if request.schoolLogo else 'No'}")
    
    try:
        # 1. Fetch Context (Scheme of Work)
        scheme_context = get_best_available_scheme(user_id, request.subject, request.grade, request.term)
        scheme_rows = []
        
        if scheme_context:
            if isinstance(scheme_context, list):
                scheme_rows = scheme_context
            elif isinstance(scheme_context, dict):
                scheme_rows = scheme_context.get("schemeData", {}).get("rows", []) or \
                              scheme_context.get("rows", []) or \
                              scheme_context.get("weeks", [])

        # Filter for the specific week
        filtered_scheme_data = []
        target_week = request.weekNumber
        
        for row in scheme_rows:
            w_num = row.get("week_number")
            if not w_num and row.get("week"):
                 try:
                     w_num = int(str(row["week"]).lower().replace("week", "").strip().split()[0])
                 except: pass
            
            if w_num == target_week:
                filtered_scheme_data.append(row)
                break 
        
        # Fallback if Scheme data is missing
        if not filtered_scheme_data:
            print(f"⚠️ Scheme not found for Week {target_week}. Using inputs as fallback.")
            filtered_scheme_data = [{
                "week_number": target_week,
                "topic": request.topic,
                "content": ["As per syllabus"],
                "references": [request.references] if request.references else ["Syllabus"],
                "methods": ["Discussion, Teacher Exposition"],
                "resources": ["Chalkboard"]
            }]

        # 2. Generate with AI
        check_and_deduct_credit(user_id, cost=1, school_id=school_id)

        record_data = await generate_record_of_work(
            teacher_name=request.teacherName,
            school_name=request.school,
            grade=request.grade,
            subject=request.subject,
            term=request.term,
            year=request.year,
            start_date=request.startDate,
            scheme_data=filtered_scheme_data,
            school_logo=request.schoolLogo # ✅ PASS LOGO
        )

        # 3. Save to Firestore (Using Dual Save Helper)
        save_record_of_work(
            uid=user_id,
            subject=request.subject,
            grade=request.grade,
            term=request.term,
            week=request.weekNumber,
            school_name=request.school,
            topic=request.topic,
            data=record_data,
            school_id=school_id
        )
        
        return {"status": "success", "data": record_data}

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))