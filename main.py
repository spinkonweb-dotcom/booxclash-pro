import logging
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# 1. Load Environment Variables
load_dotenv()

# 2. Import your router
# Ensure you have the file 'api/routes.py' created
from api.routes import router as api_router

# 3. Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("uvicorn")

# 4. Initialize App
app = FastAPI(title="BooxClash Tutor API")

# 5. CORS - Allow Vercel and Localhost
origins = [
    "http://localhost:5173", # Vite (Standard)
    "http://localhost:3000", # Next.js / Create React App
    "http://127.0.0.1:5173",
    "*"  # DEBUG MODE: Allow everything for now
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === 🔎 REQUEST LOGGER MIDDLEWARE (Add This!) ===
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """
    Logs the Method and URL of every single request hitting the server.
    """
    logger.info(f"🔔 INCOMING REQUEST: {request.method} {request.url}")
    try:
        response = await call_next(request)
        logger.info(f"✅ RESPONSE SENT: {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"❌ REQUEST FAILED: {str(e)}")
        raise e
# =================================================

# 6. Register Routes
# IMPORTANT: This means your URL is http://localhost:8000/api/start-session
app.include_router(api_router, prefix="/api/v1")

# 7. Health Check
@app.get("/")
def health_check():
    logger.info("Health check endpoint hit!")
    return {"status": "running", "service": "BooxClash Backend"}

# 8. Local Development Entry Point
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    # 'main:app' assumes this file is named main.py
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)