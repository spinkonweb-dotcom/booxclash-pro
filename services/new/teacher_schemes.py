import json
import math
from typing import List, Dict, Any, Union
from .teacher_shared import get_model, extract_json_string, calculate_week_dates

async def generate_scheme_with_ai(
    syllabus_data: Union[List[dict], Dict[str, Any]], 
    subject: str, grade: str, term: str, num_weeks: int,
    start_date: str = "2026-01-12" 
) -> Dict[str, Any]:
    
    print(f"\n📘 [Scheme Generator] Processing for {subject} Grade {grade}...")
    
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
    
    # TERM SPLITTING LOGIC
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
    if not term_syllabus_data and total_units > 0:
        term_syllabus_data = topics_list

    # DATA SUMMARY & REFERENCE BUILDING
    syllabus_summary = []
    syllabus_book = f"{subject} Syllabus {grade}"
    
    for t in term_syllabus_data:
        if isinstance(t, dict):
            unit_code = t.get("unit") or t.get("unit_number") or t.get("number") or ""
            topic_title = t.get("topic_title") or t.get("topic") or ""
            syl_page = t.get("syllabus_page") or t.get("page_number") or t.get("page")
            
            strict_refs = []
            if syl_page:
                strict_refs.append(f"{syllabus_book} Pg {syl_page}")
            else:
                strict_refs.append(f"{syllabus_book}")

            module_refs = t.get("references") or t.get("refs") or t.get("textbook_refs")
            has_module_data = False
            if module_refs:
                has_module_data = True
                if isinstance(module_refs, list): strict_refs.extend(module_refs)
                elif isinstance(module_refs, str): strict_refs.append(module_refs)
            
            allow_external = not has_module_data

            syllabus_summary.append({
                "unit_prefix": unit_code,
                "topic": topic_title,
                "content": t.get("subtopics") or t.get("content") or [],
                "outcomes": t.get("learning_outcomes") or t.get("specific_outcomes") or "",
                "forced_references": strict_refs,
                "allow_external": allow_external 
            })
        elif isinstance(t, str):
            syllabus_summary.append({
                "unit_prefix": "", "topic": t, "forced_references": [syllabus_book], "allow_external": True
            })

    model = get_model()
    prompt = f"""
    Act as a Senior Head Teacher. Create a professional Scheme of Work.
    DETAILS: Subject: {subject}, Grade: {grade}, Term: {term}, Duration: {num_weeks} Weeks
    PROVIDED INTRO DATA: {json.dumps(provided_intro)}
    SYLLABUS DATA: {json.dumps(syllabus_summary)}
    INSTRUCTIONS:
    1. Structure: Create exactly {num_weeks} weeks.
    2. Content: Map provided Topics to weeks.
    3. REFERENCES (CRITICAL):
       - Rule A (Syllabus): Include "{syllabus_book} Pg X".
       - Rule B (Module): If 'forced_references' has other books, INCLUDE them.
       - Rule C (External): ONLY if 'allow_external' is TRUE, append ONE reputable online source.
    OUTPUT JSON FORMAT (Strict):
    {{ "intro_info": {{...}}, "scheme_weeks": [ {{ "week": "Week 1", "topic": "...", "references": ["..."] }} ] }}
    """
    
    try:
        response = await model.generate_content_async(prompt, generation_config={"response_mime_type": "application/json"})
        data = json.loads(extract_json_string(response.text))

        if "scheme_weeks" not in data and isinstance(data, list):
            data = {"intro_info": {}, "scheme_weeks": data}
        
        cleaned_weeks = []
        raw_weeks = data.get("scheme_weeks", [])

        for i, item in enumerate(raw_weeks):
            week_num = i + 1
            if week_num > num_weeks: break 
            date_info = calculate_week_dates(start_date, week_num)
            
            item['week'] = f"Week {week_num} ({date_info['month']}) ({date_info['range_display']})"
            item['week_number'] = week_num
            item['date_start'] = date_info['start_iso']
            item['date_end'] = date_info['end_iso']
            
            if i < len(syllabus_summary):
                source = syllabus_summary[i]
                strict_refs = source.get("forced_references", [])
                ai_refs = item.get("references")
                if not ai_refs or ai_refs == [""]:
                    item['references'] = strict_refs
                elif isinstance(ai_refs, list) and len(strict_refs) > 0:
                    if not any(strict_refs[0] in r for r in ai_refs):
                        item['references'] = strict_refs + ai_refs

            cleaned_weeks.append(item)
            
        return {"intro_info": data.get("intro_info", {}), "weeks": cleaned_weeks}
    except Exception as e:
        print(f"❌ [Scheme Generator] Failed: {e}")
        return {"intro_info": {}, "weeks": []}

def extract_scheme_details(scheme_data: List[dict], week_number: int) -> Dict[str, Any]:
    print(f"🔍 [Scheme Extractor] Looking for Week {week_number}...")
    if not scheme_data:
        return {"found": False, "topic": f"Week {week_number}", "refs": []}

    week_key = str(week_number).strip()
    found_week = next((item for item in scheme_data if str(item.get("week_number", "")).strip() == week_key or str(item.get("week", "")).lower().replace("week", "").strip().split()[0] == week_key), None)

    if not found_week:
        print(f"❌ [Scheme Extractor] Week {week_number} not found.")
        return {"found": False}

    def ensure_list(val):
        if isinstance(val, list): return val
        if isinstance(val, str) and val: return [val]
        return []

    return {
        "found": True,
        "component": found_week.get("unit") or found_week.get("topic") or "Topic Not Set",
        "topic": found_week.get("topic") or "Topic Not Set",
        "subtopic": found_week.get("subtopic", ""),
        "prescribed_competences": ensure_list(found_week.get("prescribed_competences")),
        "specific_competences": ensure_list(found_week.get("specific_competences")),
        "content": ensure_list(found_week.get("content")),
        "learning_activities": ensure_list(found_week.get("learning_activities")),
        "methods": ensure_list(found_week.get("methods")),
        "resources": ensure_list(found_week.get("resources")),
        "assessment": ensure_list(found_week.get("assessment")),
        "refs": ensure_list(found_week.get("references"))
    }