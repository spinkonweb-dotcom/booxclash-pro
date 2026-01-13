import os
import json
import math
import re
from typing import List, Dict, Any
from datetime import datetime, timedelta
from dotenv import load_dotenv

# ✅ Use the modern 2026 Google GenAI SDK
from google.genai import Client, types

load_dotenv()

# Initialize the global client
client = Client(api_key=os.getenv("GEMINI_API_KEY"))

# ✅ SPEED MODEL: 2.0 Flash is 10x faster than Pro for JSON tasks
MODEL_ID = "gemini-2.5-flash"

# =====================================================
# 🛠️ HELPER: DATE CALCULATOR
# =====================================================
def calculate_week_dates(start_date_str: str, week_num: int) -> Dict[str, str]:
    """Calculates Monday-Friday ranges for any given week number."""
    try:
        clean_date = start_date_str.replace("/", "-").replace(".", "-")
        try:
            start_dt = datetime.strptime(clean_date, "%Y-%m-%d")
        except ValueError:
            start_dt = datetime.strptime(clean_date, "%d-%m-%Y")

        week_start = start_dt + timedelta(days=(week_num - 1) * 7)
        week_end = week_start + timedelta(days=4) # Friday
        
        return {
            "range_display": f"({week_start.strftime('%d.%m.%Y')} - {week_end.strftime('%d.%m.%Y')})",
            "start_iso": week_start.strftime("%Y-%m-%d"),
            "end_iso": week_end.strftime("%Y-%m-%d")
        }
    except Exception:
        return {"range_display": "", "start_iso": "", "end_iso": ""}

# =====================================================
# 1. SCHEME OF WORK GENERATOR (FIXED OUTCOMES)
# =====================================================
async def generate_scheme_with_ai(
    syllabus_data: List[dict],
    subject: str,
    grade: str,
    term: str,
    num_weeks: int,
    start_date: str = "2025-01-13" 
) -> List[dict]:
    """Generates a full termly scheme using embedded page numbers from syllabus."""
    
    # Term Splitting Logic
    total_units = len(syllabus_data)
    chunk_size = math.ceil(total_units / 3)
    term_val = str(term)
    
    start_idx = 0
    if "2" in term_val: start_idx = chunk_size
    elif "3" in term_val: start_idx = chunk_size * 2
    
    term_syllabus_data = syllabus_data[start_idx : start_idx + chunk_size]
    if not term_syllabus_data:
        term_syllabus_data = syllabus_data

    # ✅ UPDATED PROMPT: STRICT OUTCOME ENFORCEMENT
    prompt = f"""
    Act as a Senior Curriculum Specialist. Generate a professional Scheme of Work.
    Subject: {subject}, Grade: {grade}, Term: {term}, Total Weeks: {num_weeks}
    
    SYLLABUS DATA: 
    {json.dumps(term_syllabus_data)}

    STRICT JSON OUTPUT RULES:
    1. Output a list of exactly {num_weeks} objects.
    
    2. **OUTCOMES (VERY IMPORTANT):** - Must be a list of strings.
       - **EVERY outcome MUST start with the exact phrase: "Learners should be able to..."**
       - Do NOT output single words like "Algebra". Write full sentences.
       - If the syllabus data is vague, you MUST INFER actionable outcomes based on the topic.
    
    3. **CONTENT:** Must be 3 concise bullet points.
    
    4. **REFERENCES:** - Extract 'unit' and 'page_number' from SYLLABUS DATA.
       - Format: ["Unit [code], Page [num]", "Approved Textbook"].
    
    5. Week {num_weeks} MUST be "Revision and Assessments".
    """

    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
        )
        
        raw_data = json.loads(response.text)
        scheme_list = raw_data if isinstance(raw_data, list) else list(raw_data.values())[0]

        final_scheme = []
        for i, item in enumerate(scheme_list[:num_weeks]):
            week_num = i + 1
            date_info = calculate_week_dates(start_date, week_num)
            
            # 🛡️ Fallback: Force outcomes if AI failed (Double check)
            if "outcomes" not in item or not item["outcomes"]:
                item["outcomes"] = ["Learners should be able to demonstrate understanding of the core concepts."]
            
            item['week'] = f"Week {week_num} {date_info['range_display']}"
            item['week_number'] = week_num
            item['isSpecialRow'] = (week_num == num_weeks)
            
            final_scheme.append(item)

        return final_scheme
    except Exception as e:
        print(f"❌ Scheme Error: {e}")
        return []

