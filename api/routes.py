import os
import httpx
import asyncio
import json
import math
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

# ==========================================
# SERVICE IMPORTS
# ==========================================
from services.llm_engine import (
    generate_scheme_with_ai,       # <--- The new intelligent scheme generator
    generate_quiz_json,
    generate_builder_json,
    generate_fast_image,
    generate_narrative_lesson, 
    get_wiki_search_term,
    analyze_quiz_remediation 
)

from services.syllabus_manager import load_syllabus
from services.wiki_engine import get_wiki_content_with_images
from services.exam_engine import generate_exam

router = APIRouter()

# ==========================================
# MODELS
# ==========================================

class StudentProfile(BaseModel):
    # This allows the frontend to send "name", but backend sees "student_name"
    student_name: str = Field(alias="name") 
    grade: str
    subject: str
    country: str = "Zambia"
    
    class Config:
        populate_by_name = True  # Critical: Allows using 'name' or 'student_name'

class StartSessionRequest(StudentProfile):
    mode: str = "tutor"

class ToolRequest(BaseModel):
    tool_name: str
    context_topic: str
    arguments: dict = {}
    student: StudentProfile 

class QuizResult(BaseModel):
    topic: str
    grade: str = "8"
    score: int
    total_questions: int
    mistakes: List[Dict[str, str]]

# --- SCHEME OF WORK MODELS ---
class SchemeRequest(BaseModel):
    schoolName: str
    term: str
    subject: str
    grade: str
    weeks: int

class SchemeRow(BaseModel):
    month: Optional[str] = None
    monthSpan: Optional[int] = None
    week: str
    weekSpan: Optional[int] = None
    topic: Optional[str] = None
    topicSpan: Optional[int] = None
    period: str
    content: List[str] = []
    outcomes: List[str] = []
    references: List[str] = []
    isSpecialRow: bool = False


