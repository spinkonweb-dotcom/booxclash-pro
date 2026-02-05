import json
from typing import List, Dict, Any, Optional
from .teacher_shared import get_model, extract_json_string, find_structured_module_content
from .teacher_schemes import extract_scheme_details

async def generate_weekly_plan_from_scheme(
    school: str, subject: str, grade: str, term: str, 
    week_number: int, days: int, start_date: str, 
    scheme_data: List[dict] = None,
    module_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    
    print(f"\n🗓️ [Weekly Generator] Request: Week {week_number}...")
    details = extract_scheme_details(scheme_data, week_number)
    
    if not details["found"]:
        print(f"   ⚠️ Week {week_number} not found in Scheme. Using generic fallback.")
        details["topic"] = f"General {subject} Concepts"
        details["refs"] = "Standard Syllabus"

    module_info = find_structured_module_content(module_data, details['topic'])
    module_prompt_insert = ""
    
    if module_info:
        print(f"   ↳ ✅ Module Found: Unit {module_info['unit_id']}, Pages: {module_info['pages']}")
        module_prompt_insert = f"""
        🔥🔥 **OFFICIAL MODULE DATA FOUND** 🔥🔥
        1. **UNIT ID**: {module_info['unit_id']}
        2. **PAGE NUMBERS**: {module_info['pages']}
        3. **CONTENT SOURCE**: Use the specific activities below.
        --- MODULE CONTENT START ---
        {module_info['context_text']}
        --- MODULE CONTENT END ---
        **MANDATORY INSTRUCTION**: Reference "Module Unit {module_info['unit_id']}, Page {module_info['pages']}".
        """
    else:
        print(f"   ↳ ⚠️ Module not found for Topic: '{details['topic']}'. Falling back to Scheme References.")
        module_prompt_insert = f"""
        ⚠️ **MODULE DATA NOT FOUND**
        **MANDATORY INSTRUCTION**: Use REFERENCES from Scheme: "{details.get('refs', 'Syllabus')}".
        """

    model = get_model() 
    prompt = f"""
    Act as a Senior Teacher in Zambia. Create a Weekly Lesson Plan for {days} days.
    CONTEXT: Subject: {subject}, Grade: {grade}, Term: {term}, Week: {week_number}
    Topic: {details['topic']}
    Competencies: {", ".join(details.get('specific_competences', []))}
    {module_prompt_insert}
    INSTRUCTIONS: Break topic into {days} daily lessons. Summarize Teacher/Learner steps if Module present.
    OUTPUT JSON ONLY: {{ "meta": {{...}}, "days": [ {{ "day": "Monday", "topic": "...", "scope_of_lesson": "...", "reference": "..." }} ] }}
    """
    
    try:
        response = await model.generate_content_async(prompt, generation_config={"response_mime_type": "application/json"})
        return json.loads(extract_json_string(response.text))
    except Exception as e:
        print(f"❌ [Weekly Generator] Error: {e}")
        return {"days": []}