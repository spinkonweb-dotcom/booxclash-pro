import logging
import os
import glob
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# 1. Load Environment Variables
load_dotenv()

# --- IMPORTS ---
from api.routes import router as api_router

# ✅ UPDATED: Split Teacher Routes into New and Old
from api.teacher_routes_new import router as teacher_router_new
from api.teacher_routes_old import router as teacher_router_old

from api.student_routes import router as student_router
from api.admin_routes import router as admin_router
from api.schemes import router as schemes_router 

# 3. Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("uvicorn")

# 4. Initialize App
app = FastAPI(title="BooxClash Tutor API")

# 5. CORS
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
    Filenames are expected to be roughly: 'subject_grade.json'
    """
    found_subjects = set()
    
    # Normalize input (e.g. "Grade 10" -> "10", "5" -> "5")
    # We remove "grade" and spaces to match filenames easier
    clean_grade = grade_input.lower().replace("grade", "").strip()

    # Define base paths
    base_paths = [
        os.path.join("syllabi", "new"),
        os.path.join("syllabi", "old")
    ]

    for folder in base_paths:
        if not os.path.exists(folder):
            continue
            
        # Get all json files in the folder
        files = glob.glob(os.path.join(folder, "*.json"))
        
        for file_path in files:
            filename = os.path.basename(file_path).lower()
            # Check if the filename contains the grade (e.g. "_10.json" or "_grade 10.json")
            # We look for `_grade.json` or `_grade_` to avoid matching "1" inside "10"
            
            # Simple heuristic: Split filename by '_'
            # Example: "mathematics_10.json" -> ["mathematics", "10.json"]
            parts = filename.replace(".json", "").split("_")
            
            # Check if any part matches our clean grade
            if clean_grade in parts:
                # The subject is usually the first part(s)
                # Join all parts except the last one (which is usually the grade)
                subject_name = " ".join(parts[:-1]).title()
                if subject_name:
                    found_subjects.add(subject_name)

    return list(sorted(found_subjects))

# === 🚀 NEW ENDPOINT: GET SUBJECTS ===
@app.get("/get-subjects/{grade}")
async def get_subjects_endpoint(grade: str):
    """
    Frontend calls: /get-subjects/Grade 4
    Backend scans folders and returns: ["Mathematics", "English", "Science"]
    """
    subjects = get_subjects_for_grade(grade)
    
    if not subjects:
        return {"subjects": [], "message": f"No syllabus files found for {grade}"}
        
    return {"subjects": subjects}

# 6. Register Routes
# General API Routes
app.include_router(api_router, prefix="/api/v1")

# ✅ TEACHER ROUTES (NEW vs OLD)
app.include_router(teacher_router_new, prefix="/api/v1/new", tags=["Teacher (New Curriculum)"]) 
app.include_router(teacher_router_old, prefix="/api/v1/old", tags=["Teacher (Old Curriculum)"])

# Student & Admin Routes
app.include_router(student_router, prefix="/api/v1")
app.include_router(schemes_router, prefix="/api/v1", tags=["Schemes"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["Admin"]) 

# 7. Health Check
@app.get("/")
def health_check():
    logger.info("Health check endpoint hit!")
    return {
        "status": "running", 
        "service": "BooxClash Backend",
        "registered_routes": ["/api/v1/teacher/new", "/api/v1/teacher/old", "/get-subjects/{grade}"] 
    }

# 8. Local Development Entry Point
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000)) 
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)