import os
import json
import asyncio
import re
import math
from typing import List, Dict, Any, Union
from datetime import datetime, timedelta
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def get_model():
    # We will pass generation_config dynamically in the calls below
    return genai.GenerativeModel("gemini-2.5-flash")

# =====================================================
# 🛠️ HELPER: DATE CALCULATOR (With Month Name)
# =====================================================
def calculate_week_dates(start_date_str: str, week_num: int) -> Dict[str, str]:
    """
    Calculates dates and returns the specific Month name for the header.
    """
    try:
        # 1. Clean and Parse Input
        clean_date = start_date_str.replace("/", "-").replace(".", "-")
        
        try:
            start_dt = datetime.strptime(clean_date, "%Y-%m-%d")
        except ValueError:
            try:
                start_dt = datetime.strptime(clean_date, "%d-%m-%Y")
            except ValueError:
                start_dt = datetime.now()

        # 2. Calculate Range
        week_start = start_dt + timedelta(days=(week_num - 1) * 7)
        week_end = week_start + timedelta(days=4) 
        
        # 3. Format Output
        return {
            "range_display": f"{week_start.strftime('%d.%m')} - {week_end.strftime('%d.%m.%Y')}",
            "start_iso": week_start.strftime("%Y-%m-%d"),
            "end_iso": week_end.strftime("%Y-%m-%d"),
            "month": week_start.strftime("%B")  # ✅ Returns "January", "February", etc.
        }
    except Exception as e:
        print(f"⚠️ Date Calc Error: {e}")
        return {"range_display": "", "start_iso": "", "end_iso": "", "month": ""}

# =====================================================
# 🛠️ HELPER: ROBUST JSON EXTRACTION
# =====================================================
def extract_json_string(text: str) -> str:
    """
    Cleans Markdown JSON code blocks from string.
    """
    try:
        # Remove standard markdown code blocks
        clean_text = text.replace("```json", "").replace("```", "").strip()
        
        # Locate the first valid brace structure
        start_brace = clean_text.find("{")
        start_bracket = clean_text.find("[")
        
        # Determine if it starts with { or [
        if start_brace != -1 and (start_bracket == -1 or start_brace < start_bracket):
            end_idx = clean_text.rfind("}")
            if end_idx != -1:
                clean_text = clean_text[start_brace : end_idx + 1]
        elif start_bracket != -1:
            end_idx = clean_text.rfind("]")
            if end_idx != -1:
                clean_text = clean_text[start_bracket : end_idx + 1]
        
        # Escape newlines inside strings if necessary (basic fix)
        clean_text = re.sub(r'(?<!\\)\n', '\\n', clean_text)
        return clean_text
    except Exception:
        return text