# ==========================================
# 1. START SESSION
# ==========================================
@router.post("/start-session")
async def start_session(request: StartSessionRequest):
    print(f"🚀 Starting Session for: {request.student_name} ({request.subject})")
    
    try:
        api_key = os.getenv("ELEVENLABS_API_KEY", "").strip()
        agent_id = os.getenv("ELEVENLABS_AGENT_ID", "").strip()
        
        if not api_key or not agent_id:
            raise HTTPException(status_code=500, detail="Missing ElevenLabs Credentials")

        # Logic for Exam Mode vs Tutor Mode
        clean_subject = request.subject.replace(" Exam", "").strip()
        is_exam = request.mode == "exam" or "Exam" in request.subject

        if is_exam:
            system_prompt = (
                f"You are a strict Exam Invigilator for {clean_subject}. "
                f"Do not give answers. Only clarify questions. "
                f"Student: {request.student_name}. Grade: {request.grade}."
            )
        else:
            try:
                syllabus = load_syllabus(request.country, request.grade, clean_subject)
            except:
                syllabus = "General Standard Curriculum"
                
            system_prompt = (
                f"You are a friendly, encouraging Tutor. "
                f"Student: {request.student_name}. Grade: {request.grade}. "
                f"Topic: {clean_subject}. Context: {syllabus}"
            )

        # Get Signed URL
        url = f"https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id={agent_id}"
        headers = {"xi-api-key": api_key}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            if response.status_code != 200:
                print(f"❌ ElevenLabs Error: {response.text}")
                raise HTTPException(status_code=500, detail="Failed to get voice token")
            data = response.json()

        return {
            "signed_url": data["signed_url"],
            "system_prompt": system_prompt
        }

    except Exception as e:
        print(f"❌ Session Start Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# 2. TOOL HANDLER (VISUAL LESSON)
# ==========================================

@router.post("/api/v1/visual-lesson")
async def visual_lesson(topic: str):
    wiki_data = get_wiki_content_with_images(topic)

    if not wiki_data:
        raise HTTPException(status_code=404, detail="Topic not found")

    return wiki_data


# ==========================================
# 3. EXAM ENGINE
# ==========================================

@router.post("/api/v1/take-exam")
async def take_exam(subject: str, grade: str):
    exam = generate_exam(subject, grade)

    # Remove answers before sending to frontend
    student_questions = []
    for q in exam.get("questions", []):
        safe_q = q.copy()
        safe_q.pop("answer", None)
        student_questions.append(safe_q)

    return {
        "exam_id": "mock_123",
        "questions": student_questions
    }


# ==========================================
# 4. SCHEME OF WORK GENERATOR (INTELLIGENT)
# ==========================================

def get_month_name(week_num: int) -> str:
    """Helper to guess month based on week number (Standard Term 1 assumption)"""
    if week_num <= 4: return "January"
    if week_num <= 8: return "February"
    return "March"

@router.post("/generate-scheme", response_model=List[SchemeRow])
async def generate_scheme(request: SchemeRequest):
    print(f"📅 Generating Scheme (AI-Powered): {request.subject} | Grade {request.grade} | {request.term}")
    
    # 1. Load Syllabus File
    clean_subject = request.subject.lower().replace(" ", "_")
    clean_grade = request.grade.lower().replace(" ", "")
    filename = f"zambia_grade{clean_grade}_{clean_subject}.json"
    file_path = os.path.join("syllabi", filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Syllabus file not found: {filename}")

    with open(file_path, "r") as f:
        syllabus_data = json.load(f)
        topics = syllabus_data.get("topics", []) if isinstance(syllabus_data, dict) else syllabus_data

    # 2. Filter Topics for the specific Term (Basic Pre-filtering)
    total_topics = len(topics)
    chunk_size = math.ceil(total_topics / 3)
    start_index = 0
    if request.term == "Term 2": start_index = chunk_size
    elif request.term == "Term 3": start_index = chunk_size * 2
    
    term_topics = topics[start_index : start_index + chunk_size]

    # ==========================================
    # 🧠 TRY AI GENERATION FIRST
    # ==========================================
    try:
        print("   🧠 Asking AI to structure the scheme...")
        ai_scheme = await generate_scheme_with_ai(
            syllabus_data=term_topics,
            subject=request.subject,
            grade=request.grade,
            term=request.term,
            num_weeks=request.weeks
        )

        if ai_scheme and len(ai_scheme) > 0:
            # Convert AI JSON to our Pydantic Model
            structured_rows = []
            for item in ai_scheme:
                # Helper to extract digits from "Week 1" -> 1
                week_str = item.get("week", "Week 1")
                week_digits = ''.join(filter(str.isdigit, week_str))
                week_num = int(week_digits) if week_digits else 1
                
                row = SchemeRow(
                    month=get_month_name(week_num),
                    week=week_str,
                    topic=item.get("topic", ""),
                    period="1-5", # Default
                    content=item.get("content", []),
                    outcomes=item.get("outcomes", []),
                    references=item.get("references", ["Syllabus Ref"]),
                    isSpecialRow=item.get("isSpecialRow", False)
                )
                structured_rows.append(row)
            
            print("   ✅ AI Generation Successful")
            return structured_rows

    except Exception as e:
        print(f"   ⚠️ AI Failed ({str(e)}). Reverting to manual slicing.")

    # ==========================================
    # 🚜 FALLBACK: MANUAL SLICING (Old Logic)
    # ==========================================
    print("   🚜 Using Fallback Logic...")
    scheme_rows = []
    topic_index = 0
    
    for week_num in range(1, request.weeks + 1):
        if topic_index < len(term_topics):
            t = term_topics[topic_index]
            row = SchemeRow(
                month=get_month_name(week_num),
                week=f"Week {week_num}",
                topic=t.get("title") or t.get("topic_name"),
                period="1-5",
                content=t.get("content", []) if isinstance(t.get("content"), list) else [t.get("content")],
                outcomes=t.get("outcomes", []) if isinstance(t.get("outcomes"), list) else [t.get("outcomes")],
                references=["Syllabus Ref"],
                isSpecialRow=False
            )
            scheme_rows.append(row)
            topic_index += 1
        else:
            row = SchemeRow(
                month=get_month_name(week_num),
                week=f"Week {week_num}",
                isSpecialRow=True,
                content=["REVISION AND ASSESSMENTS"]
            )
            scheme_rows.append(row)

    return scheme_rows


# ==========================================
# 5. TOOL HANDLER (LLM → ACTIONS)
# ==========================================

@router.post("/handle-tool")
async def handle_tool(request: ToolRequest):
    """
    Handles tool calls triggered by the AI.
    """
    print(f"🛠️ Tool Triggered: {request.tool_name} | Student: {request.student.student_name}")
    
    try:
        args = request.arguments or {}
        goal = args.get("goal", request.context_topic)

        # 1. QUIZ GENERATION
        if request.tool_name == "trigger_quiz":
            data = await generate_quiz_json(request.context_topic, request.student.grade)
            return {"status": "success", "type": "quiz", "data": data}

        # 2. SIMULATION / BUILDER
        if request.tool_name == "trigger_simulation":
            data = await generate_builder_json(goal, request.student.grade)
            return {"status": "success", "type": "builder", "data": data}

        # 3. IMAGE RETRIEVAL
        if request.tool_name == "trigger_image":
            search_term = await get_wiki_search_term(goal)
            image_url = await generate_fast_image(search_term)

            return {
                "status": "success",
                "type": "image",
                "data": {
                    "url": image_url,
                    "caption": f"Diagram: {search_term}"
                }
            }

        raise HTTPException(status_code=400, detail=f"Unknown tool: {request.tool_name}")
    
    except Exception as e:
        print(f"❌ Tool Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# 6. QUIZ SUBMISSION & ANALYSIS
# ==========================================
@router.post("/submit-quiz")
async def submit_quiz(result: QuizResult):
    print(f"\n📨 RECEIVED QUIZ SUBMISSION:")
    print(f"   - Topic: {result.topic}")
    print(f"   - Score: {result.score}/{result.total_questions}")
    
    # LOGIC: Check for perfect score vs mistakes
    if not result.mistakes:
        print("   ✅ Perfect Score.")
        return {
            "status": "success",
            "feedback": f"Outstanding work on {result.topic}! You got everything right.",
            "action": "advance"
        }

    print(f"   ⚠️ Sending {len(result.mistakes)} mistakes to AI for review...")
    
    remediation_text = await analyze_quiz_remediation(result.topic, result.mistakes, result.grade)
    
    print(f"   🗣️ AI Feedback Generated: {remediation_text[:60]}...") 
    
    return {
        "status": "analyzed",
        "feedback": remediation_text,
        "action": "review"
    }