import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
# Ensure you are importing from the correct shared location
from .teacher_shared import get_model, extract_json_string, find_structured_module_content

# ==============================================================================
# 1. GENERATE SPECIFIC LESSON PLAN (Dynamic References + Bloom's Taxonomy)
# ==============================================================================
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
    blooms_level: str = "" # ✅ ADDED: New Parameter
) -> Dict[str, Any]:
    
    print(f"\n🔍 [Lesson Generator] Processing: {theme} - {subtopic} | Bloom's: {blooms_level}")

    # 1. SMART MODULE SEARCH
    module_info = find_structured_module_content(module_data, subtopic)
    if not module_info:
        module_info = find_structured_module_content(module_data, theme)

    # 2. CALCULATE CONTEXT
    boys = attendance.get('boys', 0)
    girls = attendance.get('girls', 0)
    total_students = boys + girls

    # 3. DETERMINE SOURCE MATERIAL & REFERENCES
    module_prompt_insert = ""
    
    # We use this to decide if we should overwrite the AI's output later
    strict_ref_override = False 
    final_reference_string = scheme_references

    # ✅ SCENARIO A: OFFICIAL MODULE FOUND
    if module_info:
        unit_id = module_info.get("topic_id", module_info.get("unit_id", "N/A"))
        pages = module_info.get("pages", "N/A")
        module_text = module_info.get("context_text", "")

        if pages and pages != "N/A":
            final_reference_string = f"Official Module Unit {unit_id}, Page {pages}"
            strict_ref_override = True # Force this exact string
            print(f"   ↳ ✅ OFFICIAL MODULE FOUND: {final_reference_string}")
        else:
            print("   ↳ ⚠️ Module found but missing page numbers.")

        module_prompt_insert = f"""
        🔥🔥 **SOURCE MATERIAL: OFFICIAL GOVERNMENT MODULE** 🔥🔥
        **STRICT RULES**:
        1. **TEACHER ACTIVITY**: You MUST derive the steps EXACTLY from the text below.
        2. **INTERNAL CITATIONS**: When describing a step, cite the specific Activity Number (e.g., "Activity 1.2").
        3. **REFERENCE FIELD**: In the JSON output, you MUST set "references" to exactly: "{final_reference_string}".

        **MODULE CONTENT START** {module_text}  
        **MODULE CONTENT END**
        """

    # ❌ SCENARIO B: FALLBACK (EXTERNAL RESOURCES)
    else:
        print(f"   ↳ ⚠️ No Module Match. Enabling External Resource Search.")
        strict_ref_override = False # Let AI generate the list

        module_prompt_insert = f"""
        🔥🔥 **SOURCE MATERIAL: EXTERNAL RESEARCH REQUIRED** 🔥🔥
        **STRICT RULES**:
        1. **CONTENT SOURCE**: Since no official module is available, you MUST incorporate content from reputable **external journals, educational websites, and standard textbooks**.
        2. **ACTIVITIES**: Create engaging activities and **explicitly reference these external materials** inside the steps (e.g., "Using resources from Khan Academy...", "Referencing [Journal Name] activity...").
        3. **REFERENCE FIELD**: 
           - DO NOT just write "Standard Zambian Syllabus".
           - **LIST the specific sources** you used for this lesson.
           - Example: "Zambian Syllabus, Khan Academy (Algebra), Oxford Mathematics Book 9".
        """

    model = get_model()
    
    # Decide what to show in the prompt example
    ref_placeholder = final_reference_string if strict_ref_override else "List specific external sources used (Websites, Books, Journals)..."

    # ✅ BLOOM'S TAXONOMY INSTRUCTION
    blooms_instruction = ""
    if blooms_level:
        blooms_instruction = f"""
        🧠 **PEDAGOGICAL FOCUS**: 
        This lesson MUST differ from a standard lesson by focusing on the **{blooms_level}** level of Bloom's Taxonomy.
        - Ensure the **Specific Outcomes** use verbs associated with {blooms_level} (e.g., if Analyzing, use 'Differentiate', 'Compare').
        - Ensure **Learner Activities** challenge students at this cognitive level.
        """

    # 4. PROMPT (Strict Structure)
    prompt = f"""
    Act as a professional teacher in Zambia. Create a **Competence Based Curriculum (CBC)** Lesson Plan.

    CONTEXT:
    - School: "{school_name}"
    - Teacher: "{teacher_name}"
    - Grade: {grade}, Subject: {subject}
    - Topic: "{theme}"
    - Subtopic: "{subtopic}"
    - Objectives: {json.dumps(objectives)}
    
    {blooms_instruction}

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

      "materials": "List specific aids from the module OR external materials used (websites, journals, realia).",
      "references": "{ref_placeholder}",

      "steps": [
        {{
            "stage": "INTRODUCTION",
            "time": "5 min",
            "teacherActivity": "Hook learners using the subtopic.",
            "learnerActivity": "...",
            "assessment_criteria": "..."
        }},
        {{
            "stage": "DEVELOPMENT",
            "time": "30 min",
            "teacherActivity": "Step-by-step instructions. IF MODULE FOUND: Cite Activity #. IF NOT: Cite external resource.",
            "learnerActivity": "Corresponding learner tasks.",
            "assessment_criteria": "..."
        }},
        {{
            "stage": "CONCLUSION",
            "time": "5 min",
            "teacherActivity": "Summarise key ideas.",
            "learnerActivity": "...",
            "assessment_criteria": "..."
        }}
      ],

      "homework_content": "A short task."
    }}
    """

    # 5. EXECUTE AND CLEAN
    try:
        response = await model.generate_content_async(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        data = json.loads(extract_json_string(response.text))

        # ✅ LOGIC UPDATE: Only overwrite references if we found an Official Module
        if strict_ref_override:
            data["references"] = final_reference_string
        
        # Add Footer for printing
        data["evaluation_footer"] = "LESSON EVALUATION:\n" + ("." * 200)

        return data

    except Exception as e:
        print(f"❌ Error: {e}")
        return {
            "topic": theme,
            "subtopic": subtopic,
            "references": scheme_references, # Fallback on error
            "steps": [],
            "error": "Failed to generate lesson plan."
        }


# ==============================================================================
# 2. GENERATE LESSON NOTES (Blackboard Content)
# ==============================================================================
async def generate_lesson_notes(
    grade: str, 
    subject: str, 
    topic: str, 
    subtopic: str,
    module_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    
    print(f"\n📝 [Notes Generator] Generating for: {topic} - {subtopic}")
    
    # 1. Find Module Context
    module_info = find_structured_module_content(module_data, subtopic)
    if not module_info: 
        module_info = find_structured_module_content(module_data, topic)

    reference_str = f"Zambian Syllabus: {subject} {grade}"
    module_context_str = f"⚠️ No module data found. Search for standard definitions and examples from reputable educational sources."

    if module_info:
        unit_id = module_info.get("topic_id", module_info.get("unit_id", "N/A"))
        pages = module_info.get("pages", "N/A")
        
        if pages and pages != "N/A":
            reference_str = f"Official Module Unit {unit_id}, Page {pages}"
            print(f"   ↳ ✅ Module Context Found for Notes")
            
            module_context_str = f"""
            🔥🔥 **OFFICIAL CONTENT SOURCE** 🔥🔥
            **Use ONLY the following text to extract definitions and examples:**
            {module_info.get('context_text', '')}
            """

    # 2. Build Prompt
    model = get_model()
    
    prompt = f"""
    Act as a Teacher in Zambia preparing **Blackboard Notes** for a {grade} class.
    
    **CONTEXT:**
    - Subject: {subject}
    - Topic: {topic}
    - Subtopic: {subtopic}
    
    {module_context_str}

    **INSTRUCTIONS:**
    1. **Format**: Use clear **bullet points** for explanations.
    2. **Diagrams**: If a concept requires a diagram, include a text description: "[DIAGRAM: Draw...]"
    3. **Content**: If Module is present, summarize it. If not, use standard syllabus definitions.
    4. **Activities**: Include a class exercise.
    5. **Reference**: You MUST set the reference to: "{reference_str}".

    **OUTPUT JSON:**
    {{
      "topic_heading": "{subtopic}",
      "reference": "{reference_str}",
      "explanation_points": [
        "Definition: ...",
        "Key Point 1...",
        "[DIAGRAM: Description of diagram if needed]" 
      ],
      "examples": ["Example A", "Example B"],
      "class_exercise": ["Q1", "Q2", "Q3"],
      "homework_question": ["Q1 (Homework)"]
    }}
    """

    # 3. Execute
    try:
        response = await model.generate_content_async(
            prompt, 
            generation_config={"response_mime_type": "application/json"}
        )
        data = json.loads(extract_json_string(response.text))
        
        # Notes usually need strict references, but you can relax this if needed
        data["reference"] = reference_str 
        
        return data

    except Exception as e:
        print(f"❌ [Notes Generator] Error: {e}")
        return {
            "topic_heading": subtopic, 
            "reference": reference_str, 
            "explanation_points": ["Error generating notes."], 
            "class_exercise": []
        }