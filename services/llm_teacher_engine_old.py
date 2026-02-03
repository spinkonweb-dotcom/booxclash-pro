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
# 🛠️ HELPER: DATE CALCULATOR
# =====================================================
def calculate_week_dates(start_date_str: str, week_num: int) -> Dict[str, str]:
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
# 🛠️ HELPER: JSON CLEANER
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
    syllabus_data: Any,
    subject: str,
    grade: str,
    term: str,
    num_weeks: int,
    start_date: str = "2026-01-13"
) -> List[dict]:
    
    print(f"\n📘 [Scheme Generator] Processing {subject} Grade {grade} for Term {term}...")
    
    # 1️⃣ ROBUST DATA EXTRACTION
    full_topic_list = []
    if isinstance(syllabus_data, dict):
        # Scan common keys where the list might be hiding
        full_topic_list = (
            syllabus_data.get("topics") or 
            syllabus_data.get("units") or 
            syllabus_data.get("content") or 
            syllabus_data.get("syllabus") or 
            []
        )
    elif isinstance(syllabus_data, list):
        full_topic_list = syllabus_data
    
    total_topics = len(full_topic_list)
    if total_topics == 0:
        print(f"⚠️ [Scheme Generator] CRITICAL: No topics found in syllabus data.")
        return []

    # 2️⃣ TERM DIVISION LOGIC (Split by 3)
    chunk_size = math.ceil(total_topics / 3)
    
    # Normalize term input
    term_int = 1
    if "2" in str(term): term_int = 2
    elif "3" in str(term): term_int = 3

    start_index = (term_int - 1) * chunk_size
    end_index = start_index + chunk_size
    
    # Get the specific slice for this term
    term_syllabus_slice = full_topic_list[start_index:end_index]
    
    print(f"📊 Split Logic: Total {total_topics} items. Term {term_int} gets items {start_index} to {end_index}.")
    
    if not term_syllabus_slice:
        print("⚠️ Warning: Term slice resulted in empty list. Using full list as fallback.")
        term_syllabus_slice = full_topic_list

    # 3️⃣ PROMPT CONSTRUCTION
    model = get_model()
    
    # Dump the RAW slice to JSON so the AI sees 'unit', 'page_number', etc.
    data_context = json.dumps(term_syllabus_slice)

    prompt = f"""
    Act as a Senior Head Teacher in Zambia. Create a Scheme of Work for **Term {term_int}**.
    
    DETAILS: 
    - Subject: {subject}, Grade: {grade}
    - Duration: {num_weeks} Weeks
    - Start Date: {start_date}
    
    STRICT DATA SOURCE:
    The JSON data below represents the specific syllabus chunk for Term {term_int}.
    
    CRITICAL REQUIREMENTS:
    1. **Mandatory Fields**: You MUST include the `unit` (e.g., "12.12") and `page_number` (e.g., 73) for every topic. Extract these EXACTLY as they appear in the data.
    2. **No Data Loss**: Do NOT summarize. If the data lists specific outcomes like "12.12.6.6 Differentiate...", you must include them in the 'outcomes' list.
    3. **Allocation**: Map these {len(term_syllabus_slice)} topics across {num_weeks} weeks.
    
    DATA SLICE: 
    {data_context}
    
    OUTPUT FORMAT (JSON List):
    [
      {{
        "week_number": 1,
        "unit": "12.12",             <-- MUST EXTRACT FROM DATA
        "page_number": 73,           <-- MUST EXTRACT FROM DATA
        "topic": "ORGANIC CHEMISTRY",
        "content": ["12.12.6 Macromolecules (Polymers)"],
        "outcomes": ["12.12.6.6 Differentiate between...", "12.12.6.7 Describe typical uses..."],
        "resources": ["Textbook Page 73", "Molecule Models"] 
      }}
    ]
    """
    
    try:
        # Generate
        response = await model.generate_content_async(prompt)
        json_str = extract_json_string(response.text)
        data = json.loads(json_str)

        if not isinstance(data, list): return []

        # 4️⃣ POST-PROCESSING
        cleaned_data = []
        for i, item in enumerate(data):
            week_num = item.get('week_number', i + 1)
            
            if week_num > num_weeks: continue

            date_info = calculate_week_dates(start_date, week_num)
            
            # Ensure list formatting
            if isinstance(item.get('content'), str): item['content'] = [item['content']]
            if isinstance(item.get('outcomes'), str): item['outcomes'] = [item['outcomes']]

            # Add display metadata
            item['month'] = date_info['month'] 
            item['week'] = f"Week {week_num} {date_info['range_display']}"
            item['week_number'] = week_num
            
            # Fallback for unit/page if AI missed them (rare with strict prompt)
            if 'unit' not in item: item['unit'] = "N/A"
            if 'page_number' not in item: item['page_number'] = "-"

            cleaned_data.append(item)

        return cleaned_data

    except Exception as e:
        print(f"❌ [Scheme Generator] Failed: {e}")
        return []

