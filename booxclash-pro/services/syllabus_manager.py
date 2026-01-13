import json
import os
from pathlib import Path
from typing import List, Dict, Any, Union

# --- 1. ROBUST DIRECTORY CONFIGURATION ---
def get_syllabi_dir():
    """Robustly finds the 'syllabi' folder in various environments."""
    current_file = Path(__file__).resolve()
    
    # Check common locations
    paths_to_check = [
        current_file.parent.parent / "syllabi",         # Standard Project Structure
        Path(os.getcwd()) / "syllabi",                  # Root execution
        Path(os.getcwd()) / "backend-fastapi" / "syllabi", # Monorepo style
        current_file.parent / "syllabi"                 # Inside current folder
    ]

    for path in paths_to_check:
        if path.exists() and path.is_dir():
            return path
            
    # Fallback: Create it if missing to prevent crash
    fallback = current_file.parent.parent / "syllabi"
    return fallback

SYLLABI_DIR = get_syllabi_dir()

# --- 2. STARTUP SCAN ---
def _scan_and_log_syllabi():
    print(f"📂 Syllabus Directory: {SYLLABI_DIR}")
    if not SYLLABI_DIR.exists():
        print("❌ CRITICAL: 'syllabi' folder missing. Please create it.")
        return

    files = list(SYLLABI_DIR.glob("*.json"))
    if not files:
        print("⚠️ Folder exists but is empty.")
    else:
        print(f"✅ Indexed {len(files)} syllabus files.")

_scan_and_log_syllabi()

# --- 3. ROBUST FILE FINDER (The Fix) ---
def find_syllabus_file(country: str, grade: str, subject: str) -> Path | None:
    """
    Searches for a syllabus file ignoring the middle 'curriculum' part.
    Matches: 'zambia_ecz_grade2_math.json' OR 'zambia_grade2_math.json'
    """
    if not SYLLABI_DIR.exists():
        return None

    # Normalize Inputs
    search_country = country.lower().strip() # "zambia"
    search_subject = subject.lower().strip().replace(" ", "_") # "mathematics"
    
    # Normalize Grade: Handle "2", "Grade 2", "Form 1"
    raw_grade = str(grade).lower().replace(" ", "") # "2" or "grade2" or "form1"
    
    # Create search variations for grade (e.g. if input is "2", look for "grade2")
    if "grade" not in raw_grade and "form" not in raw_grade:
        # If user sends just "2", we look for "grade2" or "form2"
        possible_grade_tags = [f"grade{raw_grade}", f"grade_{raw_grade}", f"form{raw_grade}"]
    else:
        # If user sends "grade2", we look for "grade2"
        possible_grade_tags = [raw_grade]

    # 🔎 SEARCH STRATEGY: Scan files manually to find best match
    # We don't use glob("*") with complex logic to avoid rigid patterns.
    for file_path in SYLLABI_DIR.glob("*.json"):
        filename = file_path.name.lower()
        
        # 1. Must start with Country
        if not filename.startswith(search_country):
            continue
            
        # 2. Must contain Subject
        if search_subject not in filename:
            continue
            
        # 3. Must contain one of the Grade tags
        # This handles "zambia_ecz_grade2_math" vs "zambia_grade2_math"
        if any(tag in filename for tag in possible_grade_tags):
            print(f"✅ Found Match: {filename}")
            return file_path
            
    return None

# --- 4. THE LOADER FUNCTION ---
def load_syllabus(country: str, grade: str, subject: str) -> List[Dict[str, Any]]:
    """
    Loads a syllabus file safely.
    RETURNS: A List of Dictionaries (Always).
    """
    print(f"🔎 Requesting: {country} | {grade} | {subject}")
    
    file_path = find_syllabus_file(country, grade, subject)

    if file_path and file_path.exists():
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                
                # --- NORMALIZE DATA STRUCTURE ---
                # Case A: File has "topics" key (Standard)
                if isinstance(data, dict):
                    if "topics" in data:
                        return data["topics"]
                    elif "content" in data:
                        return data["content"]
                    # Case B: File IS the object but wrapped in meta
                    else:
                        return [data] # Wrap in list to keep frontend happy
                        
                # Case C: File is already a list (Old format)
                elif isinstance(data, list):
                    return data
                
                return []
        except Exception as e:
            print(f"❌ JSON Error in {file_path.name}: {e}")
            return []
    else:
        print(f"⚠️ No syllabus found for {country} - Grade {grade} - {subject}")
        return []