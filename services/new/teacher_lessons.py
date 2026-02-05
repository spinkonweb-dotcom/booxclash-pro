import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from .teacher_shared import get_model, extract_json_string, find_structured_module_content

# ==============================================================================
# 1. GENERATE SPECIFIC LESSON PLAN
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
    scheme_references: str = "Standard Zambian Syllabus" 
) -> Dict[str, Any]:
    
    print(f"\n🔍 [Lesson Generator] Processing: {theme} - {subtopic}")

    # 1. Try to find module content
    module_info = find_structured_module_content(module_data, subtopic)
    if not module_info:
        module_info = find_structured_module_content(module_data, theme)

    # Calculations
    boys = attendance.get('boys', 0)
    girls = attendance.get('girls', 0)
    total_students = boys + girls

    module_prompt_insert = ""
    final_reference = scheme_references

    # ----------------------------------------------------------------------
    # ✅ SCENARIO A: OFFICIAL MODULE FOUND
    # ----------------------------------------------------------------------
    if module_info:

        unit_id = module_info.get("topic_id", "N/A")
        pages = module_info.get("pages", "N/A")
        module_text = module_info.get("context_text", "")

        # Ensure page numbers exist
        if not pages or pages == "N/A":
            print("⚠️ WARNING: Module found but NO PAGE NUMBER detected.")
        else:
            print(f"  ↳ 📘 Module Page Identified: {pages}")

        final_reference = f"Official Module Sub-Topic {unit_id}, Page {pages}"

        print(f"  ↳ ✅ OFFICIAL MODULE FOUND: {final_reference}")

        module_prompt_insert = f"""
        🔥🔥 **SOURCE MATERIAL: OFFICIAL GOVERNMENT MODULE** 🔥🔥
        **STRICT RULES**:
        1. Only use the instructional blocks below.
        2. Rebuild the 'Development' stage using EXACT teacher_steps and learner_tasks.
        3. You MUST cite Activity IDs exactly as written (e.g. "Activity 1.2").
        4. Page number must appear in references and nowhere else.

        **MODULE CONTENT START**  
        {module_text}  
        **MODULE CONTENT END**
        """

    # ----------------------------------------------------------------------
    # ❌ SCENARIO B: FALLBACK TO SYLLABUS
    # ----------------------------------------------------------------------
    else:
        print("  ↳ ⚠️ No Module Match. Using Syllabus.")

        final_reference = f"Zambian Syllabus: {subject} {grade}"
        if scheme_references and scheme_references != "Standard Zambian Syllabus":
            final_reference += f" | Refs: {scheme_references}"

        module_prompt_insert = f"""
        🔥🔥 **SOURCE MATERIAL: ZAMBIAN SYLLABUS ({grade})** 🔥🔥
        Strict Requirements:
        1. Use ONLY syllabus learning outcomes for {theme}.
        2. NO module activities are available — DO NOT invent any.
        3. Include 1–2 external MoE-approved educational links.
        """

    model = get_model()

    # ----------------------------------------------------------------------
    # PROMPT (Do NOT alter format)
    # ----------------------------------------------------------------------
    prompt = f"""
    Act as a professional teacher in Zambia. Create a **CBC Lesson Plan**.

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

      "materials": "List specific aids from the module if available.",
      "references": "{final_reference}",

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
            "teacherActivity": "Use EXACT steps from module activities.",
            "learnerActivity": "Perform module learner tasks.",
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

    # ----------------------------------------------------------------------
    # EXECUTE
    # ----------------------------------------------------------------------
    try:
        response = await model.generate_content_async(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        data = json.loads(extract_json_string(response.text))

        # Force reference correctness
        data["references"] = final_reference

        data["evaluation_footer"] = "LESSON EVALUATION:\n" + ("." * 200)

        return data

    except Exception as e:
        print(f"❌ Error: {e}")
        return {
            "topic": theme,
            "subtopic": subtopic,
            "references": final_reference,
            "steps": [],
            "error": "Failed to generate lesson plan."
        }

# ==============================================================================
# 2. GENERATE LESSON NOTES (BLACKBOARD CONTENT)
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
    module_context_str = f"⚠️ No module data found. STRICTLY use the Zambian Syllabus content for {topic}."

    if module_info:
        unit_id = module_info.get("topic_id", "N/A")
        pages = module_info.get("pages", "N/A")
        reference_str = f"Official Module Unit {unit_id}, Page {pages}"
        
        print(f"  ↳ ✅ Module Context Found for Notes")
        
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
    2. **Diagrams**: If a concept (like the Heart, Map of Zambia, Circuit, etc.) usually requires a diagram, include a text description: "[DIAGRAM: Draw a labeled diagram of...]"
    3. **Content**: No general knowledge. Summarize the provided text or standard syllabus definitions only.
    4. **Activities**: Include a class exercise and homework derived from the module/syllabus.

    **OUTPUT JSON:**
    {{
      "topic_heading": "{subtopic}",
      "reference": "{reference_str}",
      "explanation_points": [
        "Definition: ...",
        "Key Point 1...",
        "Key Point 2...",
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
        return json.loads(extract_json_string(response.text))

    except Exception as e:
        print(f"❌ [Notes Generator] Error: {e}")
        return {
            "topic_heading": subtopic, 
            "reference": reference_str, 
            "explanation_points": ["Error generating notes."], 
            "class_exercise": []
        }