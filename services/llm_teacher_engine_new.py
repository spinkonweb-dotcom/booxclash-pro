import os
import json
import asyncio
import re
import math
from typing import List, Dict, Any, Union,Optional
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
# 🛠️ HELPER: EXTRACT SCHEME DETAILS (Enhanced for CBC)
# =====================================================
def extract_scheme_details(scheme_data: List[dict], week_number: int) -> Dict[str, Any]:
    """
    Finds the week and returns ALL the rich CBC data found in the DB.
    """
    print(f"🔍 [Scheme Extractor] Looking for Week {week_number}...")
    
    if not scheme_data:
        return {"found": False, "topic": f"Week {week_number}", "content": [], "outcomes": [], "activities": [], "resources": [], "methods": [], "refs": []}

    week_key = str(week_number).strip()
    
    # 1. FIND THE WEEK
    found_week = next((
        item for item in scheme_data 
        if str(item.get("week_number", "")).strip() == week_key or 
           str(item.get("week", "")).lower().replace("week", "").strip().split()[0] == week_key
    ), None)

    if not found_week:
        print(f"❌ [Scheme Extractor] Week {week_number} not found.")
        return {"found": False}

    # 2. EXTRACT CORE IDENTIFIERS
    # We prioritize 'unit' -> 'topic' -> 'theme' to get the best "Component" title
    topic = found_week.get("topic") or "Topic Not Set"
    unit = found_week.get("unit") or "" 
    component_title = unit if unit else topic # Use Unit (e.g. Unit 2.1) as the main component title if available

    # 3. EXTRACT LISTS (Handle strings that need splitting or pre-existing lists)
    def ensure_list(val):
        if isinstance(val, list): return val
        if isinstance(val, str) and val: return [val]
        return []

    # CBC Specific Fields
    specific_competences = ensure_list(found_week.get("specific_competences") or found_week.get("outcomes"))
    prescribed_competences = ensure_list(found_week.get("prescribed_competences") or found_week.get("competences"))
    
    # Pedagogy Fields
    content = ensure_list(found_week.get("content"))
    learning_activities = ensure_list(found_week.get("learning_activities") or found_week.get("activities"))
    methods = ensure_list(found_week.get("methods") or found_week.get("strategies"))
    resources = ensure_list(found_week.get("resources"))
    assessment = ensure_list(found_week.get("assessment"))
    refs = ensure_list(found_week.get("references") or found_week.get("reference") or ["Syllabus"])

    print(f"✅ [Scheme Extractor] Found: {component_title} | {len(specific_competences)} competencies | {len(learning_activities)} activities")

    return {
        "found": True,
        "component": component_title, # e.g. "Unit 2.1: Sets"
        "topic": topic,               # e.g. "Sets"
        "subtopic": found_week.get("subtopic", ""),
        
        # Lists
        "prescribed_competences": prescribed_competences,
        "specific_competences": specific_competences,
        "content": content,
        "learning_activities": learning_activities,
        "methods": methods,
        "resources": resources,
        "assessment": assessment,
        "refs": refs
    }

# =====================================================
# 🛠️ HELPER: FIND TOPIC IN MODULE
# =====================================================
def find_topic_content_in_module(module_data: Dict[str, Any], target_topic: str) -> str:
    """
    Searches the module JSON for a matching topic and returns its content.
    """
    if not module_data or not target_topic:
        return ""

    target_clean = target_topic.lower().strip()
    found_content = []

    # Recursive search function
    def recursive_search(data):
        if isinstance(data, dict):
            # Check if this dict represents a topic
            current_topic = data.get("topic", "") or data.get("title", "") or data.get("unit", "")
            if isinstance(current_topic, str) and (target_clean in current_topic.lower() or current_topic.lower() in target_clean):
                # Found a match! Collect useful fields
                content_snippets = [
                    f"Title: {current_topic}",
                    f"Content: {str(data.get('content', ''))}",
                    f"Activities: {str(data.get('activities', ''))}",
                    f"Examples: {str(data.get('examples', ''))}"
                ]
                found_content.append("\n".join(content_snippets))
            
            # Recurse through all values
            for key, value in data.items():
                recursive_search(value)
        
        elif isinstance(data, list):
            for item in data:
                recursive_search(item)

    recursive_search(module_data)
    
    # Return the top match or empty string
    return found_content[0] if found_content else ""

