import os
from datetime import datetime
from fastapi import APIRouter, HTTPException, Header, Query
from firebase_admin import firestore, auth
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()
db = firestore.client()

# ==========================================
# 📦 MODELS
# ==========================================

class AdminAction(BaseModel):
    target_uid: str

class UserTopUpRequest(BaseModel):
    target_uid: str
    amount_paid: int 

class SchoolTopUpRequest(BaseModel):
    school_id: str
    amount_paid: int
    credits_to_add: int
    max_teachers: int

class SchoolApproveRequest(BaseModel):
    school_id: str

class ContentAction(BaseModel):
    doc_id: str
    collection_name: str 

# ==========================================
# 🛡️ DEPENDENCIES
# ==========================================

async def verify_admin(x_user_id: str):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    user_ref = db.collection("users").document(x_user_id)
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_doc.to_dict().get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    
    return True

# ==========================================
# 🚀 SCHOOL ENDPOINTS
# ==========================================

@router.get("/schools")
async def get_all_schools(x_user_id: str = Header(None, alias="X-User-ID")):
    await verify_admin(x_user_id)
    try:
        schools_ref = db.collection("schools").stream()
        schools_list = []
        for doc in schools_ref:
            data = doc.to_dict()
            # Count teachers linked to this school
            teacher_count = len(list(db.collection("users").where("schoolId", "==", doc.id).stream()))
            
            schools_list.append({
                "id": doc.id,
                "schoolName": data.get("schoolName", "Unknown School"),
                "email": data.get("email", ""),
                "credits": data.get("credits", 0),
                "subscriptionPlan": data.get("subscriptionPlan", "None"),  # Return the plan
                "isApproved": data.get("isApproved", False),
                "teacherCount": teacher_count,
                "createdAt": str(data.get("createdAt", ""))
            })
        return schools_list
    except Exception as e:
        raise HTTPException(500, str(e))

@router.post("/schools/approve")
async def approve_school(action: SchoolApproveRequest, x_user_id: str = Header(None, alias="X-User-ID")):
    await verify_admin(x_user_id)
    db.collection("schools").document(action.school_id).update({
        "isApproved": True,
        "credits": firestore.Increment(50) # Optional: Free starter credits
    })
    return {"status": "success"}

@router.post("/schools/topup")
async def top_up_school(action: SchoolTopUpRequest, x_user_id: str = Header(None, alias="X-User-ID")):
    await verify_admin(x_user_id)
    
    school_ref = db.collection("schools").document(action.school_id)
    if not school_ref.get().exists:
        raise HTTPException(404, "School not found")

    # 1. Determine Plan Name based on Amount
    plan_name = "Custom Top-up"
    if action.amount_paid == 35: plan_name = "Bulk Monthly (K35)"
    elif action.amount_paid == 50: plan_name = "Standard Monthly (K50)"
    elif action.amount_paid == 120: plan_name = "Termly Boss (K120)"

    # 2. Update DB with Credits AND Plan Name
    school_ref.update({
        "credits": firestore.Increment(action.credits_to_add),
        "lastPaymentAmount": action.amount_paid,
        "lastPaymentDate": firestore.SERVER_TIMESTAMP,
        "maxTeachers": action.max_teachers,
        "subscriptionPlan": plan_name,  # <--- SAVES THE PLAN
        "isApproved": True
    })
    
    # 3. Return Data for Receipt
    s_data = school_ref.get().to_dict()
    return {
        "status": "success",
        "receipt_no": f"SCH-{action.school_id[:6].upper()}-{int(datetime.now().timestamp())}",
        "date": datetime.now().strftime('%Y-%m-%d'),
        "user_name": s_data.get("schoolName", "Valued School"),
        "user_uid": action.school_id,
        "plan_name": plan_name,
        "credits": action.credits_to_add,
        "amount": action.amount_paid
    }

# ==========================================
# 👥 USER ENDPOINTS
# ==========================================

