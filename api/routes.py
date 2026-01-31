import os
import json
from datetime import datetime
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel

from models.schemas import ToolRequest
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

@router.post("/agent")
async def handle_agent_tool(
    request: ToolRequest,
    x_user_id: str = Header(None, alias="X-User-ID")
):
    print(f"🛠️ Agent Triggered: {request.tool_name}")
    
    try:
        args = request.arguments or {}
        uid = x_user_id or request.student.uid or "default_user"

        if request.tool_name == "generate_weekly":
            try:
                check_and_deduct_credit(uid)
            except Exception as e:
                raise HTTPException(status_code=403, detail=str(e))

            print(f"📂 Attempting to load saved scheme for {request.student.subject}...")
            scheme_data = load_generated_scheme(uid=uid, subject=request.student.subject, grade=request.student.grade, term=args.get("term", "Term 1"))

            plan_json = await generate_weekly_plan_from_scheme(
                school=args.get("school", "Unknown School"),
                subject=request.student.subject,
                grade=request.student.grade,
                term=args.get("term", "Term 1"),
                week_number=args.get("weekNumber", 1),
                days=args.get("days", 5),
                start_date=args.get("startDate", datetime.now().strftime("%Y-%m-%d")),
                scheme_data=scheme_data 
            )

            if plan_json and "days" in plan_json and len(plan_json["days"]) > 0:
                save_weekly_plan(uid=uid, subject=request.student.subject, grade=request.student.grade, term=args.get("term", "Term 1"), week=args.get("weekNumber", 1), data=plan_json)

            return {"status": "success", "type": "weekly_plan", "data": plan_json}


        # ----------------------------------
        # GENERATE LESSON PLAN
        # ----------------------------------
        if request.tool_name == "generate_lesson": 
            
            try:
                check_and_deduct_credit(uid)
            except Exception as e:
                raise HTTPException(status_code=403, detail=str(e))

            print(f"📝 Requesting Lesson Plan...")

            # ✅ 1. FETCH REAL TEACHER NAME FROM FIREBASE
            db_teacher_name = "Class Teacher"
            if uid != "default_user":
                user_doc = db.collection("users").document(uid).get()
                if user_doc.exists:
                    db_teacher_name = user_doc.to_dict().get("name", "Class Teacher")
            
            teacher_name = db_teacher_name 
            
            school_name = args.get("school")
            if not school_name or school_name == "Unknown School":
                school_name = "Primary School"

            subtopic = args.get("lessonTitle") or args.get("topic") or "General Lesson"
            objectives = args.get("objectives", [])
            theme = args.get("topic") or request.student.subject
            target_date = args.get("startDate")

            weekly_data = load_weekly_plan(
                uid=uid,
                subject=request.student.subject,
                grade=request.student.grade,
                term=args.get("term", "Term 1"),
                week=args.get("weekNumber", 1)
            )

            if not weekly_data and uid != "default_user":
                 weekly_data = load_weekly_plan(uid="default_user", subject=request.student.subject, grade=request.student.grade, term=args.get("term", "Term 1"), week=args.get("weekNumber", 1))

            if weekly_data:
                if "meta" in weekly_data and "main_topic" in weekly_data["meta"]:
                    theme = weekly_data["meta"]["main_topic"]

                if "days" in weekly_data:
                    found_day = next((d for d in weekly_data["days"] if d.get("date") == target_date), None)
                    if found_day:
                        if not subtopic or subtopic == "General Lesson":
                            subtopic = found_day.get("subtopic", subtopic)
                        if not objectives:
                            objectives = found_day.get("objectives", objectives)

            attendance = {"boys": args.get("boys", 0), "girls": args.get("girls", 0)}
            
            lesson_json = await generate_specific_lesson_plan(
                grade=request.student.grade,
                subject=request.student.subject,
                theme=theme,
                subtopic=subtopic,
                objectives=objectives,
                date=target_date or "Today",
                time_start=args.get("startTime", "08:00"),
                time_end=args.get("endTime", "08:40"),
                attendance=attendance,
                teacher_name=teacher_name, 
                school_name=school_name    
            )

            if lesson_json:
                print("💾 Saving new Lesson Plan to DB...")
                save_lesson_plan(
                    uid=uid,
                    subject=request.student.subject,
                    grade=request.student.grade,
                    term=args.get("term", "Term 1"),
                    week=args.get("weekNumber", 1),
                    data=lesson_json
                )
            
            return {"status": "success", "type": "lesson_plan", "data": lesson_json}

        if request.tool_name not in ["generate_weekly", "generate_lesson", "trigger_quiz", "trigger_simulation", "trigger_image"]:
             raise HTTPException(status_code=400, detail=f"Unknown tool: {request.tool_name}")

        return {"status": "error", "message": "Tool not handled"} 

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"❌ Agent Tool Error: {e}")
        return {"status": "error", "message": str(e)}