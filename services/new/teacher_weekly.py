import json
from typing import List, Dict, Any, Optional
# Ensure these imports point to the correct locations
from .teacher_shared import get_model, extract_json_string, find_structured_module_content
from .teacher_schemes import extract_scheme_details

# =====================================================
# WEEKLY PLAN GENERATOR (MERGED: MANUAL INPUTS + ROBUST REFERENCES)
# =====================================================
async def generate_weekly_plan_from_scheme(
    school: str, subject: str, grade: str, term: str, 
    week_number: int, days: int, start_date: str, 
    scheme_data: List[dict] = None,
    module_data: Optional[Dict[str, Any]] = None,
    school_logo: Optional[str] = None,
    manual_topic: Optional[str] = None,
    manual_subtopic: Optional[str] = None
) -> Dict[str, Any]:
    
    print(f"\n🗓️ [Weekly Generator] Request: Week {week_number}...")
    
    # 1. ALWAYS EXTRACT SCHEME DATA FIRST
    # We do this first so we can grab the 'refs' (References) from the database
    # regardless of whether the user provided a manual topic name or not.
    details = extract_scheme_details(scheme_data, week_number)

    # 2. APPLY MANUAL OVERRIDES (If provided)
    # Instead of creating a new 'details' dict, we just update the existing one.
    if manual_topic and manual_topic.strip():
        print(f"  🎯 [Override] Using Manually Selected Topic: {manual_topic}")
        details["topic"] = manual_topic
        details["found"] = True # Force found since we have user input
        
        # NOTE: We do NOT overwrite details['refs'] here. 
        # We keep the references found in step 1.

    # If still not found (no scheme data AND no manual input), use fallbacks
    if not details["found"]:
        print(f"   ⚠️ Week {week_number} not found in Scheme. Using generic fallback.")
        details["topic"] = f"General {subject} Concepts"
        details["refs"] = ["Standard Syllabus"]

    # 3. DETERMINE TARGET FOR MODULE SEARCH
    # If a subtopic is provided (lessonTitle), use that for the specific content search
    target_topic_for_module = manual_subtopic if manual_subtopic else details['topic']

    # 4. FETCH STRUCTURED MODULE CONTENT
    module_info = find_structured_module_content(module_data, target_topic_for_module)
    
    module_prompt_insert = ""
    
    # 5. CONSTRUCT REFERENCE LOGIC
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
        
        **MANDATORY INSTRUCTION**: 
        In the 'reference' field of the JSON, you MUST write: "Module Unit {module_info['unit_id']}, Page {module_info['pages']}".
        """
    else:
        # FALLBACK TO SCHEME REFERENCES
        # Now this works because we preserved 'details["refs"]' in Step 2
        print(f"   ↳ ⚠️ Module not found for '{target_topic_for_module}'. Falling back to Scheme References.")
        
        scheme_refs = details.get('refs', [])
        
        # Handle list vs string
        if isinstance(scheme_refs, list):
            # Filter out empty strings/None
            valid_refs = [str(r) for r in scheme_refs if r]
            scheme_refs_str = ", ".join(valid_refs)
        else:
            scheme_refs_str = str(scheme_refs)

        if not scheme_refs_str or scheme_refs_str.lower() in ["none", ""]: 
            scheme_refs_str = "Approved Syllabus"

        module_prompt_insert = f"""
        ⚠️ **MODULE DATA NOT FOUND**
        
        **MANDATORY INSTRUCTION**:
        You MUST use the 'REFERENCES' from the Scheme: "{scheme_refs_str}".
        In the 'reference' field of the JSON output, write exactly: "{scheme_refs_str}".
        """

    model = get_model() 
    
    # 6. PROMPT
    subtopic_instruction = f"Break the topic into {days} logical daily lessons."
    if manual_subtopic:
        subtopic_instruction = f"Focus heavily on the subtopic: '{manual_subtopic}' and break it into {days} detailed daily lessons."

    prompt = f"""
    Act as a Senior Teacher in Zambia. Create a Weekly Lesson Plan for {days} days.
    
    CONTEXT:
    - Subject: {subject}, Grade: {grade}, Term: {term}, Week: {week_number}
    - Main Topic: {details['topic']}
    - Competencies: {", ".join(details.get('specific_competences', []))}
    
    {module_prompt_insert}

    INSTRUCTIONS:
    - **Topic**: Use "{details['topic']}".
    - **Subtopic**: {subtopic_instruction}
    - **Scope of Lesson**: Clear teacher notes.
    - **Reference**: STRICTLY follow the 'MANDATORY INSTRUCTION' above. 

    OUTPUT JSON ONLY:
    {{
      "meta": {{ 
          "week_number": {week_number}, 
          "term": "{term}",
          "main_topic": "{details['topic']}"
      }},
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
        plan_json = json.loads(extract_json_string(response.text))
        
        if "meta" in plan_json:
            plan_json["meta"]["main_topic"] = details['topic']
            
        return plan_json
    except Exception as e:
        print(f"❌ [Weekly Generator] Error: {e}")
        return {"days": [], "meta": {"week_number": week_number, "main_topic": details.get('topic', 'Unknown')}}