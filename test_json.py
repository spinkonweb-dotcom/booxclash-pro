import json
import os
import glob

# Change this to your actual folder path
folder_path = "syllabi" 

print(f"--- Scanning {folder_path} ---")

# Find all json files
files = glob.glob(os.path.join(folder_path, "*.json"))

if not files:
    print("❌ No JSON files found! Check your folder path variable.")

for file_path in files:
    filename = os.path.basename(file_path)
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # logical check
        if "topics" not in data:
             print(f"⚠️  WARNING: {filename} loads but is missing 'topics' key.")
        else:
             print(f"✅ {filename} is GOOD.")
             
    except json.JSONDecodeError as e:
        print(f"❌ CRITICAL ERROR in {filename}")
        print(f"   Line {e.lineno}: {e.msg}")
    except Exception as e:
        print(f"❌ Error reading {filename}: {e}")