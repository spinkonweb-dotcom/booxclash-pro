import os
import json
import asyncio
import re
import math
from typing import List, Dict, Any
from datetime import datetime, timedelta
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def get_model():
    return genai.GenerativeModel("gemini-2.5-flash")

# =====================================================
# 🛠️ HELPER: DATE CALCULATOR (Updated & Robust)
# =====================================================
def calculate_week_dates(start_date_str: str, week_num: int) -> Dict[str, str]:
    """
    Calculates dates server-side to prevent Frontend NaN errors.
    Returns a dictionary with formatted display strings, raw ISO dates, and the Month name.
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
            "range_display": f"({week_start.strftime('%d.%m.%Y')} - {week_end.strftime('%d.%m.%Y')})",
            "start_iso": week_start.strftime("%Y-%m-%d"),
            "end_iso": week_end.strftime("%Y-%m-%d"),
            "month": week_start.strftime("%B") 
        }
    except Exception as e:
        print(f"⚠️ Date Calc Error: {e}")
        return {"range_display": "", "start_iso": "", "end_iso": "", "month": ""}

# =====================================================
# 🛠️ HELPER: ROBUST JSON EXTRACTION
# =====================================================
def extract_json_string(text: str) -> str:
    try:
        clean_text = text.replace("```json", "").replace("```", "").strip()
        start_brace = clean_text.find("{")
        start_bracket = clean_text.find("[")
        
        if start_bracket != -1 and (start_brace == -1 or start_bracket < start_brace):
            end_idx = clean_text.rfind("]")
            if end_idx != -1:
                clean_text = clean_text[start_bracket : end_idx + 1]
        elif start_brace != -1:
            end_idx = clean_text.rfind("}")
            if end_idx != -1:
                clean_text = clean_text[start_brace : end_idx + 1]
        
        clean_text = re.sub(r'(?<!\\)\n', '\\n', clean_text)
        return clean_text
    except Exception:
        return text

# =====================================================
# 1. PROFESSIONAL SCHEME GENERATOR
# =====================================================
async def generate_scheme_with_ai(
    syllabus_data: List[dict], 
    subject: str,
    grade: str,
    term: str,
    num_weeks: int,
    start_date: str = "2026-01-13" 
) -> List[dict]:
    
    print(f"\n📘 [Scheme Generator] Processing Professional Request for {subject} Grade {grade}...")
    
    # 1. Handle Missing Data Safely
    if not syllabus_data or not isinstance(syllabus_data, list):
        print(f"⚠️ [Scheme Generator] CRITICAL: No syllabus data found. AI will brainstorm.")
        syllabus_data = [] 
    
    # 2. TERM SPLITTING LOGIC
    total_units = len(syllabus_data)
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

    # Strict Slicing
    if total_units > 0:
        term_syllabus_data = syllabus_data[start_idx : min(end_idx, total_units)]
        if not term_syllabus_data:
            term_syllabus_data = syllabus_data
    else:
        term_syllabus_data = []

    model = get_model()

    # 3. PREPARE DATA SUMMARY
    syllabus_summary = []
    for t in term_syllabus_data:
        if isinstance(t, dict):
            unit_code = t.get("unit") or t.get("title") or "Unknown"
            page_ref = t.get("page") or t.get("page_number") or "" 
            
            syllabus_summary.append({
                "unit": unit_code,
                "page": page_ref, 
                "content": t.get("subtopics") or t.get("content") or [],
                "outcomes": t.get("learning_outcomes") or t.get("outcomes") or ""
            })
        elif isinstance(t, str):
            syllabus_summary.append({"unit": t})

    # 4. PROMPT
    prompt = f"""
    Act as a Senior Head Teacher at a top Zambian School. Create a professional Scheme of Work.

    DETAILS:
    - Subject: {subject}, Grade: {grade}, Term: {term}, Duration: {num_weeks} Weeks

    SYLLABUS DATA (STRICT): 
    {json.dumps(syllabus_summary)}

    INSTRUCTIONS:
    1. **Dates**: DO NOT calculate dates. Just output "Week 1", "Week 2", etc.
    2. **Content Details (STRICT)**: 
        - Content MUST be limited to **EXACTLY 3 key points**.
        - NO asterisks (*), bolding, or symbols. Plain text only.
    3. **Outcomes (STRICT)**:
        - Provide **EXACTLY TWO** specific outcomes.
        - Start with "Learners should be able to...".
    4. **References (CRITICAL)**:
        - You MUST use the "unit" and "page" provided in the SYLLABUS DATA above.
        - Format: "Syllabus Unit [X] Pg [Y]".
        - Also include: "Pupil's Book".
    5. **Revision**: Week {num_weeks} MUST be "Revision and Assessments".

    OUTPUT FORMAT:
    [
      {{
        "week": "Week 1",
        "topic": "Topic Title",
        "content": ["Point 1...", "Point 2..."],
        "outcomes": ["Learners should be able to..."],
        "references": ["Syllabus Unit 1 Pg 5", "Pupil's Book"] 
      }}
    ]
    """
    try:
        response = await model.generate_content_async(prompt)
        json_str = extract_json_string(response.text)
        data = json.loads(json_str)

        if isinstance(data, dict):
            for key in ["scheme", "weeks", "plan", "data"]:
                if key in data and isinstance(data[key], list):
                    data = data[key]
                    break
        
        if not isinstance(data, list): return []

        # 5. POST-PROCESSING
        cleaned_data = []
        for i, item in enumerate(data):
            week_num = i + 1
            if week_num > num_weeks: break 

            date_info = calculate_week_dates(start_date, week_num)
            
            item['month'] = date_info['month'] 
            item['week'] = f"Week {week_num} {date_info['range_display']}"
            item['week_number'] = week_num
            item['date_start'] = date_info['start_iso']
            item['date_end'] = date_info['end_iso']
            
            if 'outcomes' not in item or not item['outcomes']:
                 item['outcomes'] = [f"Learners should be able to understand {item.get('topic', 'the topic')}."]

            cleaned_data.append(item)

        return cleaned_data

    except Exception as e:
        print(f"❌ [Scheme Generator] Failed: {e}")
        return []

# =====================================================
# 2. WEEKLY PLAN GENERATOR
# =====================================================
async def generate_weekly_plan_from_scheme(
    school: str, subject: str, grade: str, term: str, 
    week_number: int, days: int, start_date: str, scheme_data: List[dict] = None
) -> Dict[str, Any]:
    print(f"\n🗓️ [Weekly Generator] Request: Week {week_number}, {term} for {subject}.")
    
    if not scheme_data: return {"days": []}

    week_key = str(week_number).strip()
    found_week = next((
        item for item in scheme_data 
        if str(item.get("week", "")).lower().replace("week", "").replace("(", "").split()[0].lstrip("0") == week_key
    ), None)

    if found_week:
        target_topic = found_week.get("topic")
        target_content = found_week.get("content", [])
        target_outcomes = found_week.get("outcomes", [])
    else:
        target_topic = f"Week {week_number} (See Scheme)"
        target_content = []
        target_outcomes = []

    model = get_model()
    prompt = f"""
    Act as a Senior Teacher in Zambia. Create a Weekly Lesson Plan.
    School: {school}, Subject: {subject}, Grade: {grade}, Term: {term}
    Week: {week_number}, Start Date: {start_date}, Days: {days}
    
    SCHEME CONTEXT:
    Topic: {target_topic}
    Content: {json.dumps(target_content)}
    Outcomes: {json.dumps(target_outcomes)}

    OUTPUT JSON ONLY:
    {{
      "meta": {{ "week_number": {week_number}, "main_topic": "{target_topic}", "term": "{term}" }},
      "days": [
        {{
          "day": "Monday", "date": "YYYY-MM-DD",
          "subtopic": "Sub-topic", 
          "objectives": ["Learner should be able to..."], 
          "teacher_activity": "Explain...", "learner_activity": "Listen...", 
          "materials": ["Textbook"], "assignment": "Exercise 1"
        }}
      ]
    }}
    """
    try:
        response = await model.generate_content_async(prompt)
        return json.loads(extract_json_string(response.text))
    except: return {"days": []}

# =====================================================
# 3. DETAILED LESSON PLANNER (Strict Learner-Centered)
# =====================================================
async def generate_specific_lesson_plan(
    grade: str,
    subject: str,
    theme: str,
    subtopic: str,
    objectives: List[str],
    date: str,
    time_start: str,
    time_end: str,
    attendance: Dict[str, int],
    teacher_name: str = "Class Teacher",
    school_name: str = "Primary School"
) -> Dict[str, Any]:
    print(f"\n📝 [Lesson Generator] Preparing Plan for {teacher_name} at {school_name}...")
    model = get_model()

    # ✅ UPDATED PROMPT: STRICTLY ENFORCES REAL NAMES & BANS PLACEHOLDERS
    prompt = f"""
    Act as a professional modern teacher in Zambia. Create a Lesson Plan.
    
    CONTEXT:
    - Teacher Name: "{teacher_name}" (STRICT RULE: Use this exact name. DO NOT use [Your Name] or [Teacher Name])
    - School Name: "{school_name}" (STRICT RULE: Use this exact name. DO NOT use [School Name])
    - Grade: {grade}, Subject: {subject}
    - Topic: {theme}, Sub-topic: {subtopic}
    - Date: {date}, Time: {time_start}-{time_end}
    - Objectives: {json.dumps(objectives)}

    STRICT METHODOLOGY RULES (LEARNER-CENTERED):
    1. **Role**: The teacher is a **FACILITATOR**, not a lecturer.
    2. **Methods**: Use ONLY learner-centered methods (e.g., Think-Pair-Share, Group Inquiry).
    3. **Teacher Activity**: Use verbs like "Facilitate", "Guide", "Monitor".
    
    STRICT CONTENT RULES:
    1. **Format**: Use **BULLET POINTS (•)**.
    2. **No Placeholders**: If data is missing, INFER realistic details. NEVER output brackets like [ ].
    3. **JSON Safety**: Use \\n for newlines inside strings.

    OUTPUT JSON (Strict structure):
    {{
      "teacherName": "{teacher_name}",
      "schoolName": "{school_name}",
      "topic": "{theme}", 
      "subtopic": "{subtopic}",
      "time": "{time_start} - {time_end}", 
      "duration": "40 minutes", 
      "rationale": "Brief sentence on why this lesson is important.", 
      "competence": "Brief statement of the skill developed.", 
      "standard": "Relevant syllabus outcome.", 
      "prerequisite": "Brief list of prior knowledge needed.", 
      "materials": "List of teaching aids.", 
      "references": "Zambian Syllabus Grade {grade}, Pupil's Book, Teacher's Guide.",
      "enrolment": {{ "boys": {attendance.get('boys', 0)}, "girls": {attendance.get('girls', 0)}, "total": {attendance.get('boys', 0) + attendance.get('girls', 0)} }},
      "steps": [
        {{ 
            "stage": "INTRODUCTION", 
            "time": "5 min", 
            "teacherActivity": "• Prompt learners to recall...", 
            "learnerActivity": "• Brainstorm answers...", 
            "method": "Think-Pair-Share" 
        }},
        {{ 
            "stage": "DEVELOPMENT", 
            "time": "30 min", 
            "teacherActivity": "• Organize learners...", 
            "learnerActivity": "• Work in groups...", 
            "method": "Group Inquiry" 
        }},
        {{ 
            "stage": "CONCLUSION", 
            "time": "5 min", 
            "teacherActivity": "• Facilitate reflection...", 
            "learnerActivity": "• Reflect on learning...", 
            "method": "Class Discussion" 
        }}
      ]
    }}
    """

    try:
        response = await model.generate_content_async(prompt)
        json_str = extract_json_string(response.text)
        return json.loads(json_str, strict=False)
    except Exception as e:
        print(f"❌ [Lesson Generator] Failed: {e}")
<<<<<<< HEAD
        return {}
=======
        return {}

# =====================================================
# 4. STUDENT TOOLS
# =====================================================
async def generate_quiz_json(topic: str, grade: str) -> Dict[str, Any]:
    model = get_model()
    try:
        response = await model.generate_content_async(f"Quiz for {topic} Grade {grade}. JSON: {{'questions':[]}}")
        return json.loads(extract_json_string(response.text))
    except: return {"questions": []}

async def generate_builder_json(goal: str, grade: str) -> Dict[str, Any]:
    return {}

async def generate_realistic_image(query: str) -> str:
    return f"https://image.pollinations.ai/prompt/{re.sub(r'[^a-zA-Z0-9 ]', '', query)}?width=800&height=600&model=flux&nologo=true"

async def optimize_search_term(user_query: str, subject: str) -> str:
    model = get_model()
    try:
        response = await model.generate_content_async(f"Return one searchable noun for '{user_query}' in {subject}.")
        return response.text.strip()
    except: return user_query
>>>>>>> 6731a54bc201c7f32c28e284b3a3042a961c5125