def extract_unit_id(text: str) -> str:
    """
    Extracts the first occurrence of a unit/topic ID like '1.1', '1.1.3', 'Unit 1'.
    Returns cleaned ID string (e.g., '1.1.3') or None.
    """
    match = re.search(r'\b(\d+\.\d+(\.\d+)?)\b', str(text))
    if match:
        return match.group(1)
    return None

def normalize_text(text):
    """
    Cleans text for semantic comparison (removes numbers/special chars).
    """
    if not text: return ""
    clean = re.sub(r'^(unit|topic|week)?\s*\d+(\.\d+)*\s*', '', str(text), flags=re.IGNORECASE)
    return re.sub(r'[^a-z0-9]', '', clean.lower())

def find_structured_module_content(module_data: Dict[str, Any], search_topic: str) -> Dict[str, Any]:
    """
    PRIORITY 1: Match exactly by Unit ID (e.g., Search '1.1.1' -> Module '1.1.1').
    PRIORITY 2: Match by Text content if no ID is found.
    """
    if not module_data or "topics" not in module_data:
        return None

    # 1. Extract ID from the Scheme Topic (e.g., "1.1.1 Branches..." -> "1.1.1")
    search_id = extract_unit_id(search_topic)
    search_text_clean = normalize_text(search_topic)
    
    print(f"   🔍 Module Search | ID: '{search_id}' | Text: '{search_text_clean}'")

    for topic in module_data.get("topics", []):
        topic_id = str(topic.get("topic_id", ""))
        topic_title = topic.get("topic_title", "")
        
        # --- LEVEL 1: TOPIC CHECK ---
        # Check ID Match (e.g. "1" == "1")
        topic_id_match = (search_id and search_id == topic_id)
        
        for sub in topic.get("sub_topics", []):
            sub_id = str(sub.get("subtopic_id", ""))
            sub_title = sub.get("subtopic_title", "")
            
            # --- LEVEL 2: SUBTOPIC CHECK ---
            # Check strict ID match (e.g. Scheme "1.1" == Module "1.1")
            sub_id_match = (search_id and search_id == sub_id)
            
            # Check text match (backup)
            sub_text_clean = normalize_text(sub_title)
            text_match = (search_text_clean in sub_text_clean) or (sub_text_clean in search_text_clean)
            
            # 🔥 DECISION LOGIC 🔥
            # If we have a Search ID, require strictly the ID match.
            # If we don't have a Search ID, rely on text.
            is_match = False
            
            if search_id:
                # If searching by ID, only return if ID matches
                if sub_id_match:
                    is_match = True
                    print(f"      ✅ STRICT ID MATCH: {search_id} == {sub_id}")
            else:
                # If no ID in search, use text
                if text_match:
                    is_match = True
                    print(f"      ✅ TEXT MATCH: '{search_text_clean}' ~= '{sub_text_clean}'")

            if is_match:
                # Format the content
                blocks_text = ""
                for block in sub.get("instructional_blocks", []):
                    t_steps = " ".join(block.get("teacher_steps", []))
                    l_tasks = " ".join(block.get("learner_tasks", []))
                    
                    blocks_text += f"""
                    [Activity ID: {block.get('block_id')}]
                    - Hook: {block.get('hook')}
                    - Teacher: {t_steps}
                    - Learner: {l_tasks}
                    """

                return {
                    "found": True,
                    "unit_id": sub_id,
                    "topic_title": f"{topic_title}: {sub_title}",
                    "pages": str(sub.get("page_number", topic.get("page_number", "N/A"))),
                    "context_text": f"""
                    TOPIC: {topic_title}
                    SUBTOPIC: {sub_title} (ID: {sub_id})
                    COMPETENCES: {', '.join(sub.get('competences', []))}
                    
                    ACTIVITIES:
                    {blocks_text}
                    """
                }
            
    return None

