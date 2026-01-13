import os
import json
from datetime import datetime
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel

from models.schemas import ToolRequest
from api.teacher_routes import router as teacher_router
from api.student_routes import router as student_router
from services.file_manager import load_generated_scheme, save_weekly_plan, load_weekly_plan
from services.credit_manager import check_and_deduct_credit # ✅ IMPORTED NEW SERVICE

from services.llm_engine import (
    generate_weekly_plan_from_scheme,
    generate_specific_lesson_plan,
    generate_quiz_json,
    generate_builder_json,
    generate_realistic_image,
    optimize_search_term
)

router = APIRouter()
# router.include_router(teacher_router) 
# router.include_router(student_router) 

class PlanQuery(BaseModel):
    grade: str
    subject: str
    term: str
    weekNumber: int

# ----------------------------------
# GET WEEKLY PLAN (No Credit Cost)
# ----------------------------------
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


# ----------------------------------
# AGENT ENDPOINT (Enforced Credits)
# ----------------------------------
@router.post("/agent")
async def handle_agent_tool(
    request: ToolRequest,
    x_user_id: str = Header(None, alias="X-User-ID")
):
    print(f"🛠️ Agent Triggered: {request.tool_name} | User: {request.student.student_name}")
    
    try:
        args = request.arguments or {}
        uid = x_user_id or request.student.uid or "default_user"

        # ----------------------------------
        # GENERATE WEEKLY PLAN (COSTS 1 CREDIT)
        # ----------------------------------
        if request.tool_name == "generate_weekly":
            
            # 💰 CHECK CREDITS
            try:
                check_and_deduct_credit(uid)
            except Exception as e:
                raise HTTPException(status_code=403, detail=str(e))

            print(f"📂 Attempting to load saved scheme for {request.student.subject}...")
            
            scheme_data = load_generated_scheme(
                uid=uid,
                subject=request.student.subject,
                grade=request.student.grade,
                term=args.get("term", "Term 1")
            )

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
                save_weekly_plan(
                    uid=uid, 
                    subject=request.student.subject, 
                    grade=request.student.grade, 
                    term=args.get("term", "Term 1"), 
                    week=args.get("weekNumber", 1), 
                    data=plan_json
                )

            return {"status": "success", "type": "weekly_plan", "data": plan_json}

        # ----------------------------------
        # GENERATE LESSON PLAN (COSTS 1 CREDIT)
        # ----------------------------------
        if request.tool_name == "generate_lesson": 
            
            # 💰 CHECK CREDITS
            try:
                check_and_deduct_credit(uid)
            except Exception as e:
                raise HTTPException(status_code=403, detail=str(e))

            print(f"📝 Requesting Lesson Plan...")

            # 1. Defaults
            subtopic = args.get("lessonTitle") or args.get("topic") or "General Lesson"
            objectives = args.get("objectives", [])
            theme = args.get("topic") or request.student.subject
            teacher_name = args.get("name") or request.student.student_name or "Class Teacher"
            school_name = args.get("school") or "Primary School"
            target_date = args.get("startDate")

            # 2. Attempt Load Weekly Plan
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

            # 3. Generate
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
            return {"status": "success", "type": "lesson_plan", "data": lesson_json}

        # ----------------------------------
        # OTHER TOOLS (FREE)
        # ----------------------------------
        if request.tool_name == "trigger_quiz":
             topic = args.get("topic", "General Knowledge")
             quiz_data = await generate_quiz_json(topic, request.student.grade)
             return {"status": "success", "type": "quiz", "data": quiz_data}

        if request.tool_name == "trigger_simulation":
             topic = args.get("topic", "Science")
             sim_data = await generate_builder_json(topic, request.student.grade)
             return {"status": "success", "type": "simulation", "data": sim_data}

        if request.tool_name == "trigger_image":
             raw_prompt = args.get("prompt", "")
             optimized_prompt = await optimize_search_term(raw_prompt, request.student.grade)
             image_url = await generate_realistic_image(optimized_prompt)
             return { "status": "success", "type": "image", "data": {"url": image_url, "prompt": optimized_prompt} }

        if request.tool_name not in ["generate_weekly", "generate_lesson", "trigger_quiz", "trigger_simulation", "trigger_image"]:
             raise HTTPException(status_code=400, detail=f"Unknown tool: {request.tool_name}")

        return {"status": "error", "message": "Tool not handled"} 

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"❌ Agent Tool Error: {e}")
        return {"status": "error", "message": str(e)}