# =====================================================
# 2. WEEKLY PLAN GENERATOR
# =====================================================
async def generate_weekly_plan_from_scheme(
    school: str, subject: str, grade: str, term: str, 
    week_number: int, days: int, start_date: str, scheme_data: List[dict] = None
) -> Dict[str, Any]:
    """Breakdown a single week from a scheme into daily lesson topics."""
    
    print(f"\n🔍 DEBUG: Generating Weekly Plan for Week {week_number}...")

    context = {}
    if scheme_data:
        target_exact = f"Week {week_number}"
        target_prefix = f"Week {week_number} " 

        for w in scheme_data:
            if str(w.get('week_number', '')).strip() == str(week_number):
                context = w
                break
            week_label = str(w.get('week', ''))
            if week_label == target_exact or week_label.startswith(target_prefix):
                context = w
                break
        
        if context:
            print(f"✅ DEBUG: Found Context: {context.get('topic')}")

    prompt = f"""
    Act as a Senior Teacher. Break down this week into {days} individual teaching days.
    School: {school}, Subject: {subject}, Grade: {grade}, Week: {week_number}
    
    CONTEXT FROM SCHEME:
    - Topic: {context.get('topic', 'General Revision')}
    - Content: {context.get('content', [])}
    - Outcomes: {context.get('outcomes', [])}

    TASK:
    Output a JSON object with a "days" array. Each day must have:
    - "day": "Day 1", "Day 2", etc.
    - "subtopic": Specific sub-topic for the day
    - "objectives": List of learner-centered objectives
    - "activities": Teacher and Learner activities
    - "date": The specific date (starting from {start_date})
    
    **IMPORTANT**: Also include a "meta" object with "main_topic" set to the Scheme Topic.
    """

    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"❌ Weekly Error: {e}")
        return {"days": []}

# =====================================================
# 3. DETAILED LESSON PLANNER (UNCHANGED)
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
    print(f"\n📝 [Lesson Generator] Preparing Learner-Centered Plan for '{subtopic}'...")
    
    final_subtopic = subtopic if subtopic and subtopic.strip() else f"Generate a relevant subtopic for {theme}"
    final_objectives = objectives if objectives and len(objectives) > 0 else ["Generate 2-3 SMART objectives for this lesson"]

    prompt = f"""
    Act as a professional modern teacher in Zambia. Create a Lesson Plan.
    
    CONTEXT:
    - Teacher: {teacher_name}, School: {school_name}
    - Grade: {grade}, Subject: {subject}
    - Topic: {theme}, Sub-topic: {final_subtopic}
    - Date: {date}, Time: {time_start}-{time_end}
    - Objectives: {json.dumps(final_objectives)}

    STRICT METHODOLOGY RULES (LEARNER-CENTERED):
    1. **Role**: The teacher is a **FACILITATOR**, not a lecturer.
    2. **Methods**: Use ONLY learner-centered methods (e.g., Think-Pair-Share, Group Inquiry, Peer Teaching, Gallery Walk, Hands-on Activity, Brainstorming).
    3. **Teacher Activity**: Use verbs like "Facilitate", "Guide", "Monitor", "Support", "Prompt".
    4. **Learner Activity**: Learners must be DOING, DISCUSSING, or CREATING.

    STRICT CONTENT RULES:
    1. **Format**: Use **BULLET POINTS (•)**.
    2. **Summarize**: Keep content concise and actionable.
    3. **Structure**: Standard Zambian format (Rationale, Prerequisite, etc.).
    4. **JSON Safety**: Use \\n for newlines inside strings.

    OUTPUT JSON (Strict structure):
    {{
      "teacherName": "{teacher_name}",
      "schoolName": "{school_name}",
      "topic": "{theme}", 
      "subtopic": "{final_subtopic}",
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
            "teacherActivity": "• Prompt learners to recall [Prior Concept].\\n• Pose a provoking question about {final_subtopic}.\\n• Outline lesson objectives.", 
            "learnerActivity": "• Brainstorm answers in pairs.\\n• Share ideas with the class.\\n• Identify lesson goals.", 
            "method": "Think-Pair-Share & Brainstorming" 
        }},
        {{ 
            "stage": "DEVELOPMENT", 
            "time": "30 min", 
            "teacherActivity": "• Organize learners into small groups.\\n• Provide materials and instructions for the task.\\n• Move around to monitor and guide groups.\\n• Facilitate a mini-plenary for groups to share progress.", 
            "learnerActivity": "• Work in groups to solve/create [Task].\\n• Discuss findings with peers.\\n• Peer-assess other groups' work.", 
            "method": "Group Inquiry & Hands-on Activity" 
        }},
        {{ 
            "stage": "CONCLUSION", 
            "time": "5 min", 
            "teacherActivity": "• Facilitate a final reflection.\\n• Ask learners to state one new thing learned.\\n• Assign practical homework.", 
            "learnerActivity": "• Reflect on the learning process.\\n• Share key takeaways.\\n• Record homework task.", 
            "method": "Reflection & Class Discussion" 
        }}
      ]
    }}
    """

    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"❌ Lesson Error: {e}")
        return {}

# =====================================================
# 4. UTILITIES (Search & Quiz)
# =====================================================
async def generate_quiz_json(topic: str, grade: str) -> Dict[str, Any]:
    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=f"Generate 5 multiple choice questions for {topic} Grade {grade}.",
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        return json.loads(response.text)
    except:
        return {"questions": []}

async def optimize_search_term(user_query: str, subject: str) -> str:
    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=f"Convert this to a single searchable noun for educational images: '{user_query}' in {subject}.",
        )
        return response.text.strip()
    except:
        return user_query

async def generate_builder_json(topic: str, grade: str) -> Dict[str, Any]:
    return {}

async def generate_realistic_image(query: str) -> str:
    clean_query = re.sub(r'[^a-zA-Z0-9 ]', '', query)
    return f"https://image.pollinations.ai/prompt/{clean_query}?width=800&height=600&model=flux&nologo=true"