@router.get("/users")
async def get_all_users(x_user_id: str = Header(None, alias="X-User-ID")):
    await verify_admin(x_user_id)
    
    try:
        all_auth_users = auth.list_users().iterate_all()
    except Exception as e:
        raise HTTPException(500, f"Error fetching auth users: {str(e)}")
    
    db_docs = {doc.id: doc.to_dict() for doc in db.collection("users").stream()}
    combined_users = []
    
    for user in all_auth_users:
        uid = user.uid
        email = user.email or "No Email"
        db_data = db_docs.get(uid, {})
        
        display_name = db_data.get("name") or user.display_name or email.split("@")[0].title() or "Unknown"
        status = "approved" if db_data.get("is_approved") else ("active" if uid in db_docs else "new_signup")

        combined_users.append({
            "uid": uid,
            "email": email,
            "name": display_name,
            "role": db_data.get("role", "user"),
            "credits": db_data.get("credits", 0),
            "subscriptionPlan": db_data.get("subscriptionPlan", "None"), # Return plan
            "joined_at": str(db_data.get("joined_at", datetime.fromtimestamp(user.user_metadata.creation_timestamp / 1000) if user.user_metadata.creation_timestamp else "Unknown")),
            "status": status,
            "is_approved": db_data.get("is_approved", False),
            "schoolName": db.collection("schools").document(db_data.get("schoolId")).get().to_dict().get("schoolName") if db_data.get("schoolId") else None
        })
    
    return sorted(combined_users, key=lambda x: x['joined_at'], reverse=True)

@router.post("/users/topup")
async def top_up_user(action: UserTopUpRequest, x_user_id: str = Header(None, alias="X-User-ID")):
    await verify_admin(x_user_id)
    
    # 1. Determine Plan & Credits
    credits_to_add = 0
    plan_name = "Custom Top-up"
    
    if action.amount_paid == 50: 
        credits_to_add = 80
        plan_name = "Individual Monthly (K50)"
    elif action.amount_paid == 120: 
        credits_to_add = 300
        plan_name = "Individual Termly (K120)"
    else: 
        credits_to_add = int(action.amount_paid * 1.5)

    user_ref = db.collection("users").document(action.target_uid)
    
    # Auto-create if missing
    if not user_ref.get().exists:
        try:
            auth_user = auth.get_user(action.target_uid)
            user_ref.set({
                "email": auth_user.email,
                "name": auth_user.display_name or auth_user.email.split('@')[0],
                "role": "user",
                "joined_at": firestore.SERVER_TIMESTAMP,
                "credits": 0,
                "is_approved": False
            })
        except: pass

    # 2. Update DB with Credits AND Plan
    user_ref.update({
        "is_approved": True, 
        "credits": firestore.Increment(credits_to_add),
        "last_payment_amount": action.amount_paid,
        "subscriptionPlan": plan_name, # <--- SAVES THE PLAN
        "last_payment_date": firestore.SERVER_TIMESTAMP
    })
    
    return {"status": "success", "new_credits": credits_to_add, "plan": plan_name}

@router.post("/users/approve")
async def approve_user(action: AdminAction, x_user_id: str = Header(None, alias="X-User-ID")):
    await verify_admin(x_user_id)
    db.collection("users").document(action.target_uid).update({"is_approved": True})
    return {"status": "success"}

@router.delete("/users/{target_uid}")
async def delete_user(target_uid: str, x_user_id: str = Header(None, alias="X-User-ID")):
    await verify_admin(x_user_id)
    try: auth.delete_user(target_uid) 
    except: pass
    db.collection("users").document(target_uid).delete() 
    return {"status": "success"}

# ==========================================
# 📚 CONTENT & STATS
# ==========================================

@router.get("/content/all")
async def get_all_content(type: str = Query(...), x_user_id: str = Header(None, alias="X-User-ID")):
    await verify_admin(x_user_id)
    cmap = {"scheme": "generated_schemes", "weekly": "generated_weekly_plans", "lesson": "generated_lesson_plans"}
    if type not in cmap: raise HTTPException(400, "Invalid type")
    docs = db.collection(cmap[type]).order_by("createdAt", direction=firestore.Query.DESCENDING).limit(50).stream()
    return [{**d.to_dict(), "id": d.id, "createdAt": str(d.to_dict().get("createdAt"))} for d in docs]

@router.delete("/content/delete")
async def delete_content(action: ContentAction, x_user_id: str = Header(None, alias="X-User-ID")):
    await verify_admin(x_user_id)
    db.collection(action.collection_name).document(action.doc_id).delete()
    return {"status": "success"}

@router.get("/stats")
async def get_stats(x_user_id: str = Header(None, alias="X-User-ID")):
    await verify_admin(x_user_id)
    return {
        "total_users": len(list(db.collection("users").stream())),
        "total_schools": len(list(db.collection("schools").stream())),
        "total_schemes": len(list(db.collection("generated_schemes").stream())),
        "total_lessons": len(list(db.collection("generated_lesson_plans").stream()))
    }