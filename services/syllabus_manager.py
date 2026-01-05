import json
import os
from pathlib import Path

# --- 1. ROBUST DIRECTORY CONFIGURATION ---
def get_syllabi_dir():
    """
    Robustly finds the 'syllabi' folder.
    Checks relative to this file AND the current working directory.
    """
    # 1. Get path of THIS file (e.g., .../services/syllabus_manager.py)
    current_file = Path(__file__).resolve()
    
    # 2. Define likely locations based on your structure
    # Priority A: Up 2 levels (services -> booxclash-pro -> syllabi) - MATCHES YOUR SCREENSHOT
    path_a = current_file.parent.parent / "syllabi"
    
    # Priority B: Current Working Directory (often used by Railway/Render)
    path_b = Path(os.getcwd()) / "syllabi"
    
    # Priority C: Inside backend folder (common fix for cloud deploys)
    path_c = Path(os.getcwd()) / "backend-fastapi" / "syllabi"

    # 3. Check which one actually exists
    if path_a.exists() and path_a.is_dir():
        return path_a
    if path_b.exists() and path_b.is_dir():
        return path_b
    if path_c.exists() and path_c.is_dir():
        return path_c
        
    # Default to Path A for error reporting if none found
    return path_a

# Set the directory using the function
SYLLABI_DIR = get_syllabi_dir()


# --- 2. STARTUP SCAN (RUNS IMMEDIATELY) ---
def _scan_and_log_syllabi():
    """
    Internal function to scan the directory and log loaded files on startup.
    """
    print(f"📂 Scanning for syllabi in: {SYLLABI_DIR}")
    print(f"   (System CWD is: {os.getcwd()})")
    
    if not SYLLABI_DIR.exists():
        print("❌ CRITICAL ERROR: 'syllabi' folder not found!")
        print("   -> Please ensure the 'syllabi' folder is uploaded to Railway/Render.")
        print("   -> Check your .gitignore file to make sure it's not excluded.")
        return

    # Find all .json files
    files = list(SYLLABI_DIR.glob("*.json"))
    
    if not files:
        print("⚠️ Folder found, but NO .json files inside.")
    else:
        print(f"✅ Successfully loaded {len(files)} syllabus files:")
        for f in files:
            print(f"   - {f.name}")
    print("---------------------------------------------------")

# Run the scan immediately when this file is imported
_scan_and_log_syllabi()


# --- 3. THE LOADER FUNCTION ---
def load_syllabus(country: str, grade: str, subject: str) -> str:
    """
    Loads a specific syllabus file based on student profile.
    """
    # Clean inputs to match your filename pattern (lowercase, no spaces)
    safe_country = country.lower().replace(" ", "_")
    safe_subject = subject.lower().replace(" ", "_")
    
    # Construct filename: e.g. "zambia_grade8_mathematics.json"
    filename = f"{safe_country}_grade{grade}_{safe_subject}.json"
    file_path = SYLLABI_DIR / filename

    print(f"🔎 Requesting Syllabus: {filename}")

    if file_path.exists():
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return json.dumps(data, indent=2)
        except Exception as e:
            print(f"❌ Error reading {filename}: {e}")
            return "Error loading syllabus file."
    else:
        # Fallback Logic: Help the user understand WHY it failed
        print(f"⚠️ File not found: {filename}")
        
        # Try to find similar files to give a helpful hint in logs
        if SYLLABI_DIR.exists():
            # Search for ANY file containing the grade and country
            pattern = f"*{safe_country}*grade{grade}*.json"
            available = [f.name for f in SYLLABI_DIR.glob(pattern)]
            
            if available:
                print(f"💡 Did you mean one of these? {available}")
            else:
                print(f"   (No similar files found for {safe_country} Grade {grade})")
            
    return f"Syllabus for {country} Grade {grade} {subject} not found. (Using General Knowledge)"