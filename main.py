import logging
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# 1. Load Environment Variables
load_dotenv()

# --- IMPORTS ---
from api.routes import router as api_router
from api.teacher_routes import router as teacher_router
from api.student_routes import router as student_router
from api.admin_routes import router as admin_router # 👈 Import this
# ✅ FIX: Import the missing Schemes Router
# (Assuming your file is in 'routers/schemes.py' based on your previous snippets)
# If it is in 'api/schemes.py', change this line accordingly.
from api.teacher_routes import router as schemes_router 
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
    "https://booxclash-pro.onrender.com", # Always good to add your production URL
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

# 6. Register Routes
app.include_router(api_router, prefix="/api/v1")
app.include_router(teacher_router, prefix="/api/v1") 
app.include_router(student_router, prefix="/api/v1")
app.include_router(schemes_router, prefix="/api/v1", tags=["Schemes"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["Admin"]) # 👈 Add this
# 7. Health Check
@app.get("/")
def health_check():
    logger.info("Health check endpoint hit!")
    return {
        "status": "running", 
        "service": "BooxClash Backend",
        "registered_routes": ["/api/v1/generate-scheme", "/api/v1/agent"] # Debug helper
    }

# 8. Local Development Entry Point
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000)) # Changed to 8003 to match frontend default
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)