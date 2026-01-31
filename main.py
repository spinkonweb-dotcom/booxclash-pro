import logging
import os
import glob
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# 1. Load Environment Variables
load_dotenv()

# --- IMPORTS ---
from api.routes import router as api_router
from api.teacher_routes_new import router as teacher_router_new
from api.teacher_routes_old import router as teacher_router_old
from api.student_routes import router as student_router
from api.admin_routes import router as admin_router
from api.schemes import router as schemes_router 

# 2. Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("uvicorn")

# 3. Initialize App
app = FastAPI(title="BooxClash Tutor API")

# 4. CORS
origins = [
    "http://localhost:5173", 
    "http://localhost:3000",
    "https://booxclash-pro.onrender.com", 
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === 📊 HELPER: COUNT RESOURCES ===
def count_available_resources():
    """Scans directories to count available JSON files."""
    base_dir = Path(__file__).resolve().parent

    # Define paths (Adjust relative path if your main.py is deep inside a folder)
    # Assuming main.py is in root or api/, we look for 'syllabi' and 'modules' relative to project root
    # If main.py is in /backend, and syllabi is in /backend/syllabi:
    syllabi_dir = base_dir / "syllabi"
    modules_dir = base_dir / "modules"
    
    # Retry logic if folders are one level up
    if not syllabi_dir.exists(): syllabi_dir = base_dir.parent / "syllabi"
    if not modules_dir.exists(): modules_dir = base_dir.parent / "modules"

    syllabus_count = len(list(syllabi_dir.rglob("*.json"))) if syllabi_dir.exists() else 0
    module_count = len(list(modules_dir.rglob("*.json"))) if modules_dir.exists() else 0

    return syllabus_count, module_count

# === 🔎 REQUEST LOGGER ===
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"🔔 INCOMING REQUEST: {request.method} {request.url}")
    try:
        response = await call_next(request)
        logger.info(f"✅ RESPONSE SENT: {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"❌ REQUEST FAILED: {str(e)}")
        raise e

# === 📂 HELPER: SCAN SYLLABUS FOLDERS ===
def get_subjects_for_grade(grade_input: str):
    """
    Scans 'syllabi/new' and 'syllabi/old' for files matching the grade.
    """
    found_subjects = set()
    clean_grade = grade_input.lower().replace("grade", "").strip()

    # Define base paths
    base_paths = [
        os.path.join("syllabi", "new"),
        os.path.join("syllabi", "old")
    ]

    for folder in base_paths:
        if not os.path.exists(folder):
            # Try looking one directory up if running from subfolder
            folder = os.path.join("..", folder)
            if not os.path.exists(folder): continue
            
        files = glob.glob(os.path.join(folder, "*.json"))
        
        for file_path in files:
            filename = os.path.basename(file_path).lower()
            parts = filename.replace(".json", "").split("_")
            
            if clean_grade in parts:
                # Basic cleanup to extract subject name
                # Exclude common keywords
                clean_parts = [p for p in parts if p not in ["zambia", "syllabus", "new", "old", clean_grade]]
                subject_name = " ".join(clean_parts).title()
                
                if subject_name:
                    found_subjects.add(subject_name)

    return list(sorted(found_subjects))

# === 🚀 ENDPOINT: GET SUBJECTS ===
@app.get("/get-subjects/{grade}")
async def get_subjects_endpoint(grade: str):
    subjects = get_subjects_for_grade(grade)
    if not subjects:
        return {"subjects": [], "message": f"No syllabus files found for {grade}"}
    return {"subjects": subjects}

# 6. Register Routes
app.include_router(api_router, prefix="/api/v1")
app.include_router(teacher_router_new, prefix="/api/v1/new", tags=["Teacher (New Curriculum)"]) 
app.include_router(teacher_router_old, prefix="/api/v1/old", tags=["Teacher (Old Curriculum)"])
app.include_router(student_router, prefix="/api/v1")
app.include_router(schemes_router, prefix="/api/v1", tags=["Schemes"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["Admin"]) 

# 7. Startup Event & Health Check
@app.on_event("startup")
async def startup_event():
    s_count, m_count = count_available_resources()
    logger.info("🚀 SYSTEM STARTUP COMPLETE")
    logger.info(f"📚 Syllabi Loaded: {s_count}")
    logger.info(f"📦 Modules Loaded: {m_count}")

@app.get("/")
def health_check():
    s_count, m_count = count_available_resources()
    logger.info("Health check endpoint hit!")
    return {
        "status": "running", 
        "service": "BooxClash Backend",
        "resources": {
            "syllabi_files": s_count,
            "module_files": m_count
        },
        "registered_routes": ["/api/v1/teacher/new", "/api/v1/teacher/old", "/get-subjects/{grade}"] 
    }

# 8. Local Development Entry Point
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000)) 
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)