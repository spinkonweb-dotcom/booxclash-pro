import os
import json
from pathlib import Path

# Base Directory
GENERATED_DIR = Path("generated")
SCHEMES_DIR = GENERATED_DIR / "schemes"
WEEKLY_DIR = GENERATED_DIR / "weekly_plans"

# Ensure directories exist
SCHEMES_DIR.mkdir(parents=True, exist_ok=True)
WEEKLY_DIR.mkdir(parents=True, exist_ok=True)

# --- SCHEMES ---
def save_generated_scheme(uid: str, subject: str, grade: str, term: str, data: list):
    safe_subject = subject.lower().replace(" ", "_")
    safe_term = term.lower().replace(" ", "_")
    filename = f"{uid}_{safe_subject}_grade{grade}_{safe_term}.json"
    file_path = SCHEMES_DIR / filename
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        print(f"💾 [File Manager] Scheme saved: {file_path}")
        return True
    except Exception as e:
        print(f"❌ [File Manager] Error saving scheme: {e}")
        return False

def load_generated_scheme(uid: str, subject: str, grade: str, term: str):
    safe_subject = subject.lower().replace(" ", "_")
    safe_term = term.lower().replace(" ", "_")
    filename = f"{uid}_{safe_subject}_grade{grade}_{safe_term}.json"
    file_path = SCHEMES_DIR / filename
    
    if file_path.exists():
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return None
    
    # Fallback to default user
    default_path = SCHEMES_DIR / f"default_user_{safe_subject}_grade{grade}_{safe_term}.json"
    if default_path.exists():
        print(f"⚠️ User scheme not found, loading default: {default_path}")
        with open(default_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None

# --- WEEKLY PLANS ---
def save_weekly_plan(uid: str, subject: str, grade: str, term: str, week: int, data: dict):
    safe_subject = subject.lower().replace(" ", "_")
    safe_term = term.lower().replace(" ", "_")
    filename = f"{uid}_{safe_subject}_grade{grade}_{safe_term}_week{week}.json"
    file_path = WEEKLY_DIR / filename

    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        print(f"💾 [File Manager] Weekly Plan saved: {file_path}")
        return True
    except Exception as e:
        print(f"❌ [File Manager] Error saving weekly plan: {e}")
        return False

def load_weekly_plan(uid: str, subject: str, grade: str, term: str, week: int):
    """
    Loads a specific weekly plan from the file system.
    """
    safe_subject = subject.lower().replace(" ", "_")
    safe_term = term.lower().replace(" ", "_")
    filename = f"{uid}_{safe_subject}_grade{grade}_{safe_term}_week{week}.json"
    file_path = WEEKLY_DIR / filename

    print(f"📂 [File Manager] Looking for Weekly Plan: {file_path}")

    if file_path.exists():
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"❌ [File Manager] Error reading weekly plan: {e}")
            return None
    else:
        print(f"⚠️ [File Manager] Weekly Plan file not found.")
        return None