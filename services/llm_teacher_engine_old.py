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
# 1. PROFESSIONAL SCHEME GENERATOR (FIXED MISSING CONTENT)
# =====================================================
async def generate_scheme_with_ai(
    syllabus_data: Any,
    subject: str,
    grade: str,
    term: str,
    num_weeks: int,
    start_date: str = "2026-01-12"
) -> List[dict]:
    
    print(f"\n📘 [Scheme Generator] Processing {subject} Grade {grade} for Term {term}...")
    
    # 1️⃣ ROBUST DATA EXTRACTION
    full_topic_list = []
    if isinstance(syllabus_data, dict):
        full_topic_list = (
            syllabus_data.get("topics") or 
            syllabus_data.get("content") or 
            syllabus_data.get("units") or 
            []
        )
    elif isinstance(syllabus_data, list):
        full_topic_list = syllabus_data
    
    if not full_topic_list:
        return []

    # 2️⃣ TERM DIVISION LOGIC
    chunk_size = math.ceil(len(full_topic_list) / 3)
    term_int = 1
    if "2" in str(term): term_int = 2
    elif "3" in str(term): term_int = 3

    start_index = (term_int - 1) * chunk_size
    end_index = start_index + chunk_size
    term_syllabus_slice = full_topic_list[start_index:end_index]
    
    # --- LOOKUP MAP (The Fix for Empty Data) ---
    syllabus_lookup = {}
    for item in term_syllabus_slice:
        key = str(item.get('unit', '')).strip()
        if not key: key = str(item.get('topic_title', '')).strip()
        if key: syllabus_lookup[key] = item
    # -------------------------------------------

    # 3️⃣ PROMPT
    model = get_model()
    data_context = json.dumps(term_syllabus_slice)

    prompt = f"""
    Act as a Senior Head Teacher. Create a Scheme of Work for **Term {term_int}**.
    
    DETAILS: 
    - Subject: {subject}, Grade: {grade}, Duration: {num_weeks} Weeks
    
    SOURCE DATA: 
    {data_context}

    INSTRUCTIONS:
    1. Map the topics to weeks.
    2. **External References**: Suggest ONE book/website in 'external_ref'.
    3. **Methods & Resources**: You MUST generate specific methods (e.g. "Group Work") and resources (e.g. "Charts") for every week.
    4. **CRITICAL**: Return the `unit` identifier exactly as it appears in source.

    OUTPUT JSON:
    [
      {{
        "week_number": 1,
        "unit": "10.1",
        "topic": "...", 
        "outcomes": ["..."],
        "methods": "Group Work, Demonstration", 
        "resources": "Charts, Realia",
        "external_ref": "Khan Academy..."
      }}
    ]
    """
    
    try:
        response = await model.generate_content_async(prompt)
        json_str = extract_json_string(response.text)
        data = json.loads(json_str)

        if not isinstance(data, list): return []

        cleaned_data = []
        for i, item in enumerate(data):
            week_num = item.get('week_number', i + 1)
            if week_num > num_weeks: continue

            # --- 🛠️ FIX: FORCE DATA FROM SOURCE ---
            ai_unit_key = str(item.get('unit', '')).strip()
            original_data = syllabus_lookup.get(ai_unit_key)
            
            # Fallback by index if unit missing
            if not original_data and i < len(term_syllabus_slice):
                original_data = term_syllabus_slice[i]

            if original_data:
                # 1. Force Page Number
                official_page = str(original_data.get('page_number', 'Ref Text'))
                
                # 2. Force Topic Title (Don't trust AI to remember it)
                source_topic = original_data.get('topic_title') or original_data.get('topic')
                if source_topic:
                    item['topic'] = source_topic
                
                # 3. Force Content/Subtopics
                source_content = original_data.get('subtopics') or original_data.get('content') or original_data.get('topics')
                if source_content:
                    item['content'] = source_content

                # 4. Force Outcomes (if AI missed them)
                source_outcomes = original_data.get('specific_outcomes') or original_data.get('outcomes')
                if source_outcomes and not item.get('outcomes'):
                    item['outcomes'] = source_outcomes

            # Default Methods/Resources if AI failed
            if not item.get('methods'): item['methods'] = "Explanation, Demonstration, Group Work"
            if not item.get('resources'): item['resources'] = "Textbook, Charts, Board"

            # 5. Build Reference String
            ai_ref = item.get('external_ref', '')
            if ai_ref:
                item['references'] = f"Syllabus Pg: {official_page}\nExt: {ai_ref}"
            else:
                item['references'] = f"Syllabus Pg: {official_page}"

            # --- Formatting ---
            date_info = calculate_week_dates(start_date, week_num)
            item['week'] = week_num
            item['date_range'] = date_info['range_display'] # Keep for logic, but we won't show in UI
            
            # Merge Topic/Content
            topic_str = item.get('topic', 'Topic')
            content_list = item.get('content', [])
            if isinstance(content_list, list): content_str = "\n- ".join(content_list)
            else: content_str = str(content_list)
            item['topic_content'] = f"**{topic_str}**\n- {content_str}"

            cleaned_data.append(item)

        return cleaned_data

    except Exception as e:
        print(f"❌ Error: {e}")
        return []
# =====================================================
# 2. WEEKLY PLAN GENERATOR (ROBUST REFERENCE FIX)
# =====================================================
async def generate_weekly_plan_with_ai(
    grade: str, 
    subject: str, 
    term: str, 
    week_number: int, 
    school_name: str = "Unknown School", 
    start_date: Optional[str] = None, 
    days_count: int = 5,
    topic: Optional[str] = None,
    references: Optional[str] = None  # 👈 Accepts the exact references string
) -> Dict[str, Any]:
    
    # Smart Fallback for Topic
    topic_context = topic if topic and len(topic) > 1 else f"Week {week_number} Syllabus Topic"
    
    # Smart Fallback for References
    ref_context = references if references and len(references) > 1 else "Syllabus, Approved Textbooks"

    print(f"🧠 AI Generating Weekly Plan | Subject: {subject} | Week: {week_number} | Refs: {ref_context[:30]}...")
    
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
          "subtopic": "Specific subtopic...",
          "objectives": ["..."],
          "activities": "...",
          "resources": "...",
          "references": "placeholder" 
        }}
      ]
    }}
    Ensure exactly {days_count} days are generated.
    """
    
    try:
        response = await model.generate_content_async(prompt, generation_config={"response_mime_type": "application/json"})
        data = json.loads(extract_json_string(response.text))

        # 🛠️ ROBUST FIX: FORCE OVERWRITE REFERENCES IN PYTHON
        # We don't trust the AI to copy the string perfectly, so we do it here.
        if "days" in data and isinstance(data["days"], list):
            for day in data["days"]:
                # If specific references were passed, use them. 
                # Otherwise keep what AI generated (or default).
                if references and len(references) > 1:
                    day["references"] = references
                elif not day.get("references"):
                    day["references"] = "Syllabus, Approved Textbooks"

        return data

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