# =====================================================
# 1. PROFESSIONAL SCHEME GENERATOR
# =====================================================
async def generate_scheme_with_ai(
    syllabus_data: Union[List[dict], Dict[str, Any]], 
    subject: str,
    grade: str,
    term: str,
    num_weeks: int,
    start_date: str = "2026-01-13" 
) -> Dict[str, Any]:
    
    print(f"\n📘 [Scheme Generator] Processing for {subject} Grade {grade}...")
    
    # 1. Extract Topics and Intro Data Safely
    topics_list = []
    provided_intro = {}

    if isinstance(syllabus_data, dict):
        topics_list = syllabus_data.get("topics", []) or syllabus_data.get("units", []) or []
        provided_intro = {
            "philosophy": syllabus_data.get("philosophy", ""),
            "competence_learning": syllabus_data.get("competence_learning", ""),
            "goals": syllabus_data.get("goals", [])
        }
    elif isinstance(syllabus_data, list):
        topics_list = syllabus_data
    
    # 2. TERM SPLITTING LOGIC
    total_units = len(topics_list)
    chunk_size = math.ceil(total_units / 3)
    term_lower = str(term).lower()
    
    start_idx = 0
    end_idx = chunk_size

    if "2" in term_lower:
        start_idx = chunk_size
        end_idx = chunk_size * 2
    elif "3" in term_lower:
        start_idx = chunk_size * 2
        end_idx = total_units

    term_syllabus_data = topics_list[start_idx : min(end_idx, total_units)] if total_units > 0 else []
    # Fallback if splitting resulted in empty list
    if not term_syllabus_data and total_units > 0:
        term_syllabus_data = topics_list

    # 3. PREPARE DATA SUMMARY (Extract Unit Numbers to guide the AI)
    syllabus_summary = []
    for t in term_syllabus_data:
        if isinstance(t, dict):
            unit_code = t.get("unit") or t.get("unit_number") or t.get("number") or ""
            syllabus_summary.append({
                "unit_prefix": unit_code,
                "content": t.get("subtopics") or t.get("content") or [],
                "outcomes": t.get("learning_outcomes") or t.get("specific_outcomes") or ""
            })
        elif isinstance(t, str):
            syllabus_summary.append({"unit_prefix": "", "content": t})

    model = get_model()

    # 4. PROMPT
    prompt = f"""
    Act as a Senior Head Teacher in Zambia. Create a professional Scheme of Work matching the Ministry Standard.

    DETAILS:
    - Subject: {subject}, Grade: {grade}, Term: {term}, Duration: {num_weeks} Weeks

    PROVIDED INTRO DATA:
    {json.dumps(provided_intro)}

    SYLLABUS DATA: 
    {json.dumps(syllabus_summary)}

    INSTRUCTIONS:
    1. **Front Matter (Intro)**: Write "Curriculum Philosophy", "Competence-Based Learning", and "Curriculum Goals".
    
    2. **Scheme Table (Weeks)**: Create 12 weeks.
       - **NO SEPARATE UNIT COLUMN**: Do NOT create a separate column for "Unit".
       - **TOPIC COLUMN**: You MUST strictly prefix the Topic name with the Unit Number. 
         - Example: "Unit 4.1: Sets" or "10.2: Algebra".
       - **SPECIFIC COMPETENCES**: Start with the sub-unit number if possible. 
         - Example: "4.1.1 Learners should be able to..."
       - **REFERENCES**: You MUST include the book name AND page number.
         - Example: "Syllabus Grade 4 Pg 12", "Pupil's Book Pg 23".

    OUTPUT JSON FORMAT (Strict):
    {{
      "intro_info": {{
        "philosophy": "Text...",
        "competence_learning": "Text...",
        "goals": ["Goal 1...", "Goal 2..."]
      }},
      "scheme_weeks": [
        {{
          "week": "Week 1",
          "topic": "Unit 4.1: Sets", 
          "prescribed_competences": ["Critical Thinking", "Communication"],
          "specific_competences": ["4.1.1 Learners should be able to describe sets..."],
          "content": ["Grouping objects", "Set notation"],
          "learning_activities": ["Group work on sorting..."],
          "methods": ["Demonstration", "Inquiry"],
          "assessment": ["Written Quiz"],
          "resources": ["Chart", "Real objects"],
          "references": ["Syllabus Grade 4 Pg 5", "Pupil's Book Pg 2"] 
        }}
      ]
    }}
    """
    
    response_text = ""
    try:
        # ✅ FIX: Force JSON response type to avoid parsing errors
        response = await model.generate_content_async(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        response_text = response.text
        json_str = extract_json_string(response_text)
        data = json.loads(json_str)

        if "scheme_weeks" not in data and isinstance(data, list):
            data = {"intro_info": {}, "scheme_weeks": data}
        
        cleaned_weeks = []
        raw_weeks = data.get("scheme_weeks", [])

        # 5. POST-PROCESSING (Add Month & Clean References)
        for i, item in enumerate(raw_weeks):
            week_num = i + 1
            if week_num > num_weeks: break 

            date_info = calculate_week_dates(start_date, week_num)
            
            item['week'] = f"Week {week_num} ({date_info['month']}) ({date_info['range_display']})"
            item['week_number'] = week_num
            item['date_start'] = date_info['start_iso']
            item['date_end'] = date_info['end_iso']
            
            # Default fallbacks
            item.setdefault('topic', "Unit: Topic")
            item.setdefault('prescribed_competences', ["Analytical Thinking"])
            item.setdefault('specific_competences', ["Learners should be able to..."])
            item.setdefault('learning_activities', ["Discussion"])
            item.setdefault('methods', ["Learner-Centered"])
            item.setdefault('assessment', ["Written Exercise"])
            item.setdefault('resources', ["Textbook"])
            item.setdefault('references', [f"Syllabus {subject} Grade {grade}"])

            cleaned_weeks.append(item)
            
        return {
            "intro_info": data.get("intro_info", {
                "philosophy": f"The Grade {grade} {subject} curriculum is designed using a competence-based approach.",
                "competence_learning": "Focus on skills and practical application.",
                "goals": ["To apply concepts in real life."]
            }),
            "weeks": cleaned_weeks
        }

    except Exception as e:
        print(f"❌ [Scheme Generator] Failed: {e}")
        # ✅ DEBUG: Print the raw text to see why JSON failed
        if response_text:
            print(f"❌ RAW AI RESPONSE (Partial): {response_text[:500]}...") 
        return {"intro_info": {}, "weeks": []}

# =====================================================
# 2. WEEKLY PLAN GENERATOR
# =====================================================
async def generate_weekly_plan_from_scheme(
    school: str, subject: str, grade: str, term: str, 
    week_number: int, days: int, start_date: str, scheme_data: List[dict] = None
) -> Dict[str, Any]:
    print(f"\n🗓️ [Weekly Generator] Request: Week {week_number}...")
    
    if not scheme_data: return {"days": []}
    week_key = str(week_number).strip()
    
    # 1. Find the week in the scheme data
    found_week = next((
        item for item in scheme_data 
        if str(item.get("week_number", "")).strip() == week_key or 
           str(item.get("week", "")).lower().replace("week", "").strip().split()[0] == week_key
    ), None)

    target_unit = "N/A"
    
    if found_week:
        target_topic = found_week.get("topic")
        target_content = found_week.get("content", [])
        target_outcomes = found_week.get("specific_competences", [])
        target_ref = found_week.get("references", ["Syllabus"])
        
        # 2. Extract Unit Number
        unit_match = re.search(r"(?:Unit\s*|Topic\s*)?(\d+(?:\.\d+)*)", target_topic, re.IGNORECASE)
        if unit_match:
            target_unit = unit_match.group(1)
        
    else:
        target_topic = f"Week {week_number} Content"
        target_content = []
        target_outcomes = []
        target_ref = ["Syllabus"]

    model = get_model()
    
    prompt = f"""
    Act as a Senior Teacher in Zambia. Create a Weekly Lesson Plan for {days} days.
    
    CONTEXT:
    - Subject: {subject}, Grade: {grade}, Term: {term}
    - Week: {week_number}
    - MAIN TOPIC: "{target_topic}"
    - UNIT NUMBER: "{target_unit}"
    - OUTCOMES: {json.dumps(target_outcomes)}
    - CONTENT: {json.dumps(target_content)}
    - REFS: {json.dumps(target_ref)}

    INSTRUCTIONS:
    1. **Format**: Create entries for {days} days.
    2. **Topic Column**: You MUST set the "topic" field to exactly "{target_topic}".
    3. **Specific Competence**: You MUST preserve the numbering from the outcomes provided.
    4. **Subtopic**: Break down the content into specific daily lessons.
    5. **Unit Column**: Use "{target_unit}".

    OUTPUT JSON ONLY:
    {{
      "meta": {{ "week_number": {week_number}, "term": "{term}" }},
      "days": [
        {{
          "day": "Monday", 
          "unit": "{target_unit}",
          "topic": "{target_topic}", 
          "subtopic": "Sub-topic Title", 
          "specific_competence": "4.1.1 Learners should be able to...", 
          "learning_activity": "Learners will...", 
          "resources": ["Textbook", "Chart"], 
          "strategies": ["Group Work"],
          "reference": "Syllabus Pg 12"
        }}
      ]
    }}
    """
    try:
        # ✅ FIX: Force JSON response
        response = await model.generate_content_async(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(extract_json_string(response.text))
    except Exception as e:
        print(f"❌ [Weekly Generator] Error: {e}")
        return {"days": []}

# =====================================================
# 3. DETAILED LESSON PLANNER
# =====================================================
async def generate_specific_lesson_plan(
    grade: str, subject: str, theme: str, subtopic: str, objectives: List[str],
    date: str, time_start: str, time_end: str, attendance: Dict[str, int],
    teacher_name: str = "Class Teacher", school_name: str = "Primary School"
) -> Dict[str, Any]:
    
    print(f"\n==========================================")
    print(f"🔍 DEBUG: Generating Lesson Plan")
    print(f"👤 Teacher Name: '{teacher_name}'")
    print(f"📖 Topic:        '{theme}'")
    print(f"==========================================\n")

    model = get_model()

    prompt = f"""
    Act as a professional teacher in Zambia. Create a Lesson Plan matching the standard Ministry Competence Based Curriculum (CBC) format.
    
    CONTEXT:
    - School: "{school_name}"
    - Teacher: "{teacher_name}"
    - Grade: {grade}, Subject: {subject}
    - Topic: "{theme}" (PRESERVE UNIT NUMBER if present)
    - Subtopic: "{subtopic}" (PRESERVE UNIT NUMBER if present)
    - Date: {date} | Time: {time_start}-{time_end}
    - Objectives: {json.dumps(objectives)}

    STRICT FORMATTING RULES:
    1. **NO MARKDOWN STARS**: Do NOT use bolding like **Step 1**. Use plain text only.
    2. **Lesson Progression**: Introduction (5 min), Development (30 min), Conclusion (5 min).
    
    OUTPUT JSON (Strict Structure):
    {{
      "teacherName": "{teacher_name}",
      "schoolName": "{school_name}",
      "grade": "{grade}",
      "subject": "{subject}",
      "topic": "{theme}", 
      "subtopic": "{subtopic}",
      "time": "{time_start} - {time_end}", 
      "duration": "40 minutes", 
      "enrolment": {{ "boys": {attendance.get('boys', 0)}, "girls": {attendance.get('girls', 0)}, "total": {attendance.get('boys', 0) + attendance.get('girls', 0)} }},
      
      "general_competences": ["Competence 1...", "Competence 2..."],
      "specific_competence": "Learners should be able to...", 
      "rationale": "Reason for lesson...", 
      "prerequisite": "Prior knowledge...", 
      "materials": "Teaching aids...", 
      "references": "Syllabus Grade {grade}, Pupil's Book.",
      
      "steps": [
        {{ 
            "stage": "INTRODUCTION", 
            "time": "5 min", 
            "teacherActivity": "Ask learners to...", 
            "learnerActivity": "Learners will...", 
            "method": "Q&A" 
        }}
      ],
      "homework_content": "Give a specific homework assignment here."
    }}
    """
    try:
        # ✅ FIX: Force JSON response
        response = await model.generate_content_async(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        data = json.loads(extract_json_string(response.text), strict=False)
        
        # Hardcoded Footers
        ai_homework = data.get("homework_content", "Refer to Pupil's Book.")
        data["homework"] = f"{ai_homework}\n\n" + ("." * 200)
        data["evaluation"] = "LESSON EVALUATION (indicate the weakness, strengthen and way forward )\n" + ("." * 200)

        return data

    except Exception as e:
        print(f"❌ [Lesson Generator] Failed: {e}")
        return {}