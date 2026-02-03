import traceback  # 👈 Added this for error printing
from fastapi import APIRouter, Header, HTTPException, Body
from pydantic import BaseModel
from typing import Optional, Dict, Any
from firebase_admin import firestore

# Initialize Router
router = APIRouter()
db = firestore.client()

# ==========================================
# 📦 DATA MODELS
# ==========================================

class TemplateConfig(BaseModel):
    """
    Stores URLs to uploaded templates or specific text instructions for the AI.
    """
    scheme_url: Optional[str] = None
    lesson_plan_url: Optional[str] = None
    weekly_plan_url: Optional[str] = None
    
    # Optional: specific text instructions extracted or typed by admin
    # e.g., "Always include a 'Core Values' section."
    custom_instructions: Optional[str] = "" 

class BrandingConfig(BaseModel):
    logo_url: Optional[str] = None
    motto: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    primary_color: Optional[str] = "#000000" # Default black

class SchoolSettingsRequest(BaseModel):
    school_id: str
    school_name: str
    branding: BrandingConfig
    templates: Optional[TemplateConfig] = None

# ==========================================
# 🛠️ HELPERS
# ==========================================

def verify_school_admin(uid: str, school_id: str):
    """
    Security Check: Ensure the user requesting the change is actually 
    an Admin of that school.
    """
    if not uid:
        return False
        
    # 1. Fetch User Profile
    user_ref = db.collection("users").document(uid).get()
    if not user_ref.exists:
        return False
    
    user_data = user_ref.to_dict()
    
    # 2. Check Role and School ID match
    # Adjust field names based on your actual user schema
    user_school = user_data.get("schoolId")
    user_role = user_data.get("role") # e.g., 'admin', 'head_teacher'
    
    if user_school == school_id and user_role in ["admin", "head_teacher", "principal", "school_admin"]:
        return True
        
    return False

# ==========================================
# 🚀 ROUTES
# ==========================================

@router.post("/update-settings")
async def update_school_settings(
    settings: SchoolSettingsRequest,
    x_user_id: str = Header(None, alias="X-User-ID")
):
    """
    Saves school branding and custom template preferences.
    """
    print(f"⚙️ UPDATING SETTINGS | School: {settings.school_id} | User: {x_user_id}")

    if not settings.school_id:
        raise HTTPException(status_code=400, detail="School ID is required")

    # 🔐 Security Check (Uncomment when ready)
    # if not verify_school_admin(x_user_id, settings.school_id):
    #     raise HTTPException(status_code=403, detail="Unauthorized: Only school admins can update settings.")

    try:
        school_ref = db.collection("schools").document(settings.school_id)
        
        # Prepare Update Payload
        # We use merge=True so we don't accidentally wipe credits or teacher lists
        update_data = {
            "schoolName": settings.school_name,
            "branding": settings.branding.dict(),
            "customTemplates": settings.templates.dict() if settings.templates else {},
            "updatedAt": firestore.SERVER_TIMESTAMP,
            "updatedBy": x_user_id
        }

        school_ref.set(update_data, merge=True)

        return {"status": "success", "message": "School settings updated successfully"}

    except Exception as e:
        traceback.print_exc() # 👈 This will now work
        raise HTTPException(status_code=500, detail=f"Failed to update settings: {str(e)}")


@router.get("/get-settings/{school_id}")
async def get_school_settings(
    school_id: str,
    x_user_id: str = Header(None, alias="X-User-ID")
):
    """
    Fetches the current settings to populate the frontend form.
    """
    try:
        doc = db.collection("schools").document(school_id).get()
        
        if not doc.exists:
            # Return defaults if new school
            return {
                "schoolName": "",
                "branding": {},
                "customTemplates": {}
            }

        data = doc.to_dict()

        # Sanitize response (ensure keys exist)
        return {
            "schoolName": data.get("schoolName", ""),
            "branding": data.get("branding", {
                "logo_url": None,
                "motto": "",
                "address": "",
                "phone": ""
            }),
            "customTemplates": data.get("customTemplates", {
                "scheme_url": None,
                "lesson_plan_url": None,
                "weekly_plan_url": None,
                "custom_instructions": ""
            })
        }

    except Exception as e:
        print(f"❌ Error fetching settings: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Could not load settings")