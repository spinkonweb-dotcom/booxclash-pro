import json
import os
from pathlib import Path
from typing import List, Dict, Any, Union

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
    
    # Check for exact matches or partial matches (e.g. "4" matches "grade 4")
    # If user sends "4", we assume "grade 4" logic
    if norm_grade in NEW_CURRICULUM_GRADES or f"grade {norm_grade}" in NEW_CURRICULUM_GRADES:
        return "new"
    elif norm_grade in OLD_CURRICULUM_GRADES or f"grade {norm_grade}" in OLD_CURRICULUM_GRADES:
        return "old"
    
    # Default fallback if unknown (Safe option)
    return "new"

# ==========================================
# 2. ROBUST DIRECTORY CONFIGURATION
# ==========================================
def get_syllabi_root_dir():
    """Robustly finds the root 'syllabi' folder."""
    current_file = Path(__file__).resolve()
    
    paths_to_check = [
        current_file.parent.parent / "syllabi",         # Standard Project Structure
        Path(os.getcwd()) / "syllabi",                  # Root execution
        Path(os.getcwd()) / "backend-fastapi" / "syllabi", # Monorepo
        current_file.parent / "syllabi"                 # Inside current folder
    ]

    for path in paths_to_check:
        if path.exists() and path.is_dir():
            return path
            
    # Fallback
    return current_file.parent.parent / "syllabi"

SYLLABI_ROOT_DIR = get_syllabi_root_dir()

# ==========================================
# 3. ROBUST FILE FINDER (UPDATED)
# ==========================================
def find_syllabus_file(country: str, grade: str, subject: str) -> Path | None:
    """
    1. Determines curriculum type (New vs Old).
    2. Looks into the specific subfolder (syllabi/new or syllabi/old).
    3. Finds the file using flexible matching.
    """
    if not SYLLABI_ROOT_DIR.exists():
        print(f"❌ Critical: Syllabi root not found at {SYLLABI_ROOT_DIR}")
        return None

    # 1. Determine Folder (New vs Old)
    curr_type = get_curriculum_folder(grade)
    target_dir = SYLLABI_ROOT_DIR / curr_type
    
    print(f"📂 Routing '{grade}' to -> {target_dir}")

    if not target_dir.exists():
        print(f"⚠️ Subfolder '{curr_type}' does not exist inside syllabi.")
        return None

    # 2. Normalize Inputs for Search
    search_country = country.lower().strip() # "zambia"
    search_subject = subject.lower().strip().replace(" ", "_") # "mathematics"
    raw_grade = str(grade).lower().replace(" ", "") # "grade2" or "2"

    # Create grade variations
    if "grade" not in raw_grade and "form" not in raw_grade:
        possible_grade_tags = [f"grade{raw_grade}", f"grade_{raw_grade}", f"form{raw_grade}"]
    else:
        possible_grade_tags = [raw_grade]

    # 3. Scan the TARGET Subfolder
    for file_path in target_dir.glob("*.json"):
        filename = file_path.name.lower()
        
        # Match Logic:
        # A. Must start with Country? (Optional, remove if your files don't start with zambia)
        if not filename.startswith(search_country):
            # strict check: if file is "math_grade4.json" and country is "zambia", this fails.
            # Relaxed check: Just check if country is in name IF the file includes country
            pass 
            
        # B. Must contain Subject
        if search_subject not in filename:
            continue
            
        # C. Must contain Grade
        if any(tag in filename for tag in possible_grade_tags):
            print(f"✅ Found Syllabus in '{curr_type}': {filename}")
            return file_path
            
    return None

# ==========================================
# 4. THE LOADER FUNCTION
# ==========================================
def load_syllabus(country: str, grade: str, subject: str) -> List[Dict[str, Any]]:
    """
    Loads syllabus safely from the correct New/Old folder.
    """
    print(f"🔎 Requesting: {country} | {grade} | {subject}")
    
    file_path = find_syllabus_file(country, grade, subject)

    if file_path and file_path.exists():
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                
                # --- NORMALIZE DATA STRUCTURE ---
                if isinstance(data, dict):
                    if "topics" in data:
                        return data["topics"]
                    elif "content" in data:
                        return data["content"]
                    else:
                        return [data] # Wrap object in list
                        
                elif isinstance(data, list):
                    return data
                
                return []
        except Exception as e:
            print(f"❌ JSON Error in {file_path.name}: {e}")
            return []
    else:
        print(f"⚠️ No syllabus found for {country} - Grade {grade} - {subject}")
        return []

def get_subjects_for_grade(grade: str) -> list[str]:
    """
    1. Decides if Grade 4 is 'new' or 'old'.
    2. Scans that specific folder.
    3. Returns a list of subjects found (e.g. ['Mathematics', 'Science'])
    """
    # 1. Determine which folder to check
    curr_type = get_curriculum_folder(grade) # Uses the function we wrote earlier
    target_dir = SYLLABI_ROOT_DIR / curr_type
    
    print(f"📂 Scanning for {grade} in: {target_dir}")

    if not target_dir.exists():
        return []

    found_subjects = set()
    
    # Clean the input grade for matching (e.g. "Grade 4" -> "4" and "grade4")
    raw_grade_num = str(grade).lower().replace("grade", "").replace(" ", "").strip() # "4"
    search_tags = [f"grade{raw_grade_num}", f"grade_{raw_grade_num}", f"form{raw_grade_num}"]

    # 2. Scan files
    for file_path in target_dir.glob("*.json"):
        filename = file_path.stem.lower() # "mathematics_grade4" (no .json)
        
        # Check if this file belongs to the requested grade
        # It must contain "grade4" or "grade_4" etc.
        if any(tag in filename for tag in search_tags):
            
            # 3. Extract Subject from Filename
            # Strategy: Remove the grade part, remove 'zambia', remove 'syllabus'
            # Remaining text is the subject.
            
            parts = filename.split("_")
            clean_parts = []
            
            for part in parts:
                # Filter out "zambia", "grade4", "syllabus", "new", "old"
                if part in ["zambia", "syllabus", "curriculum", "new", "old", "ecz"]:
                    continue
                if "grade" in part or "form" in part or part == raw_grade_num:
                    continue
                
                clean_parts.append(part.title()) # "mathematics" -> "Mathematics"
            
            # Join what's left (e.g. "Social" + "Studies")
            subject_name = " ".join(clean_parts)
            
            if subject_name:
                found_subjects.add(subject_name)

    return sorted(list(found_subjects))