# =====================================================
# 2. WEEKLY PLAN GENERATOR 
# =====================================================
async def generate_weekly_plan_from_scheme(
    school: str, subject: str, grade: str, term: str, 
    week_number: int, days: int, start_date: str, 
    scheme_data: List[dict] = None,
    module_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    
    print(f"\n🗓️ [Weekly Generator] Request: Week {week_number}...")
    
    # 1. USE THE EXTRACTOR HELPER
    # This helper is much better at finding the week than the inline logic was
    details = extract_scheme_details(scheme_data, week_number)
    
    if not details["found"]:
        print(f"   ⚠️ Week {week_number} not found in Scheme. Using generic fallback.")
        # If not found, we try to at least provide the subject context
        details["topic"] = f"General {subject} Concepts"
        details["refs"] = "Standard Syllabus"

    # 2. FETCH STRUCTURED MODULE CONTENT
    # We search using the Topic name from the Scheme (e.g., "Unit 1.1: Branches of Chemistry")
    module_info = find_structured_module_content(module_data, details['topic'])
    
    module_prompt_insert = ""
    
    if module_info:
        print(f"   ↳ ✅ Module Found: Unit {module_info['unit_id']}, Pages: {module_info['pages']}")
        module_prompt_insert = f"""
        🔥🔥 **OFFICIAL MODULE DATA FOUND** 🔥🔥
        1. **UNIT ID**: {module_info['unit_id']}
        2. **PAGE NUMBERS**: {module_info['pages']}
        3. **CONTENT SOURCE**: Use the specific activities below to fill 'scope_of_lesson' and 'learning_activity'.
        
        --- MODULE CONTENT START ---
        {module_info['context_text']}
        --- MODULE CONTENT END ---
        
        **MANDATORY INSTRUCTION**: 
        In the 'reference' field of the JSON, you MUST write: "Module Unit {module_info['unit_id']}, Page {module_info['pages']}".
        """
    else:
        # FALLBACK TO SCHEME REFERENCES
        print(f"   ↳ ⚠️ Module not found for Topic: '{details['topic']}'. Falling back to Scheme References.")
        module_prompt_insert = f"""
        ⚠️ **MODULE DATA NOT FOUND**
        
        **MANDATORY INSTRUCTION**:
        You MUST use the 'REFERENCES' from the Scheme of Work provided: "{details.get('refs', 'Syllabus')}".
        
        In the 'reference' field of the JSON output, write exactly: "{details.get('refs', 'Standard Syllabus')}".
        """

    model = get_model() 
    
    # 3. PROMPT
    prompt = f"""
    Act as a Senior Teacher in Zambia. Create a Weekly Lesson Plan for {days} days.
    
    CONTEXT:
    - Subject: {subject}, Grade: {grade}, Term: {term}, Week: {week_number}
    - Topic: {details['topic']}
    - Competencies: {", ".join(details.get('specific_competences', []))}
    
    {module_prompt_insert}

    INSTRUCTIONS:
    - **Topic**: Use "{details['topic']}".
    - **Subtopic**: Break the topic into {days} logical daily lessons.
    - **Scope of Lesson**: If Module Data is present, summarize the 'Teacher' and 'Learner' steps from the module.
    - **Reference**: STRICTLY follow the 'MANDATORY INSTRUCTION' above.

    OUTPUT JSON ONLY:
    {{
      "meta": {{ "week_number": {week_number}, "term": "{term}" }},
      "days": [
        {{
          "day": "Monday", 
          "component": "{details.get('component', subject)}", 
          "topic": "{details['topic']}", 
          "subtopic": "Name of sub-lesson", 
          "specific_competence": "Learner should be able to...", 
          "scope_of_lesson": "Brief teacher content...",
          "learning_activity": "What learners do...", 
          "expected_standard": "Assessment goal...",
          "resources": {json.dumps(details.get('resources', ["Textbook"]))}, 
          "strategies": {json.dumps(details.get('methods', ["Inquiry"]))},
          "reference": "..." 
        }}
      ]
    }}
    """
    
    try:
        response = await model.generate_content_async(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(extract_json_string(response.text))
    except Exception as e:
        print(f"❌ [Weekly Generator] Error: {e}")
        return {"days": []}

# =====================================================
# 3. SPECIFIC LESSON PLANNER (Deep Module Integration)
# =====================================================
async def generate_specific_lesson_plan(
    grade: str, subject: str, theme: str, subtopic: str, objectives: List[str],
    date: str, time_start: str, time_end: str, attendance: Dict[str, int],
    teacher_name: str = "Class Teacher", school_name: str = "Primary School",
    module_data: Optional[Dict[str, Any]] = None,
    scheme_references: str = "Standard Syllabus" 
) -> Dict[str, Any]:
    
    print(f"\n🔍 [Lesson Plan] Generating for: {theme} - {subtopic}")

    # 1. FETCH STRUCTURED MODULE CONTENT (For metadata & content)
    # We search the module using the subtopic name provided by the UI
    module_info = find_structured_module_content(module_data, subtopic)
    
    # Fallback to searching by the main topic/theme if subtopic fails
    if not module_info:
        module_info = find_structured_module_content(module_data, theme)

    module_prompt_insert = ""
    final_reference = scheme_references # Default to what came from the scheme

    if module_info:
        unit_id = module_info.get("unit_id", "N/A")
        pages = module_info.get("pages", "N/A")
        final_reference = f"Official Module Unit {unit_id}, Page {pages}"
        
        print(f"   ↳ ✅ Module Found: {final_reference}")
        module_prompt_insert = f"""
        🔥🔥 **OFFICIAL MODULE DATA (SOURCE OF TRUTH)** 🔥🔥
        **UNIT ID**: {unit_id}
        **RELEVANT PAGES**: {pages}
        
        **TEACHING GUIDELINES FROM MODULE**:
        {module_info['context_text']}
        
        **INSTRUCTION**: 
        1. In the 'references' field, write: "{final_reference}".
        2. Use the 'Teacher steps' and 'Learner tasks' from the module text above to build the 'DEVELOPMENT' stage.
        """
    else:
        print(f"   ↳ ⚠️ Module not found for '{subtopic}'. Using Scheme Reference: {scheme_references}")
        module_prompt_insert = f"""
        **MANDATORY INSTRUCTION**:
        Use the references provided from the Scheme of Work: "{scheme_references}".
        In the 'references' field, write exactly: "{scheme_references}".
        """

    model = get_model()

    # 2. CALCULATE CONTEXT
    boys = attendance.get('boys', 0)
    girls = attendance.get('girls', 0)
    total_students = boys + girls
    
    # 3. PROMPT
    prompt = f"""
    Act as a professional teacher in Zambia. Create a **Competence Based Curriculum (CBC)** Lesson Plan.

    CONTEXT:
    - School: "{school_name}"
    - Teacher: "{teacher_name}"
    - Grade: {grade}, Subject: {subject}
    - Topic: "{theme}"
    - Subtopic: "{subtopic}"
    - Objectives: {json.dumps(objectives)}
    
    {module_prompt_insert}

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
      "enrolment": {{ "boys": {boys}, "girls": {girls}, "total": {total_students} }},
      
      "expected_standard": "Learners should be able to...",
      
      "learning_environment": {{
          "natural": "Classroom",
          "technological": "N/A",
          "artificial": "Desks/Chalkboard"
      }},
      
      "materials": "List specific aids mentioned in the module content if any.",
      "references": "{final_reference}",
      
      "steps": [
        {{ 
            "stage": "INTRODUCTION", 
            "time": "5 min", 
            "teacherActivity": "Create a hook based on the subtopic.", 
            "learnerActivity": "...", 
            "assessment_criteria": "..." 
        }},
        {{ 
            "stage": "DEVELOPMENT", 
            "time": "30 min", 
            "teacherActivity": "Step-by-step instructions from the module.", 
            "learnerActivity": "Corresponding learner tasks from the module.", 
            "assessment_criteria": "..." 
        }},
        {{ 
            "stage": "CONCLUSION", 
            "time": "5 min", 
            "teacherActivity": "Summary of key points.", 
            "learnerActivity": "...", 
            "assessment_criteria": "..." 
        }}
      ],
      "homework_content": "A short task."
    }}
    """
    
    try:
        response = await model.generate_content_async(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        data = json.loads(extract_json_string(response.text))
        
        # Safety check: Ensure the reference is correctly set
        data["references"] = final_reference
        data["evaluation_footer"] = "LESSON EVALUATION:\n" + ("." * 200)
        
        return data

    except Exception as e:
        print(f"❌ [Lesson Generator] Failed: {e}")
        return {"error": "Failed to generate plan."}
# =====================================================
# 4. LESSON NOTES GENERATOR (Blackboard/Student Notes)
# =====================================================
async def generate_lesson_notes(
    grade: str, subject: str, topic: str, subtopic: str,
    module_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Generates detailed blackboard notes. 
    Strictly uses Module Unit IDs and Page Numbers if available.
    """
    
    print(f"\n📝 [Notes Generator] Generating notes for: {topic} - {subtopic}")

    # 1. FETCH STRUCTURED MODULE CONTENT (For metadata like Unit ID and Pages)
    # We search by subtopic first for precision
    module_info = find_structured_module_content(module_data, subtopic)
    
    # If not found by subtopic, try the main topic
    if not module_info:
        module_info = find_structured_module_content(module_data, topic)

    module_context_str = ""
    reference_str = "Standard Syllabus Knowledge" # Default fallback

    if module_info:
        unit_id = module_info.get("unit_id", "N/A")
        pages = module_info.get("pages", "N/A")
        reference_str = f"Official Module Unit {unit_id}, Page {pages}"
        
        print(f"   ↳ ✅ Module Found: Unit {unit_id}, Page {pages}")
        
        module_context_str = f"""
        🔥🔥 **OFFICIAL MODULE DATA (SOURCE OF TRUTH)** 🔥🔥
        REFERENCE: {reference_str}
        CONTENT:
        {module_info['context_text']}
        
        **MANDATORY INSTRUCTION**: 
        1. Use the terminology and definitions found in the text above.
        2. You MUST include "{reference_str}" in the 'reference' field of the JSON.
        """
    else:
        print("   ⚠️ No specific module content found. Using AI pedagogical knowledge.")
        module_context_str = "⚠️ No module data provided. Use standard Zambian Curriculum standards."

    model = get_model()

    # 2. PROMPT
    prompt = f"""
    Act as a simplified, clear Teacher in Zambia. 
    Write **Lesson Notes** that a teacher would write on the blackboard for Grade {grade} students to copy into their exercise books.
    
    CONTEXT:
    - Subject: {subject}
    - Topic: {topic}
    - Subtopic: {subtopic}
    
    {module_context_str}

    INSTRUCTIONS:
    1. **Simple Language**: Keep it clear for Grade {grade}.
    2. **Definitions**: Must be accurate to the source material provided.
    3. **Examples**: Provide 2-3 worked examples.
    4. **Exercise**: Provide 3-5 short questions for classwork.
    
    OUTPUT JSON FORMAT (Strict):
    {{
      "topic_heading": "{topic}: {subtopic}",
      "reference": "{reference_str}", 
      "introduction": "Brief sentence introducing the concept...",
      "key_definitions": [
        {{ "term": "Term", "definition": "..." }}
      ],
      "explanation_points": [
        "Point 1",
        "Point 2"
      ],
      "worked_examples": [
        {{ "question": "Example 1", "solution": "..." }}
      ],
      "class_exercise": [
        "Question 1..."
      ],
      "homework_question": "..."
    }}
    """

    try:
        response = await model.generate_content_async(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        data = json.loads(extract_json_string(response.text))
        
        # Double check: ensure the reference is explicitly set in case the AI missed it
        if module_info and "reference" not in data:
            data["reference"] = reference_str
            
        return data

    except Exception as e:
        print(f"❌ [Notes Generator] Error: {e}")
        return {
            "topic_heading": f"{topic}",
            "reference": reference_str,
            "explanation_points": ["Error generating notes. Please try again."],
            "class_exercise": []
        }