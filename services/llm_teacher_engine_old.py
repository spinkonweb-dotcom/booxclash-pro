import os
import json
import asyncio
import re
import math
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from dotenv import load_dotenv
import google.generativeai as genai
from .new.teacher_shared import get_model, extract_json_string, find_structured_module_content

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# ✅ DEFAULT LOGO CONSTANT
DEFAULT_LOGO = "https://res.cloudinary.com/dchkrvf4b/image/upload/v1727734157/coat_of_arms_zambia.png"

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
# 2. WEEKLY PLAN GENERATOR (UPDATED FOR LOGO)
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
    references: Optional[str] = None,
    school_logo: Optional[str] = None # ✅ ADDED PARAMETER
) -> Dict[str, Any]:
    
    # 1. Determine Logo
    final_logo = school_logo if school_logo else DEFAULT_LOGO
    
    # Smart Fallback for Topic
    topic_context = topic if topic and len(topic) > 1 else f"Week {week_number} Syllabus Topic"
    
    # Smart Fallback for References
    ref_context = references if references and len(references) > 1 else "Syllabus, Approved Textbooks"

    print(f"🧠 AI Generating Weekly Plan | Subject: {subject} | Week: {week_number} | Logo: {'Yes' if school_logo else 'No'}")
    
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
        "logo_url": "{final_logo}",
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
        if "days" in data and isinstance(data["days"], list):
            for day in data["days"]:
                if references and len(references) > 1:
                    day["references"] = references
                elif not day.get("references"):
                    day["references"] = "Syllabus, Approved Textbooks"
        
        # 🚨 FORCE OVERRIDE LOGO
        if "meta" not in data: data["meta"] = {}
        data["meta"]["logo_url"] = final_logo
        data["meta"]["school"] = school_name

        return data

    except Exception as e:
        print(f"❌ Weekly Plan Error: {e}")
        return {"meta": {"error": True, "logo_url": final_logo}, "days": []}

