import os
import json
import asyncio
import re
import math
from typing import List, Optional, Dict, Any
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
    """
    try:
        if not start_date_str:
             start_dt = datetime.now()
        else:
            clean_date = start_date_str.replace("/", "-").replace(".", "-")
            try:
                start_dt = datetime.strptime(clean_date, "%Y-%m-%d")
            except ValueError:
                try:
                    start_dt = datetime.strptime(clean_date, "%d-%m-%Y")
                except ValueError:
                    start_dt = datetime.now()

        week_start = start_dt + timedelta(days=(week_num - 1) * 7)
        week_end = week_start + timedelta(days=4) 
        
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
    
    if not syllabus_data or not isinstance(syllabus_data, list):
        print(f"⚠️ [Scheme Generator] CRITICAL: No syllabus data found. AI will brainstorm.")
        syllabus_data = [] 
    
    # 2. TERM SPLITTING LOGIC (simplified for brevity, keep your full logic if needed)
    total_units = len(syllabus_data)
    chunk_size = math.ceil(total_units / 3)
    # ... (Your existing splitting logic is fine, keeping it minimal here) ...
    
    model = get_model()

    # 3. PREPARE DATA SUMMARY
    syllabus_summary = []
    for t in syllabus_data[:10]: # Limit context to avoid token overflow
        if isinstance(t, dict):
            unit_code = t.get("unit") or t.get("title") or "Unknown"
            syllabus_summary.append({"unit": unit_code, "content": t.get("subtopics", [])})

    # 4. PROMPT
    prompt = f"""
    Act as a Senior Head Teacher at a top Zambian School. Create a professional Scheme of Work.
    DETAILS: Subject: {subject}, Grade: {grade}, Term: {term}, Duration: {num_weeks} Weeks
    
    SYLLABUS DATA (Context): {json.dumps(syllabus_summary)}

    OUTPUT FORMAT (JSON List):
    [
      {{
        "week": "Week 1",
        "topic": "Topic Title",
        "content": ["Point 1...", "Point 2..."],
        "outcomes": ["Learners should be able to..."],
        "references": ["Syllabus Unit 1", "Pupil's Book"] 
      }}
    ]
    """
    try:
        response = await model.generate_content_async(prompt)
        json_str = extract_json_string(response.text)
        data = json.loads(json_str)

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
            
            cleaned_data.append(item)

        return cleaned_data

    except Exception as e:
        print(f"❌ [Scheme Generator] Failed: {e}")
        return []


# =====================================================
# 2. WEEKLY PLAN GENERATOR (UPDATED)
# =====================================================
async def generate_weekly_plan_with_ai(
    grade: str, 
    subject: str, 
    term: str, 
    week_number: int, 
    school_name: str = "Unknown School", 
    start_date: Optional[str] = None,
    days_count: int = 5  # 👈 Added parameter to control days
) -> Dict[str, Any]:
    """
    Generates a weekly forecast for the Old Curriculum.
    - Adapts to the specific number of days requested.
    - Enforces varied Teaching/Learning Aids.
    """
    print(f"🧠 AI Generating Weekly Plan | Subject: {subject} | Grade: {grade} | Week: {week_number} | Days: {days_count}")

    model = get_model()

    # 1. Construct the Prompt
    prompt = f"""
    Act as a Senior Teacher in Zambia. Create a Weekly Lesson Forecast (Old Curriculum).
    
    DETAILS:
    - School: {school_name}
    - Grade: {grade}
    - Subject: {subject}
    - Term: {term}
    - Week: {week_number}
    - Duration: {days_count} Days
    - Start Date: {start_date if start_date else "Monday of the week"}

    CRITICAL INSTRUCTIONS:
    1. **Days:** Generate exactly {days_count} entries (e.g., if 3 days, only generate Monday, Tuesday, Wednesday).
    2. **Resources (Learning Aids):** Do NOT just repeat "Textbook" or "Chart". You MUST vary them based on the subtopic.
       - Use specific real-world objects where possible (e.g., "Soil samples", "Grocery receipts", "Clock face", "Empty bottles", "Flashcards", "Newspaper clippings").
    3. **Content:** Ensure the subtopics progress logically from Day 1 to Day {days_count}.

    STRICT JSON OUTPUT FORMAT:
    {{
      "meta": {{
        "school": "{school_name}",
        "grade": "{grade}",
        "subject": "{subject}",
        "term": "{term}",
        "week": {week_number},
        "main_topic": "The main topic for this week"
      }},
      "days": [
        {{
          "day": "Monday",
          "date": "YYYY-MM-DD",
          "subtopic": "Specific subtopic for Day 1",
          "objectives": ["Learner should be able to define X", "Learner should be able to list Y"],
          "activities": "Teacher explains X using... Learners write notes.",
          "resources": "Specific Aid (e.g. Real Leaf)"
        }},
        {{
          "day": "Tuesday",
          "date": "YYYY-MM-DD",
          "subtopic": "Specific subtopic for Day 2",
          "objectives": ["Objective 1"],
          "activities": "Class discussion...",
          "resources": "Different Aid (e.g. Video Clip)"
        }}
        ... (Repeat for exactly {days_count} days)
      ]
    }}
    """

    # 2. Call AI & Parse
    try:
        response = await model.generate_content_async(prompt, generation_config={"response_mime_type": "application/json"})
        json_str = extract_json_string(response.text)
        return json.loads(json_str)
    except Exception as e:
        print(f"❌ Weekly Plan Generation Failed: {e}")
        # Return a safe fallback to prevent frontend crash
        return {
            "meta": {"school": school_name, "error": True},
            "days": []
        }

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
      "specific": "Brief statement of the skill developed.", 
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
        return {}


async def generate_structured_worksheet(grade: str, subject: str, topic: str):
    model = get_model()
    
    prompt = f"""
    Act as a professional teacher. Create a structured worksheet for Grade {grade} {subject} on the topic: "{topic}".
    
    You MUST output a JSON object with a list of "blocks". 
    Include at least one "matching" block and one "svg_diagram" (if applicable to the topic).

    --- BLOCK TYPES & FORMATS ---
    
    1. "mcq":
       content: {{ "question": "...", "options": ["A", "B", "C"], "correct": "A" }}
       
    2. "matching":
       content: [
         {{ "left": "Item 1", "right": "Match 1" }},
         {{ "left": "Item 2", "right": "Match 2" }}
       ]
       
    3. "svg_diagram":
       instruction: "Label the diagram / Color the shape"
       content: "<svg viewBox='0 0 100 100'>...simple primitives...</svg>" 
       (KEEP SVGs VERY SIMPLE: Squares, Circles, Lines, Triangles. No complex art.)

    4. "fill_blank":
       content: "The capital of Zambia is ______."
       answer_key: "Lusaka"

    --- OUTPUT FORMAT ---
    {{
      "title": "Worksheet: {topic}",
      "grade": "{grade}",
      "blocks": [
         {{ "id": 1, "type": "mcq", "instruction": "Choose the correct answer", "content": {{...}}, "answer_key": "A" }},
         {{ "id": 2, "type": "svg_diagram", "instruction": "Color 1/2 of the shape", "content": "<svg>...</svg>", "answer_key": "Visual Check" }}
      ]
    }}
    """
    
    try:
        response = await model.generate_content_async(prompt, generation_config={"response_mime_type": "application/json"})
        return json.loads(extract_json_string(response.text))
    except Exception as e:
        print(f"❌ Worksheet Generation Error: {e}")
        # Return a fallback empty structure to prevent crash
        return {"title": topic, "grade": grade, "blocks": []}