# =====================================================
# 2. WEEKLY PLAN GENERATOR
# =====================================================
async def generate_weekly_plan_with_ai(
    grade: str, 
    subject: str, 
    term: str, 
    week_number: int, 
    school_name: str = "Unknown School", 
    start_date: Optional[str] = None, 
    days_count: int = 5,
    topic: Optional[str] = None  # 👈 Accepts the topic
) -> Dict[str, Any]:
    
    # Smart Fallback: If topic is empty string/None, make a decent guess context
    topic_context = topic if topic and len(topic) > 1 else f"Week {week_number} Syllabus Topic"
    
    print(f"🧠 AI Generating Weekly Plan | Subject: {subject} | Week: {week_number} | Topic: {topic_context}")
    
    model = get_model()

    prompt = f"""
    Act as a Senior Teacher in Zambia. Create a Weekly Lesson Forecast.
    
    DETAILS: 
    - School: {school_name}
    - Grade: {grade}
    - Subject: {subject}
    - Term: {term}
    - Week: {week_number}
    - Duration: {days_count} Days
    - TOPIC FOCUS: "{topic_context}" 
    
    CRITICAL INSTRUCTIONS:
    1. **Adhere to Topic**: You MUST generate lessons specifically for the topic: "{topic_context}".
       - Do NOT generate generic content like "Introduction to Week 1 Syllabus Topic". 
       - If the topic is "Fractions", every day must be about Fractions.
    2. **Days**: Generate exactly {days_count} entries.
    3. **Resources**: Vary them (e.g., "Soil samples", "Clock face", "Flashcards").
    
    STRICT JSON OUTPUT FORMAT:
    {{
      "meta": {{ 
        "school": "{school_name}", 
        "grade": "{grade}", 
        "subject": "{subject}", 
        "week": {week_number},
        "main_topic": "{topic_context}"
      }},
      "days": [
        {{
          "day": "Monday",
          "subtopic": "Specific subtopic of {topic_context}",
          "objectives": ["..."],
          "activities": "...",
          "resources": "..."
        }}
      ]
    }}
    Ensure exactly {days_count} days are generated.
    """
    
    try:
        response = await model.generate_content_async(prompt, generation_config={"response_mime_type": "application/json"})
        return json.loads(extract_json_string(response.text))
    except Exception as e:
        print(f"❌ Weekly Plan Error: {e}")
        return {"meta": {"error": True}, "days": []}

# =====================================================
# 3. LESSON PLAN GENERATOR
# =====================================================
async def generate_specific_lesson_plan(
    grade: str, subject: str, theme: str, subtopic: str, objectives: List[str], 
    date: str, time_start: str, time_end: str, attendance: Dict[str, int], 
    teacher_name: str = "Class Teacher", school_name: str = "Primary School"
) -> Dict[str, Any]:
    print(f"\n📝 [Lesson Generator] {theme} - {subtopic}")
    model = get_model()

    prompt = f"""
    Create a Zambian Learner-Centered Lesson Plan.
    Teacher: {teacher_name}, School: {school_name}
    Topic: {theme}, Subtopic: {subtopic}
    Objectives: {json.dumps(objectives)}
    
    OUTPUT JSON:
    {{
      "teacherName": "{teacher_name}",
      "schoolName": "{school_name}",
      "topic": "{theme}", 
      "subtopic": "{subtopic}",
      "time": "{time_start} - {time_end}", 
      "rationale": "...", 
      "specific": "...", 
      "standard": "...", 
      "prerequisite": "...", 
      "materials": "...", 
      "references": "...",
      "enrolment": {{ "boys": {attendance.get('boys', 0)}, "girls": {attendance.get('girls', 0)}, "total": {attendance.get('boys', 0) + attendance.get('girls', 0)} }},
      "steps": [
        {{ "stage": "INTRODUCTION", "time": "5 min", "teacherActivity": "...", "learnerActivity": "...", "method": "..." }},
        {{ "stage": "DEVELOPMENT", "time": "30 min", "teacherActivity": "...", "learnerActivity": "...", "method": "..." }},
        {{ "stage": "CONCLUSION", "time": "5 min", "teacherActivity": "...", "learnerActivity": "...", "method": "..." }}
      ]
    }}
    """
    try:
        response = await model.generate_content_async(prompt)
        return json.loads(extract_json_string(response.text), strict=False)
    except Exception:
        return {}

async def generate_structured_worksheet(grade: str, subject: str, topic: str):
    model = get_model()
    prompt = f"""Create a worksheet for {grade} {subject}: {topic}. Output JSON with 'blocks' (mcq, matching, svg_diagram)."""
    try:
        response = await model.generate_content_async(prompt, generation_config={"response_mime_type": "application/json"})
        return json.loads(extract_json_string(response.text))
    except Exception:
        return {"title": topic, "grade": grade, "blocks": []}