import json
import os
from pathlib import Path
from typing import List, Dict, Any, Union, Optional

# ==========================================
# 1. CURRICULUM ROUTING LOGIC
# ==========================================

# Define which grades use the NEW Curriculum (CBC)
NEW_CURRICULUM_GRADES = {
    "pre-school", "reception", 
    "grade 1", "grade 2", "grade 4", 
    "form 1", "form 2", "form 3", "form 4"
}

# Define which grades use the OLD Curriculum
OLD_CURRICULUM_GRADES = {
    "grade 3", "grade 6", "grade 5", "grade 7", 
    "grade 10", "grade 11", "grade 12"
}

def get_curriculum_folder(grade: str) -> str:
    """
    Determines if we should look in 'syllabi/new' or 'syllabi/old'.
    """
    norm_grade = str(grade).lower().strip()
    
    if norm_grade in NEW_CURRICULUM_GRADES or f"grade {norm_grade}" in NEW_CURRICULUM_GRADES:
        return "new"
    elif norm_grade in OLD_CURRICULUM_GRADES or f"grade {norm_grade}" in OLD_CURRICULUM_GRADES:
        return "old"
    
    return "new"

# ==========================================
# 2. ROBUST DIRECTORY CONFIGURATION
# ==========================================
def get_root_dir(folder_name: str) -> Path:
    current_file = Path(__file__).resolve()
    paths_to_check = [
        current_file.parent.parent / folder_name,
        Path(os.getcwd()) / folder_name,
        Path(os.getcwd()) / "backend-fastapi" / folder_name,
        current_file.parent / folder_name
    ]
    for path in paths_to_check:
        if path.exists() and path.is_dir():
            return path
    return current_file.parent.parent / folder_name

SYLLABI_ROOT_DIR = get_root_dir("syllabi")
MODULES_ROOT_DIR = get_root_dir("modules")

# ==========================================
# 3. ROBUST FILE FINDER
# ==========================================

def find_file(root_dir: Path, country: str, grade: str, subject: str, must_include: str = "") -> Optional[Path]:
    if not root_dir.exists():
        return None

    curr_type = get_curriculum_folder(grade)
    target_dir = root_dir / curr_type
    
    if not target_dir.exists():
        target_dir = root_dir

    search_country = country.lower().strip()
    search_subject = subject.lower().strip().replace(" ", "_")
    
    # Clean input for search
    raw_input = str(grade).lower().replace(" ", "")
    
    # STRICT TAG GENERATION
    # If input is "form1", only look for form tags. If "grade1", only grade tags.
    possible_grade_tags = []
    
    # Extract number (e.g. "1" from "form1")
    raw_num = raw_input.replace("grade", "").replace("form", "")

    if "form" in raw_input:
        # Looking for Form files (e.g., ...grade_form_1.json or ...form_1.json)
        possible_grade_tags = [f"form{raw_num}", f"form_{raw_num}"] 
    elif "grade" in raw_input:
        # Looking for Grade files (e.g., ...grade_1.json)
        possible_grade_tags = [f"grade{raw_num}", f"grade_{raw_num}"]
    else:
        # Fallback if just "1" is passed
        possible_grade_tags = [f"grade{raw_num}", f"grade_{raw_num}", f"form{raw_num}"]

    for file_path in target_dir.glob("*.json"):
        filename = file_path.name.lower()
        
        if must_include and must_include not in filename: continue
        if search_country not in filename and "zambia" not in filename: pass 
        if search_subject not in filename: continue
            
        # Strict Grade Check
        if any(tag in filename for tag in possible_grade_tags):
            # Anti-collision check: If looking for "Grade 1", ensure we didn't hit "Grade Form 1"
            if "grade" in raw_input and "form" not in raw_input:
                if "form" in filename:
                    continue # Skip Form files when asking for Grade
                    
            print(f"✅ Found {must_include if must_include else 'Syllabus'} File: {filename}")
            return file_path
            
    return None

def find_syllabus_file(country: str, grade: str, subject: str) -> Optional[Path]:
    return find_file(SYLLABI_ROOT_DIR, country, grade, subject)

def find_module_file(country: str, grade: str, subject: str) -> Optional[Path]:
    return find_file(MODULES_ROOT_DIR, country, grade, subject, must_include="module")

# ==========================================
# 4. LOADERS & HELPERS
# ==========================================

def load_syllabus(country: str, grade: str, subject: str) -> List[Dict[str, Any]]:
    file_path = find_syllabus_file(country, grade, subject)
    if file_path and file_path.exists():
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict):
                    if "topics" in data: return data["topics"]
                    elif "content" in data: return data["content"]
                    else: return [data]
                elif isinstance(data, list):
                    return data
        except Exception as e:
            print(f"❌ JSON Error in {file_path.name}: {e}")
            return []
    return []

def load_module(country: str, grade: str, subject: str) -> Optional[Dict[str, Any]]:
    file_path = find_module_file(country, grade, subject)
    if file_path and file_path.exists():
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return None
    return None

def get_subjects_for_grade(grade: str) -> list[str]:
    """
    Scans syllabus folder to see what subjects exist for a grade.
    STRICTLY separates 'Form' vs 'Grade' files.
    """
    curr_type = get_curriculum_folder(grade)
    target_dir = SYLLABI_ROOT_DIR / curr_type
    
    if not target_dir.exists():
        return []

    found_subjects = set()
    
    # Normalize input
    grade_input = str(grade).lower().strip()
    
    # Extract the pure number (e.g., "1")
    raw_num = grade_input.replace("grade", "").replace("form", "").replace(" ", "").strip()
    
    # ⚡️ STRICT SEARCH TAGS
    search_tags = []
    
    if "form" in grade_input:
        # If user explicitly said "Form 1", look for 'form1', 'form_1'
        # This matches: zambia_chemistry_grade_form_1.json
        search_tags = [f"form{raw_num}", f"form_{raw_num}"]
    else:
        # If user explicitly said "Grade 1", look for 'grade1', 'grade_1'
        # This matches: zambia_creative_and_technology_studies_grade_1.json
        search_tags = [f"grade{raw_num}", f"grade_{raw_num}"]

    for file_path in target_dir.glob("*.json"):
        filename = file_path.stem.lower()
        
        # 1. Check if file matches our strict tags
        if any(tag in filename for tag in search_tags):
            
            # ⚡️ ANTI-COLLISION SAFETY
            # If we want "Grade 1", reject files containing "Form" (like grade_form_1)
            if "grade" in grade_input and "form" not in grade_input:
                if "form" in filename:
                    continue 

            # If we want "Form 1", reject files that look like "Grade 1" but lack "Form"
            # (Though our search_tags logic above usually handles this, this is double safety)
            if "form" in grade_input:
                if "form" not in filename:
                    continue

            # 2. Extract Subject Name
            parts = filename.split("_")
            clean_parts = []
            for part in parts:
                if part in ["zambia", "syllabus", "curriculum", "new", "old", "ecz"]: continue
                # Remove number, grade, form from the visible subject name
                if "grade" in part or "form" in part or part == raw_num: continue
                clean_parts.append(part.title())
            
            subject_name = " ".join(clean_parts)
            if subject_name: found_subjects.add(subject_name)

    return sorted(list(found_subjects))