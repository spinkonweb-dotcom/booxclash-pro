import os
import json
import asyncio
import re
import math
from typing import List, Dict, Any, Union, Optional
from datetime import datetime, timedelta
from dotenv import load_dotenv
import google.generativeai as genai

# ==========================================
# ⚙️ CONFIGURATION & AGENT SETUP
# ==========================================

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# The "Author" Model - Optimized for creative but structured writing
AUTHOR_MODEL = "gemini-2.5-flash" 

def get_model():
    return genai.GenerativeModel(AUTHOR_MODEL)

# ==========================================
# 🧠 CORE AGENT: THE AUTHOR
# ==========================================

async def _agent_author_core(
    role_instruction: str, 
    context_data: str, 
    json_schema: Dict[str, Any]
) -> Dict[str, Any]:
    """
    The centralized 'Brain' that writes content based on a Schema (Template).
    """
    model = get_model()
    
    prompt = f"""
    {role_instruction}

    --- CONTEXT & DATA SOURCE ---
    {context_data}

    --- YOUR TASK ---
    Fill the following JSON Structure (Template) with high-quality, professional content based strictly on the context above.
    
    RULES:
    1. Do not change the keys in the JSON.
    2. Be detailed and pedagogical.
    3. Return ONLY valid JSON.

    --- TARGET JSON TEMPLATE ---
    {json.dumps(json_schema, indent=2)}
    """

    try:
        response = await model.generate_content_async(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(extract_json_string(response.text))
    except Exception as e:
        print(f"❌ Author Agent Failed: {e}")
        return json_schema # Return empty template on failure

# ==========================================
# 🛠️ HELPERS (Date, Module Search, Cleaning)
# ==========================================

def calculate_week_dates(start_date_str: str, week_num: int) -> Dict[str, str]:
    try:
        clean_date = start_date_str.replace("/", "-").replace(".", "-")
        try:
            start_dt = datetime.strptime(clean_date, "%Y-%m-%d")
        except ValueError:
            start_dt = datetime.strptime(clean_date, "%d-%m-%Y")
            
        week_start = start_dt + timedelta(days=(week_num - 1) * 7)
        week_end = week_start + timedelta(days=4) 
        
        return {
            "range_display": f"{week_start.strftime('%d.%m')} - {week_end.strftime('%d.%m.%Y')}",
            "start_iso": week_start.strftime("%Y-%m-%d"),
            "end_iso": week_end.strftime("%Y-%m-%d"),
            "month": week_start.strftime("%B")
        }
    except Exception:
        return {"range_display": "", "start_iso": "", "end_iso": "", "month": ""}

def extract_json_string(text: str) -> str:
    clean = text.replace("```json", "").replace("```", "").strip()
    return clean

def extract_unit_id(text: str) -> str:
    match = re.search(r'\b(\d+\.\d+(\.\d+)?)\b', str(text))
    return match.group(1) if match else None

def normalize_text(text):
    if not text: return ""
    clean = re.sub(r'^(unit|topic|week)?\s*\d+(\.\d+)*\s*', '', str(text), flags=re.IGNORECASE)
    return re.sub(r'[^a-z0-9]', '', clean.lower())

def find_structured_module_content(module_data: Dict[str, Any], search_topic: str) -> Dict[str, Any]:
    """
    Intelligent lookup to find the exact Unit/Topic in the Module JSON.
    """
    if not module_data or "topics" not in module_data: return None

    search_id = extract_unit_id(search_topic)
    search_text_clean = normalize_text(search_topic)
    
    # Recursive search or flat loop based on your module structure
    for topic in module_data.get("topics", []):
        topic_id = str(topic.get("topic_id", ""))
        
        # Check Main Topic
        if (search_id and search_id == topic_id) or (search_text_clean in normalize_text(topic.get("topic_title", ""))):
            return _format_module_found(topic, topic) # Found main topic
            
        # Check Subtopics
        for sub in topic.get("sub_topics", []):
            sub_id = str(sub.get("subtopic_id", ""))
            sub_title = normalize_text(sub.get("subtopic_title", ""))
            
            id_match = (search_id and search_id == sub_id)
            text_match = (search_text_clean in sub_title) or (sub_title in search_text_clean)
            
            if id_match or text_match:
                return _format_module_found(topic, sub)
    return None

def _format_module_found(topic, sub):
    """Helper to format the found module data for the Agent"""
    return {
        "found": True,
        "unit_id": sub.get("subtopic_id", topic.get("topic_id")),
        "topic_title": f"{topic.get('topic_title')}: {sub.get('subtopic_title', '')}",
        "pages": str(sub.get("page_number", topic.get("page_number", "N/A"))),
        "context_text": f"Content: {sub.get('content', '')}\nActivities: {sub.get('activities', '')}"
    }

# ==========================================
# 1. SERVICE: SCHEME GENERATOR (Iterative)
# ==========================================

async def generate_scheme_with_ai(
    syllabus_data: Union[List[dict], Dict[str, Any]], 
    subject: str, grade: str, term: str, num_weeks: int, 
    start_date: str = "2026-01-13"
) -> Dict[str, Any]:
    
    print(f"\n📘 [Scheme Agent] Starting Iterative Generation for {num_weeks} Weeks...")

    # --- 1. Prepare Data ---
    topics_list = syllabus_data.get("topics", []) if isinstance(syllabus_data, dict) else syllabus_data
    
    # Distribute topics across weeks
    weeks_distribution = []
    num_topics = len(topics_list)
    
    for i in range(num_weeks):
        # Calculate which topic belongs to this week
        topic_idx = int((i / num_weeks) * num_topics)
        current_topic = topics_list[topic_idx] if topic_idx < num_topics else {"content": "Revision"}
        weeks_distribution.append(current_topic)

    # --- 2. Generate Intro (One Shot) ---
    intro_schema = {
        "philosophy": "",
        "competence_learning": "",
        "goals": []
    }
    intro_task = _agent_author_core(
        role_instruction="Act as a Head Teacher. Write the Scheme Introduction.",
        context_data=f"Subject: {subject}, Grade: {grade}, Term: {term}. Syllabus Data: {json.dumps(topics_list[:3])}...",
        json_schema=intro_schema
    )

    # --- 3. Generate Weeks (Iterative/Parallel) ---
    week_tasks = []
    
    for i, week_topic_data in enumerate(weeks_distribution):
        week_num = i + 1
        date_info = calculate_week_dates(start_date, week_num)
        
        # The Schema for ONE week
        week_schema = {
            "week": f"Week {week_num}",
            "topic": "",
            "prescribed_competences": [],
            "specific_competences": [],
            "content": [],
            "learning_activities": [],
            "methods": [],
            "assessment": [],
            "resources": [],
            "references": []
        }
        
        context = f"""
        Week Number: {week_num}
        Month: {date_info['month']}
        Assigned Syllabus Topic: {json.dumps(week_topic_data)}
        Subject: {subject}
        """
        
        # Create Async Task for this week
        week_tasks.append(_agent_author_core(
            role_instruction=f"Write the Scheme of Work entry for Week {week_num}.",
            context_data=context,
            json_schema=week_schema
        ))

    # Run Generation
    print(f"   ↳ Generating {len(week_tasks)} weeks in parallel...")
    results = await asyncio.gather(intro_task, *week_tasks)
    
    intro_result = results[0]
    weeks_results = results[1:]
    
    # --- 4. Final Stitching ---
    final_weeks = []
    for i, w_data in enumerate(weeks_results):
        week_num = i + 1
        date_info = calculate_week_dates(start_date, week_num)
        
        # Enhance with metadata
        w_data['week'] = f"Week {week_num} ({date_info['month']})"
        w_data['week_number'] = week_num
        w_data['date_start'] = date_info['start_iso']
        w_data['date_end'] = date_info['end_iso']
        final_weeks.append(w_data)

    return {
        "intro_info": intro_result,
        "weeks": final_weeks
    }

# ==========================================
# 2. SERVICE: WEEKLY PLAN (Author + Module)
# ==========================================

async def generate_weekly_plan_from_scheme(
    school: str, subject: str, grade: str, term: str, 
    week_number: int, days: int, start_date: str, 
    scheme_data: List[dict] = None,
    module_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:

    print(f"\n🗓️ [Weekly Agent] Processing Week {week_number}...")

    # 1. Get Context from Scheme
    week_scheme = next((item for item in scheme_data if str(item.get("week_number")) == str(week_number)), {})
    topic = week_scheme.get("topic", f"Week {week_number} Content")
    
    # 2. Get Deep Context from Module
    module_info = find_structured_module_content(module_data, topic)
    
    module_text = "No specific module data found."
    if module_info:
        module_text = f"OFFICIAL MODULE DATA (Use This): {module_info['context_text']}\nReference: Module Unit {module_info['unit_id']}"

    # 3. Define Schema (The Template)
    # We create empty slots for the number of days requested
    days_schema = []
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    
    for i in range(days):
        days_schema.append({
            "day": day_names[i] if i < 5 else f"Day {i+1}",
            "topic": topic,
            "subtopic": "",
            "specific_competence": "",
            "scope_of_lesson": "",
            "learning_activity": "",
            "resources": [],
            "strategies": [],
            "reference": ""
        })

    full_schema = {
        "meta": {"week_number": week_number, "term": term},
        "days": days_schema
    }

    # 4. Run Author Agent
    return await _agent_author_core(
        role_instruction="Act as a Senior Teacher. Break down the weekly topic into daily lessons.",
        context_data=f"""
        Subject: {subject}, Grade: {grade}
        Scheme Topic: {topic}
        Scheme Activities: {week_scheme.get('learning_activities')}
        
        {module_text}
        """,
        json_schema=full_schema
    )

# ==========================================
# 3. SERVICE: LESSON PLAN (Author + Module)
# ==========================================

async def generate_specific_lesson_plan(
    grade: str, subject: str, theme: str, subtopic: str, objectives: List[str],
    date: str, time_start: str, time_end: str, attendance: Dict[str, int],
    teacher_name: str, school_name: str,
    module_data: Optional[Dict[str, Any]] = None,
    scheme_references: str = "Syllabus"
) -> Dict[str, Any]:

    print(f"\n🔍 [Lesson Agent] Planning: {subtopic}")

    # 1. Module Context
    module_info = find_structured_module_content(module_data, subtopic)
    
    module_context = ""
    ref_text = scheme_references
    
    if module_info:
        module_context = f"STRICTLY FOLLOW THIS MODULE CONTENT:\n{module_info['context_text']}"
        ref_text = f"Official Module Unit {module_info['unit_id']}, Page {module_info['pages']}"

    # 2. The Schema (Template)
    lesson_schema = {
        "teacherName": teacher_name,
        "schoolName": school_name,
        "grade": grade,
        "subject": subject,
        "topic": theme,
        "subtopic": subtopic,
        "time": f"{time_start} - {time_end}",
        "enrolment": attendance,
        "expected_standard": "",
        "learning_environment": {"natural": "", "technological": "", "artificial": ""},
        "materials": "",
        "references": ref_text,
        "steps": [
            {"stage": "INTRODUCTION", "time": "5 min", "teacherActivity": "", "learnerActivity": "", "assessment_criteria": ""},
            {"stage": "DEVELOPMENT", "time": "30 min", "teacherActivity": "", "learnerActivity": "", "assessment_criteria": ""},
            {"stage": "CONCLUSION", "time": "5 min", "teacherActivity": "", "learnerActivity": "", "assessment_criteria": ""}
        ],
        "homework_content": "",
        "evaluation_footer": "..................................................."
    }

    # 3. Run Author Agent
    return await _agent_author_core(
        role_instruction="Act as a CBC Expert Teacher. Write a detailed Lesson Plan.",
        context_data=f"""
        Objectives: {json.dumps(objectives)}
        {module_context}
        """,
        json_schema=lesson_schema
    )

# ==========================================
# 4. SERVICE: DYNAMIC TEMPLATE GENERATOR
# ==========================================

async def generate_dynamic_lesson(
    request_data: Dict[str, Any], 
    html_template: str, 
    school_data: Dict[str, Any],
    syllabus_data: Optional[List[Dict[str, Any]]] = None # <--- ADDED ARGUMENT
) -> Dict[str, Any]:
    """
    Generates the DATA DICTIONARY required to fill a custom HTML template.
    Works for BOTH Old and New curriculums transparently.
    """
    
    # 1. ROBUST TYPE DETECTION
    raw_type = str(request_data.get("type", "")).lower().strip()
    
    try:
        num_weeks = int(request_data.get("weeks", 0))
        num_days = int(request_data.get("days", 0))
    except (ValueError, TypeError):
        num_weeks = 0
        num_days = 0

    if "scheme" in raw_type:
        doc_type = "SCHEME"
    elif "weekly" in raw_type or "forecast" in raw_type:
        doc_type = "WEEKLY"
    elif "lesson" in raw_type:
        doc_type = "LESSON"
    else:
        # Fallback
        if num_weeks > 1:
            doc_type = "SCHEME"
        elif num_days > 0:
            doc_type = "WEEKLY"
        else:
            doc_type = "LESSON"

    print(f"🧠 [Dynamic Agent] Generating Data for Custom Template | Detected: {doc_type} (Raw: '{raw_type}')")

    # 2. Extract Common Metadata
    subject = request_data.get("subject", "General")
    grade = request_data.get("grade", "Grade")
    topic = request_data.get("topic", "")
    term = request_data.get("term", "Term 1")

    # 3. Define Schema & Context based on Type
    
    if doc_type == "SCHEME":
        # --- SCHEME OF WORK DATA ---
        target_schema = {
            "course_overview": "A brief executive summary of the term's work.",
            "term_goals": ["Goal 1", "Goal 2", "Goal 3"],
            "rows": [
                {
                    "week": "Week 1", 
                    "topic": "Topic Name", 
                    "content": "Detailed breakdown of content", 
                    "objectives": "Key learning outcomes",
                    "competence": "Specific skill/competence",
                    "activities": "Teacher and Learner activities", 
                    "resources": "Required resources", 
                    "assessment": "Assessment method",
                    "remarks": "Space for remarks"
                },
                 {
                    "week": "Week 2", 
                    "topic": "Topic Name", 
                    "content": "Detailed breakdown of content", 
                    "objectives": "Key learning outcomes",
                    "competence": "Specific skill/competence",
                    "activities": "Teacher and Learner activities", 
                    "resources": "Required resources", 
                    "assessment": "Assessment method",
                    "remarks": "Space for remarks"
                }
            ]
        }
        role = f"Act as a Head of Department for {subject}. Generate a Scheme of Work."
        
        # USE THE REAL SYLLABUS IF AVAILABLE
        if syllabus_data:
            data_context = f"OFFICIAL SYLLABUS TOPICS FOR THIS TERM:\n{json.dumps(syllabus_data)}"
        else:
            data_context = "No specific syllabus provided. Generate standard curriculum topics for this grade."
            
        context_extra = f"Duration: {num_weeks} Weeks. Term: {term}.\n{data_context}"

    elif doc_type == "WEEKLY":
        # --- WEEKLY PLAN DATA ---
        target_schema = {
            "week_overview": f"Summary of the week's focus on {topic}",
            "learning_aids": "List of general aids for the week",
            "days": [
                {
                    "day": "Monday",
                    "topic": topic,
                    "subtopic": "Specific subtopic for this day",
                    "lesson_content": "Core content to be taught",
                    "methodology": "Teaching methods used",
                    "learner_activity": "What students will do",
                    "evaluation": "How success is measured"
                },
                {
                    "day": "Tuesday",
                    "topic": topic,
                    "subtopic": "Specific subtopic for this day",
                    "lesson_content": "Core content to be taught",
                    "methodology": "Teaching methods used",
                    "learner_activity": "What students will do",
                    "evaluation": "How success is measured"
                }
            ]
        }
        role = f"Act as a Senior {subject} Teacher. Generate a Weekly Forecast."
        context_extra = f"Week Number: {request_data.get('weekNumber')}. Days: {num_days}."

    else:
        # --- LESSON PLAN DATA ---
        target_schema = {
            "topic_overview": "Brief introduction to the lesson.",
            "key_concepts": ["Concept 1", "Concept 2"],
            "teaching_aids": ["Material 1", "Material 2"],
            "introduction": { 
                "time": "5 min", 
                "teacher_activity": "Description of teacher's hook", 
                "learner_activity": "Students' response" 
            },
            "development": { 
                "steps": [
                    { "step": "1", "time": "10 min", "teacher_activity": "Explanation", "learner_activity": "Note taking/Discussion" },
                    { "step": "2", "time": "15 min", "teacher_activity": "Demonstration", "learner_activity": "Practice" }
                ] 
            },
            "conclusion": { 
                "time": "5 min", 
                "teacher_activity": "Recap", 
                "learner_activity": "Q&A" 
            },
            "blackboard_work": "Summary of notes to be written on the board.",
            "homework": "Homework assignment details.",
            "reflection_space": "..................................."
        }
        role = f"Act as an Expert {subject} Teacher. Generate a detailed Lesson Plan."
        context_extra = f"Subtopic: {request_data.get('subtopic')}. Time: {request_data.get('timeStart')} - {request_data.get('timeEnd')}."

    # 4. Generate the Data
    try:
        generated_data = await _agent_author_core(
            role_instruction=role,
            context_data=f"""
            School Name: {school_data.get('schoolName', 'School')}
            Subject: {subject}
            Grade: {grade}
            Main Topic: {topic}
            {context_extra}
            
            Objectives Provided: {request_data.get('objectives', [])}
            
            IMPORTANT:
            - This data will be injected into a custom HTML template.
            - Ensure the JSON structure exactly matches the Target Template keys.
            """,
            json_schema=target_schema
        )
        
        return generated_data

    except Exception as e:
        print(f"❌ Error in generate_dynamic_lesson: {e}")
        return target_schema # Safe fallback