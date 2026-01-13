# FILE: api/teacher_routes.py
import re # ✅ Added for regex matching
from fastapi import APIRouter, Header
from typing import List
from models.schemas import SchemeRequest, SchemeRow

# Import Services
from services.llm_teacher_engine import generate_scheme_with_ai
from services.syllabus_manager import load_syllabus 
from services.file_manager import save_generated_scheme, load_generated_scheme

router = APIRouter()

def get_month_name(week_num: int) -> str:
    """Fallback month calculator based on Week Number"""
    if week_num <= 4: return "January"
    if week_num <= 8: return "February"
    return "March"

@router.post("/generate-scheme", response_model=List[SchemeRow])
async def generate_scheme(
    request: SchemeRequest,
    x_user_id: str = Header(None, alias="X-User-ID")
):
    print(f"📅 Generating Scheme Request: {request.subject} | Grade {request.grade}")
    
    uid = x_user_id or request.uid or "default_user"

    # 1. CHECK DATABASE FIRST (Save Credits)
    cached_data = load_generated_scheme(uid, request.subject, request.grade, request.term)
    if cached_data:
        print("✅ Found in DB. Using cached scheme.")
        ai_scheme = cached_data # Use cached data
        # We skip the AI generation step but still run the formatting logic below
    else:
        # 2. LOAD SYLLABUS & GENERATE NEW
        real_syllabus_data = load_syllabus("Zambia", request.grade, request.subject)

        try:
            ai_scheme = await generate_scheme_with_ai(
                syllabus_data=real_syllabus_data, 
                subject=request.subject,
                grade=request.grade,
                term=request.term,
                num_weeks=request.weeks
            )
            
            # Security: Extract list if nested
            if isinstance(ai_scheme, dict) and "scheme" in ai_scheme:
                ai_scheme = ai_scheme["scheme"]
            
            # Save to DB if valid
            if ai_scheme:
                save_generated_scheme(
                    uid=uid,
                    subject=request.subject,
                    grade=request.grade,
                    term=request.term,
                    data=ai_scheme
                )
        except Exception as e:
            print(f"⚠️ AI Generation Failed: {e}")
            return []

    # 3. FORMAT FOR FRONTEND (Corrected Indentation)
    if ai_scheme:
        structured_rows = []
        for item in ai_scheme:
            week_raw = item.get("week", "Week 1")
            week_str = str(week_raw) 

            # ✅ FIX 1: Use the pre-calculated integer from the engine
            week_num = item.get("week_number") 
            
            # Fallback if the engine didn't provide the number
            if not week_num:
                match = re.search(r'\d+', week_str)
                week_num = int(match.group()) if match else 1

            # ✅ FIX 2: Prioritize Engine Month, fallback to Function
            month_name = item.get("month")
            if not month_name:
                month_name = get_month_name(week_num)

            row = SchemeRow(
                month=month_name,
                week=week_str, 
                topic=item.get("topic", ""),
                # period="1-5", 
                content=item.get("content", []),
                outcomes=item.get("outcomes", []),
                references=item.get("references", ["Syllabus Ref"]),
                isSpecialRow=item.get("isSpecialRow", False)
            )
            structured_rows.append(row)
        
        return structured_rows

    return []