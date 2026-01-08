from fastapi import APIRouter
from typing import List
from models.schemas import SchemeRequest, SchemeRow

# Import Services
from services.llm_teacher_engine import generate_scheme_with_ai
from services.syllabus_manager import load_syllabus 
# ✅ Import the new File Manager
from services.file_manager import save_generated_scheme

router = APIRouter()

def get_month_name(week_num: int) -> str:
    if week_num <= 4: return "January"
    if week_num <= 8: return "February"
    return "March"

# api/teacher_routes.py

@router.post("/generate-scheme", response_model=List[SchemeRow])
async def generate_scheme(request: SchemeRequest):
    print(f"📅 Generating Scheme Request: {request.subject} | Grade {request.grade}")
    
    # 1. LOAD SYLLABUS
    real_syllabus_data = load_syllabus("Zambia", request.grade, request.subject)

    # 2. GENERATE AI SCHEME
    try:
        ai_scheme = await generate_scheme_with_ai(
            syllabus_data=real_syllabus_data, 
            subject=request.subject,
            grade=request.grade,
            term=request.term,
            num_weeks=request.weeks
        )

        # 🛑 SECURITY CHECK: Ensure ai_scheme is actually a list
        if not isinstance(ai_scheme, list):
            # If AI returned a dict like {"scheme": [...]}, try to extract it
            if isinstance(ai_scheme, dict) and "scheme" in ai_scheme:
                ai_scheme = ai_scheme["scheme"]
            else:
                ai_scheme = [] # Fallback

        if ai_scheme:
            # 3. SAVE TO FILE SYSTEM
            user_id = "default_user" 
            save_generated_scheme(
                uid=user_id,
                subject=request.subject,
                grade=request.grade,
                term=request.term,
                data=ai_scheme
            )
            print("💾 Scheme successfully persisted to storage.")

            # 4. FORMAT FOR FRONTEND
            structured_rows = []
            for item in ai_scheme:
                # ✅ THE FIX IS HERE: Force str() conversion
                # This handles cases where AI returns 1 instead of "Week 1"
                week_raw = item.get("week", "Week 1")
                week_str = str(week_raw) 

                # Now this is safe because week_str is definitely a string
                week_digits = ''.join(filter(str.isdigit, week_str))
                week_num = int(week_digits) if week_digits else 1
                
                row = SchemeRow(
                    month=get_month_name(week_num),
                    week=week_str, # Use the string version for display
                    topic=item.get("topic", ""),
                    period="1-5",
                    content=item.get("content", []),
                    outcomes=item.get("outcomes", []),
                    references=item.get("references", ["Syllabus Ref"]),
                    isSpecialRow=item.get("isSpecialRow", False)
                )
                structured_rows.append(row)
            
            return structured_rows

    except Exception as e:
        import traceback
        traceback.print_exc() # This will help us see exactly where lines fail in future
        print(f"⚠️ AI Scheme Failed: {e}")
        return []

    return []