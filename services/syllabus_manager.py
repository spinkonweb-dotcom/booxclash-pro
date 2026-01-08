import json
import os
from pathlib import Path
from typing import List, Dict, Any, Union

# --- 1. ROBUST DIRECTORY CONFIGURATION ---
def get_syllabi_dir():
    """Robustly finds the 'syllabi' folder."""
    current_file = Path(__file__).resolve()
    path_a = current_file.parent.parent / "syllabi"
    path_b = Path(os.getcwd()) / "syllabi"
    path_c = Path(os.getcwd()) / "backend-fastapi" / "syllabi"

    if path_a.exists() and path_a.is_dir(): return path_a
    if path_b.exists() and path_b.is_dir(): return path_b
    if path_c.exists() and path_c.is_dir(): return path_c
        
    return path_a

SYLLABI_DIR = get_syllabi_dir()

# --- 2. STARTUP SCAN ---
def _scan_and_log_syllabi():
    print(f"📂 Scanning for syllabi in: {SYLLABI_DIR}")
    if not SYLLABI_DIR.exists():
        print("❌ CRITICAL ERROR: 'syllabi' folder not found!")
        return

    files = list(SYLLABI_DIR.glob("*.json"))
    if not files:
        print("⚠️ Folder found, but NO .json files inside.")
    else:
        print(f"✅ Successfully loaded {len(files)} syllabus files.")

_scan_and_log_syllabi()

# --- 3. THE LOADER FUNCTION (FIXED) ---
def load_syllabus(country: str, grade: str, subject: str) -> List[Dict[str, Any]]:
    """
    Loads a specific syllabus file.
    RETURNS: A List of Dictionaries (Not a string).
    """
    safe_country = country.lower().replace(" ", "_")
    safe_subject = subject.lower().replace(" ", "_")
    filename = f"{safe_country}_grade{grade}_{safe_subject}.json"
    file_path = SYLLABI_DIR / filename

    print(f"🔎 Requesting Syllabus: {filename}")

    if file_path.exists():
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                
                # ⚡ CRITICAL FIX: Return the inner list, not the whole file, and NOT a string
                if isinstance(data, dict):
                    # Check for common keys in your JSON structure
                    if "topics" in data:
                        return data["topics"]
                    elif "content" in data:
                        return data["content"]
                    else:
                        # Fallback: return the whole dict wrapped in a list
                        return [data]
                elif isinstance(data, list):
                    return data
                
                return []
        except Exception as e:
            print(f"❌ Error reading {filename}: {e}")
            return []
    else:
        print(f"⚠️ File not found: {filename}")
        return []