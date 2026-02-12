import json
from typing import List, Dict, Any, Optional
# Ensure these imports point to the correct locations
from .teacher_shared import get_model, extract_json_string, find_structured_module_content
from .teacher_schemes import extract_scheme_details

# =====================================================
# 2. WEEKLY PLAN GENERATOR (UPDATED FOR MANUAL OVERRIDES)
# =====================================================
async def generate_weekly_plan_from_scheme(
    school: str, subject: str, grade: str, term: str, 
    week_number: int, days: int, start_date: str, 
    scheme_data: List[dict] = None,
    module_data: Optional[Dict[str, Any]] = None,
    school_logo: Optional[str] = None,
    manual_topic: Optional[str] = None,     # ⚡️ Added manual override
    manual_subtopic: Optional[str] = None   # ⚡️ Added manual override
) -> Dict[str, Any]:
    
    print(f"\n🗓️ [Weekly Generator] Request: Week {week_number}...")
    
    # 1. DETERMINE THE TARGET TOPIC (Manual vs Scheme)
    # If a teacher selected a topic from a different week in the UI, use that.
    if manual_topic and manual_topic.strip():
        print(f"  🎯 [Override] Using Manually Selected Topic: {manual_topic}")
        details = {
            "found": True,
            "topic": manual_topic,
            "specific_competences": [], # AI will generate these based on topic
            "refs": ["Syllabus"],
            "component": subject,
            "methods": ["Inquiry based learning"],
            "resources": ["Textbook", "Local environment"]
        }
        # If we have a subtopic, inject it into the prompt context later
        target_topic_for_module = manual_subtopic if manual_subtopic else manual_topic
    else:
        # Standard lookup: Find what is scheduled for this week in the Scheme
        details = extract_scheme_details(scheme_data, week_number)
        target_topic_for_module = details['topic']

    if not details["found"]:
        print(f"   ⚠️ Week {week_number} not found in Scheme. Using generic fallback.")
        details["topic"] = f"General {subject} Concepts"
        details["refs"] = ["Standard Syllabus"]

    # 2. FETCH STRUCTURED MODULE CONTENT
    # Use the specific topic (manual or scheme-derived) to find textbook content
    module_info = find_structured_module_content(module_data, target_topic_for_module)
    
    module_prompt_insert = ""
    
    # 3. ROBUST REFERENCE LOGIC
    if module_info:
        print(f"   ↳ ✅ Module Found: Unit {module_info['unit_id']}, Pages: {module_info['pages']}")
        module_prompt_insert = f"""
        🔥🔥 **OFFICIAL MODULE DATA FOUND** 🔥🔥
        1. **UNIT ID**: {module_info['unit_id']}
        2. **PAGE NUMBERS**: {module_info['pages']}
        3. **CONTENT SOURCE**: Use the specific content below to fill 'scope_of_lesson' and 'learning_activity'.
        
        --- MODULE CONTENT START ---
        {module_info['context_text']}
        --- MODULE CONTENT END ---
        
        **MANDATORY INSTRUCTION**: 
        In the 'reference' field of the JSON, you MUST write: "Module Unit {module_info['unit_id']}, Page {module_info['pages']}".
        """
    else:
        print(f"   ↳ ⚠️ Module not found for Topic: '{details['topic']}'. Falling back to Scheme References.")
        scheme_refs = details.get('refs', [])
        scheme_refs_str = ", ".join(scheme_refs) if isinstance(scheme_refs, list) else str(scheme_refs)
        if not scheme_refs_str or scheme_refs_str == "None": 
            scheme_refs_str = "Syllabus"

        module_prompt_insert = f"""
        ⚠️ **MODULE DATA NOT FOUND**
        **MANDATORY INSTRUCTION**:
        You MUST use the 'REFERENCES' from the Scheme: "{scheme_refs_str}".
        In the 'reference' field of the JSON output, write exactly: "{scheme_refs_str}".
        """

    model = get_model() 
    
    # 4. PROMPT (Refined to prioritize manual subtopic)
    subtopic_instruction = f"Break the topic into {days} logical daily lessons."
    if manual_subtopic:
        subtopic_instruction = f"Focus heavily on the subtopic: '{manual_subtopic}' and break it into {days} detailed daily lessons."

    prompt = f"""
    Act as a Senior Teacher in Zambia. Create a Weekly Lesson Plan for {days} days.
    
    CONTEXT:
    - Subject: {subject}, Grade: {grade}, Term: {term}, Week: {week_number}
    - Main Topic: {details['topic']}
    {"- Specific Sub-topic: " + manual_subtopic if manual_subtopic else ""}
    - Competencies: {", ".join(details.get('specific_competences', []))}
    
    {module_prompt_insert}

    INSTRUCTIONS:
    - **Topic**: Use "{details['topic']}".
    - **Subtopic**: {subtopic_instruction}
    - **Scope of Lesson**: Provide clear teacher notes. If Module Data is present, use it.
    - **Language**: Use Zambian English educational terminology.

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
        
        # Self-Healing: Ensure meta topic matches what we requested
        if "meta" in plan_json:
            plan_json["meta"]["main_topic"] = details['topic']
            
        return plan_json
    except Exception as e:
        print(f"❌ [Weekly Generator] Error: {e}")
        return {"days": [], "meta": {"week_number": week_number, "main_topic": details['topic']}}