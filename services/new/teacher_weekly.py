import json
from typing import List, Dict, Any, Optional
# Ensure these imports point to the correct locations
from .teacher_shared import get_model, extract_json_string, find_structured_module_content
from .teacher_schemes import extract_scheme_details

# =====================================================
# 2. WEEKLY PLAN GENERATOR (ROBUST REFERENCES)
# =====================================================
async def generate_weekly_plan_from_scheme(
    school: str, subject: str, grade: str, term: str, 
    week_number: int, days: int, start_date: str, 
    scheme_data: List[dict] = None,
    module_data: Optional[Dict[str, Any]] = None,
    school_logo: Optional[str] = None  # <--- ADDED THIS ARGUMENT TO FIX THE ERROR
) -> Dict[str, Any]:
    
    print(f"\n🗓️ [Weekly Generator] Request: Week {week_number}...")
    
    # 1. USE THE EXTRACTOR HELPER
    # This helper robustly finds the week data (Topic, Competencies, existing Refs)
    details = extract_scheme_details(scheme_data, week_number)
    
    if not details["found"]:
        print(f"   ⚠️ Week {week_number} not found in Scheme. Using generic fallback.")
        details["topic"] = f"General {subject} Concepts"
        details["refs"] = ["Standard Syllabus"]

    # 2. FETCH STRUCTURED MODULE CONTENT
    # We search using the Topic name from the Scheme (e.g., "Unit 1.1: Branches of Chemistry")
    module_info = find_structured_module_content(module_data, details['topic'])
    
    module_prompt_insert = ""
    
    # 3. ROBUST REFERENCE LOGIC
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
        
        # Ensure we have a string for the prompt, even if refs is a list
        scheme_refs = details.get('refs', [])
        if isinstance(scheme_refs, list):
            scheme_refs_str = ", ".join(scheme_refs)
        else:
            scheme_refs_str = str(scheme_refs)

        # Default if empty
        if not scheme_refs_str: 
            scheme_refs_str = "Syllabus"

        module_prompt_insert = f"""
        ⚠️ **MODULE DATA NOT FOUND**
        
        **MANDATORY INSTRUCTION**:
        You MUST use the 'REFERENCES' from the Scheme of Work provided: "{scheme_refs_str}".
        
        In the 'reference' field of the JSON output, write exactly: "{scheme_refs_str}".
        """

    model = get_model() 
    
    # 4. PROMPT
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