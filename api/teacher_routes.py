# FILE: api/teacher_routes.py
import os
import json
from datetime import datetime
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from firebase_admin import firestore # ✅ Required for DB checks

# ✅ Ensure you have these imports available
from services.file_manager import (
    load_generated_scheme, 
    save_generated_scheme, 
    load_weekly_plan, 
    save_weekly_plan, 
    save_lesson_plan
)
from services.credit_manager import check_and_deduct_credit

from services.llm_engine import (
    generate_scheme_with_ai,
    generate_weekly_plan_from_scheme,
    generate_specific_lesson_plan,
    generate_quiz_json,
    generate_builder_json,
    generate_realistic_image,
    optimize_search_term
)

router = APIRouter()
db = firestore.client() # ✅ Initialize DB client

class PlanQuery(BaseModel):
    grade: str
    subject: str
    term: str
    weekNumber: int

class SchemeRequest(BaseModel):
    schoolName: str
    term: str
    subject: str
    grade: str
    weeks: int = 12
    startDate: str = "2025-01-13"
    uid: str

# ----------------------------------
# 1. GENERATE SCHEME (With DB Check & Logs)
# ----------------------------------
@router.post("/generate-scheme")
async def generate_scheme(
    request: SchemeRequest,
    x_user_id: str = Header(None, alias="X-User-ID")
):
    uid = x_user_id or request.uid
    print(f"📘 Request: Scheme for {request.subject} Grade {request.grade} {request.term}")

    # ✅ 1. CHECK DB FOR EXISTING SCHEME
    try:
        existing_ref = db.collection("generated_schemes")\
            .where("userId", "==", uid)\
            .where("subject", "==", request.subject)\
            .where("grade", "==", request.grade)\
            .where("term", "==", request.term)\
            .limit(1).stream()
        
        for doc in existing_ref:
            print("✅ [CACHE HIT] Found existing Scheme in DB! Serving immediately.")
            return doc.to_dict().get("schemeData", [])
    except Exception as e:
        print(f"⚠️ DB Check Error: {e}")

    # 2. GENERATE NEW (CACHE MISS)
    print("🚀 [CACHE MISS] Generating new Scheme with AI...")
    
    # Check Credits
    try:
        check_and_deduct_credit(uid, 1)
    except Exception as e:
        raise HTTPException(status_code=403, detail=str(e))

    # Mock Syllabus Data (Replace with real fetch if needed)
    syllabus_data = [{"unit": "1.0", "title": "General Topic", "content": ["Topic 1", "Topic 2"], "outcomes": ["Understand Topic 1"]}] * request.weeks

    # Call AI
    scheme_data = await generate_scheme_with_ai(
        syllabus_data, 
        request.subject, 
        request.grade, 
        request.term, 
        request.weeks, 
        request.startDate
    )

    # Save to DB
    if scheme_data:
        print("💾 Saving new Scheme to DB...")
        save_generated_scheme(uid, request.subject, request.grade, request.term, scheme_data)

    return scheme_data

# ----------------------------------
# 2. GET WEEKLY PLAN (Helper)
# ----------------------------------
@router.post("/get-weekly-plan")
async def get_weekly_plan(
    query: PlanQuery, 
    x_user_id: str = Header(None, alias="X-User-ID")
):
    print(f"📂 Requesting Local Weekly Plan: {query.subject} Grade {query.grade} Week {query.weekNumber}")
    uid = x_user_id if x_user_id else "default_user"
    
    # Try loading from file/DB
    data = load_weekly_plan(uid=uid, subject=query.subject, grade=query.grade, term=query.term, week=query.weekNumber)

    if not data and uid != "default_user":
        data = load_weekly_plan(uid="default_user", subject=query.subject, grade=query.grade, term=query.term, week=query.weekNumber)

    if not data:
        raise HTTPException(status_code=404, detail="Weekly Plan file not found locally.")

    return data

# ----------------------------------
# 3. AGENT ENDPOINT (DB Checks & Logs)
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
        # GENERATE WEEKLY PLAN
        # ----------------------------------
        if request.tool_name == "generate_weekly":
            print(f"📅 Checking DB for Weekly Plan: {request.student.subject} Week {args.get('weekNumber')}")
            
            # ✅ 1. CHECK DB FIRST
            try:
                existing_ref = db.collection("generated_weekly_plans")\
                    .where("userId", "==", uid)\
                    .where("subject", "==", request.student.subject)\
                    .where("grade", "==", request.student.grade)\
                    .where("term", "==", args.get("term"))\
                    .where("weekNumber", "==", args.get("weekNumber"))\
                    .limit(1).stream()
                
                for doc in existing_ref:
                    print("✅ [CACHE HIT] Found existing Weekly Plan! Serving from cache.")
                    return {"status": "success", "type": "weekly_plan", "data": doc.to_dict().get("planData")}
            except Exception as e:
                print(f"⚠️ DB Check failed: {e}")

            # 2. GENERATE NEW
            print("🚀 [CACHE MISS] Generating new Weekly Plan...")
            try:
                check_and_deduct_credit(uid)
            except Exception as e:
                raise HTTPException(status_code=403, detail=str(e))

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
                print("💾 Saving new Weekly Plan to DB...")
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
        # GENERATE LESSON PLAN
        # ----------------------------------
        if request.tool_name == "generate_lesson": 
            print(f"📝 Checking DB for Lesson Plan: {args.get('lessonTitle')}")

            # ✅ 1. CHECK DB FIRST
            try:
                # Search by week, grade, subject, and subtopic
                existing_ref = db.collection("generated_lesson_plans")\
                    .where("userId", "==", uid)\
                    .where("subject", "==", request.student.subject)\
                    .where("grade", "==", request.student.grade)\
                    .where("term", "==", args.get("term"))\
                    .where("weekNumber", "==", args.get("weekNumber"))\
                    .where("subtopic", "==", args.get("lessonTitle"))\
                    .limit(1).stream()

                for doc in existing_ref:
                    print("✅ [CACHE HIT] Found existing Lesson Plan! Serving from cache.")
                    return {"status": "success", "type": "lesson_plan", "data": doc.to_dict().get("lessonData")}
            except Exception as e:
                print(f"⚠️ DB Check failed: {e}")

            # 2. GENERATE NEW
            print("🚀 [CACHE MISS] Generating new Lesson Plan...")
            try:
                check_and_deduct_credit(uid)
            except Exception as e:
                raise HTTPException(status_code=403, detail=str(e))

            # Prepare Inputs
            subtopic = args.get("lessonTitle") or args.get("topic") or "General Lesson"
            objectives = args.get("objectives", [])
            theme = args.get("topic") or request.student.subject
            teacher_name = args.get("name") or request.student.student_name or "Class Teacher"
            school_name = args.get("school") or "Primary School"
            target_date = args.get("startDate")

            # Try to enrich data from Weekly Plan
            weekly_data = load_weekly_plan(
                uid=uid,
                subject=request.student.subject,
                grade=request.student.grade,
                term=args.get("term", "Term 1"),
                week=args.get("weekNumber", 1)
            )

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

            # Generate
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

            # Save
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

        # ----------------------------------
        # OTHER TOOLS
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