import os
import httpx
from fastapi import APIRouter, HTTPException
from models.schemas import StartSessionRequest, QuizResult, ToolRequest # ✅ Added ToolRequest

from services.syllabus_manager import load_syllabus
from services.exam_engine import generate_exam
from services.llm_engine import (
    analyze_quiz_remediation,
    generate_realistic_image, # ✅ Added
    optimize_search_term      # ✅ Added
)

router = APIRouter()

# ==========================================
# 1. SESSION MANAGEMENT
# ==========================================
@router.post("/start-session")
async def start_session(request: StartSessionRequest):
    print(f"🚀 Starting Session for: {request.student_name} ({request.subject})")
    try:
        api_key = os.getenv("ELEVENLABS_API_KEY", "").strip()
        agent_id = os.getenv("ELEVENLABS_AGENT_ID", "").strip()
        
        if not api_key or not agent_id:
            return {"signed_url": None, "system_prompt": f"You are a tutor for {request.student_name}."}

        clean_subject = request.subject.replace(" Exam", "").strip()
        is_exam = request.mode == "exam" or "Exam" in request.subject

        if is_exam:
            system_prompt = f"You are a strict Exam Invigilator for {clean_subject}."
        else:
            try:
                syllabus = load_syllabus(request.country, request.grade, clean_subject)
            except:
                syllabus = "General Standard Curriculum"
            system_prompt = f"You are a friendly Tutor. Topic: {clean_subject}. Context: {syllabus}"

        url = f"https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id={agent_id}"
        headers = {"xi-api-key": api_key}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            if response.status_code != 200:
                return {"signed_url": None, "system_prompt": system_prompt}
            data = response.json()

        return {"signed_url": data.get("signed_url"), "system_prompt": system_prompt}
    except Exception as e:
        print(f"❌ Session Start Error: {e}")
        return {"signed_url": None, "system_prompt": "You are a helpful tutor."}

# ==========================================
# 2. TOOL HANDLER (The Fix for 404 Error)
# ==========================================
@router.post("/handle-tool")
async def handle_tool(request: ToolRequest):
    """
    Handles tools triggered by the Student AI (ElevenLabs or Chat).
    This fixes the 404 error when displaying images.
    """
    print(f"🛠️ Student Tool Triggered: {request.tool_name}")
    
    try:
        args = request.arguments or {}

        # --- A. IMAGE GENERATION ---
        if request.tool_name == "trigger_image":
            # Extract query from various possible arguments
            query = args.get("query") or args.get("goal") or args.get("topic") or "education"
            subject = request.student.subject if request.student else "General Knowledge"
            
            print(f"🖼️ Generating Image for: {query}")
            
            # 1. Optimize
            smart_query = await optimize_search_term(query, subject)
            # 2. Generate Link
            image_url = await generate_realistic_image(smart_query)
            
            # 3. Return Standard Response
            return {
                "result": {
                    "type": "image",
                    "url": image_url,
                    "caption": f""
                }
            }

        # --- B. OTHER TOOLS ---
        # Add quiz triggering or other student tools here if needed
        
        return {"result": f"Tool {request.tool_name} processed successfully."}

    except Exception as e:
        print(f"❌ Student Tool Error: {e}")
        return {"error": str(e)}

# ==========================================
# 3. EXAMS & QUIZZES
# ==========================================
@router.post("/take-exam") # Removed /api/v1 prefix as it's likely handled by the main router include
async def take_exam(subject: str, grade: str):
    exam = generate_exam(subject, grade)
    student_questions = []
    for q in exam.get("questions", []):
        safe_q = q.copy()
        safe_q.pop("answer", None)
        student_questions.append(safe_q)
    return {"exam_id": "mock_123", "questions": student_questions}

@router.post("/submit-quiz")
async def submit_quiz(result: QuizResult):
    print(f"📨 Quiz Submission: {result.topic} - Score: {result.score}")
    if not result.mistakes:
        return {"status": "success", "feedback": f"Outstanding work!", "action": "advance"}
    remediation_text = await analyze_quiz_remediation(result.topic, result.mistakes, result.grade)
    return {"status": "analyzed", "feedback": remediation_text, "action": "review"}