# =====================================================
# 3. LESSON PLAN GENERATOR (UPDATED FOR LOGO)
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
    school_name: str = "Primary School",
    module_data: Optional[Dict[str, Any]] = None,
    scheme_references: str = "Standard Zambian Syllabus",
    blooms_level: str = "",
    school_logo: Optional[str] = None # ✅ ADDED PARAMETER
) -> Dict[str, Any]:
    
    # 1. Determine Logo
    final_logo = school_logo if school_logo else DEFAULT_LOGO

    print(f"\n📝 [Old Curr Lesson] Processing: {theme} - {subtopic} | Bloom's: {blooms_level} | Logo: {'Yes' if school_logo else 'No'}")
    
    # 2. SMART MODULE SEARCH
    module_info = find_structured_module_content(module_data, subtopic)
    if not module_info:
        module_info = find_structured_module_content(module_data, theme)

    # 3. CALCULATE ENROLMENT
    boys = attendance.get('boys', 0)
    girls = attendance.get('girls', 0)
    total = boys + girls

    # 4. DETERMINE SOURCES
    module_prompt_insert = ""
    strict_ref_override = False
    final_reference = scheme_references

    # ✅ SCENARIO A: MODULE FOUND
    if module_info:
        unit_id = module_info.get("topic_id", module_info.get("unit_id", "N/A"))
        pages = module_info.get("pages", "N/A")
        module_text = module_info.get("context_text", "")

        if pages and pages != "N/A":
            final_reference = f"Official Module Unit {unit_id}, Page {pages}"
            strict_ref_override = True
            print(f"   ↳ ✅ OFFICIAL MODULE FOUND: {final_reference}")
        
        module_prompt_insert = f"""
        🔥 **SOURCE MATERIAL: OFFICIAL GOVERNMENT MODULE** 🔥
        **STRICT RULES**:
        1. **TEACHER ACTIVITY**: Derive steps EXACTLY from the text below.
        2. **CITATIONS**: Cite "Activity {unit_id}.X" inside the lesson steps.
        3. **REFERENCE**: You MUST set the "references" field to: "{final_reference}".

        **MODULE TEXT**:
        {module_text}
        """

    # ❌ SCENARIO B: NO MODULE (EXTERNAL RESOURCING)
    else:
        print(f"   ↳ ⚠️ No Module. Enabling External Research.")
        strict_ref_override = False 
        
        module_prompt_insert = f"""
        🔥 **SOURCE MATERIAL: EXTERNAL RESEARCH REQUIRED** 🔥
        **STRICT RULES**:
        1. **CONTENT**: Since no module is available, you MUST use reputable **External Journals, Websites, or Standard Textbooks**.
        2. **ACTIVITIES**: Create standard activities and **reference the source** in the method column.
        3. **REFERENCE FIELD**: List the specific external sources you used (e.g., "MK Mathematics Bk 5, Khan Academy").
        """

    model = get_model()
    
    ref_placeholder = final_reference if strict_ref_override else "List specific external sources used..."

    # ✅ BLOOM'S TAXONOMY INSTRUCTION
    blooms_instruction = ""
    if blooms_level:
        blooms_instruction = f"""
        🧠 **PEDAGOGICAL FOCUS**: 
        This lesson MUST differ from a standard lesson by focusing on the **{blooms_level}** level of Bloom's Taxonomy.
        - Ensure the **Rationale** explains why this cognitive level fits the topic.
        - Ensure **Learner Activities** challenge students at this cognitive level.
        """

    # 5. PROMPT (Old Curriculum Structure)
    prompt = f"""
    Act as a Zambian Teacher. Create a **Learner-Centered Lesson Plan** (Old Curriculum Format).
    Teacher: {teacher_name}, School: {school_name}
    Topic: {theme}, Subtopic: {subtopic}
    Objectives: {json.dumps(objectives)}
    
    {blooms_instruction}

    {module_prompt_insert}

    OUTPUT JSON (Strict):
    {{
      "teacherName": "{teacher_name}",
      "schoolName": "{school_name}",
      "logo_url": "{final_logo}",
      "topic": "{theme}", 
      "subtopic": "{subtopic}",
      "time": "{time_start} - {time_end}", 
      "rationale": "Why this lesson is important...", 
      "specific": "Learners should be able to...", 
      "standard": "Clear statement of the expected standard.", 
      "prerequisite": "What learners already know.", 
      "materials": "List specific aids (Module, Realia, or External).", 
      "references": "{ref_placeholder}",
      "enrolment": {{ "boys": {boys}, "girls": {girls}, "total": {total} }},
      "steps": [
        {{ "stage": "INTRODUCTION", "time": "5 min", "teacherActivity": "...", "learnerActivity": "...", "method": "..." }},
        {{ "stage": "DEVELOPMENT", "time": "30 min", "teacherActivity": "Step-by-step from Source Material.", "learnerActivity": "...", "method": "..." }},
        {{ "stage": "CONCLUSION", "time": "5 min", "teacherActivity": "...", "learnerActivity": "...", "method": "..." }}
      ]
    }}
    """
    
    try:
        response = await model.generate_content_async(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        data = json.loads(extract_json_string(response.text))
        
        # ✅ FORCE OVERRIDES
        if strict_ref_override:
            data["references"] = final_reference
        
        # Force Logo and School Name
        data["logo_url"] = final_logo
        data["schoolName"] = school_name
            
        return data

    except Exception as e:
        print(f"❌ [Old Curr Generator] Failed: {e}")
        return {
            "topic": theme, 
            "subtopic": subtopic, 
            "references": final_reference,
            "logo_url": final_logo,
            "steps": [],
            "error": "Failed to generate lesson plan."
        }

# =====================================================
# 4. RECORD OF WORK GENERATOR (ADDED)
# =====================================================
async def generate_record_of_work(
    teacher_name: str,
    school_name: str,
    grade: str,
    subject: str,
    term: str,
    year: str,
    start_date: str,
    scheme_data: List[Dict],
    school_logo: Optional[str] = None
) -> Dict[str, Any]:

    final_logo = school_logo if school_logo else DEFAULT_LOGO
    
    # Flatten scheme data for prompt
    scheme_text = json.dumps(scheme_data[:5]) # Pass relevant week data

    print(f"📋 Generating Record of Work | Teacher: {teacher_name} | Logo: {'Yes' if school_logo else 'No'}")

    model = get_model()
    
    prompt = f"""
    Act as a Zambian Teacher. Generate a Record of Work (Log Book) entry.
    School: {school_name}
    Teacher: {teacher_name}
    Term: {term} | Year: {year}
    
    Scheme Data Context: {scheme_text}
    
    OUTPUT JSON:
    {{
      "header": {{
         "school_name": "{school_name}",
         "logo_url": "{final_logo}",
         "teacher": "{teacher_name}",
         "term": "{term}",
         "year": "{year}"
      }},
      "records": [
         {{ 
            "date": "YYYY-MM-DD", 
            "week": 1,
            "work_covered": "Brief summary of work done...", 
            "remarks": "Achieved objectives..." 
         }}
      ]
    }}
    """
    
    try:
        response = await model.generate_content_async(prompt, generation_config={"response_mime_type": "application/json"})
        data = json.loads(extract_json_string(response.text))
        
        # 🚨 FORCE LOGO
        if "header" not in data: data["header"] = {}
        data["header"]["logo_url"] = final_logo
        data["header"]["school_name"] = school_name
        
        return data

    except Exception as e:
        print(f"❌ ROW Error: {e}")
        return {"header": {"logo_url": final_logo, "school_name": school_name}, "records": []}