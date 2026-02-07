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

class UserTopUpRequest(BaseModel):
    target_uid: str
    amount_paid: int

class SchoolTopUpRequest(BaseModel):
    school_id: str
    amount_paid: int
    credits_to_add: int
    teachers_to_add: Optional[int] = None 

class SchoolApproveRequest(BaseModel):
    school_id: str

class ContentAction(BaseModel):
    doc_id: str
    collection_name: str

class TeacherAction(BaseModel):
    teacher_id: str

# ==========================================
# 🛡️ ADMIN VERIFICATION
# ==========================================

async def verify_admin(x_user_id: str):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    user_ref = db.collection("users").document(x_user_id)
    user_doc = user_ref.get()

    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")

    if user_doc.to_dict().get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admins only")

    return True

# ==========================================
# 🏫 SCHOOLS
# ==========================================

@router.get("/schools")
async def get_all_schools(x_user_id: str = Header(None, alias="X-User-ID")):
    await verify_admin(x_user_id)
    schools = []
    try:
        docs = db.collection("schools").stream()
        for doc in docs:
            data = doc.to_dict()
            teacher_count = len(list(db.collection("teachers").where("schoolId", "==", doc.id).stream()))
            
            created_at = data.get("createdAt", "")
            if hasattr(created_at, 'strftime'): created_at = created_at.strftime("%Y-%m-%d %H:%M:%S")
            else: created_at = str(created_at)

            pending = data.get("pendingRequest")
            if pending and pending.get("requestedAt"):
                ts = pending["requestedAt"]
                pending["requestedAt"] = ts.strftime("%Y-%m-%d %H:%M:%S") if hasattr(ts, 'strftime') else str(ts)

            schools.append({
                "id": doc.id,
                "adminId": data.get("adminId", ""),
                "schoolName": data.get("schoolName", "Unknown School"),
                "email": data.get("email", ""),
                "phone": data.get("phone", ""),
                "credits": data.get("credits", 0),
                "maxTeachers": data.get("maxTeachers", 0),
                "subscriptionPlan": data.get("subscriptionPlan", "None"),
                "isApproved": data.get("isApproved", False),
                "subscriptionStatus": data.get("subscriptionStatus", False),
                "teacherCount": teacher_count,
                "createdAt": created_at,
                "pendingRequest": pending
            })
        return {"status": "success", "data": schools}
    except Exception as e:
        raise HTTPException(500, f"Failed to load schools: {str(e)}")

@router.post("/schools/topup")
async def top_up_school(action: SchoolTopUpRequest, x_user_id: str = Header(None, alias="X-User-ID")):
    await verify_admin(x_user_id)
    school_ref = db.collection("schools").document(action.school_id)
    doc_snap = school_ref.get()

    if not doc_snap.exists:
        query = db.collection("schools").where("adminId", "==", action.school_id).stream()
        found_docs = list(query)
        if found_docs:
            school_ref = db.collection("schools").document(found_docs[0].id)
            doc_snap = found_docs[0]
        else:
            raise HTTPException(404, f"School with ID {action.school_id} not found")

    plan_name = "Custom Admin Approval"
    if action.amount_paid == 35: plan_name = "Bulk Monthly (K35)"
    elif action.amount_paid == 50: plan_name = "Standard Monthly (K50)"
    elif action.amount_paid == 120: plan_name = "Termly Boss (K120)"

    update_data = {
        "credits": firestore.Increment(action.credits_to_add),
        "lastPaymentAmount": action.amount_paid,
        "lastPaymentDate": firestore.SERVER_TIMESTAMP,
        "subscriptionPlan": plan_name,
        "subscriptionStatus": True,
        "isApproved": True,
        "pendingRequest": firestore.DELETE_FIELD
    }
    if action.teachers_to_add is not None:
        update_data["maxTeachers"] = action.teachers_to_add

    school_ref.update(update_data)
    
    s_data = doc_snap.to_dict()
    # Return receipt data compatible with new frontend
    return {
        "status": "success",
        "receipt_no": f"SCH-{doc_snap.id[:6].upper()}-{int(datetime.now().timestamp())}",
        "date": datetime.now().strftime('%Y-%m-%d'),
        "receipt_user_name": s_data.get("schoolName", "Valued School"), # Standardized key
        "plan_name": plan_name,
        "credits": action.credits_to_add,
        "amount": action.amount_paid
    }

# ==========================================
# 👥 USERS (UPDATED TO FETCH NAME)
# ==========================================

@router.get("/users")
async def get_all_users(x_user_id: str = Header(None, alias="X-User-ID")):
    await verify_admin(x_user_id)
    db_docs = {d.id: d.to_dict() for d in db.collection("users").stream()}
    auth_users = auth.list_users().iterate_all()
    users = []
    for u in auth_users:
        uid = u.uid
        data = db_docs.get(uid, {})
        role = data.get("role", "user")
        if role in ["school_admin", "admin", "super_admin"]:
            continue
        users.append({
            "uid": uid,
            "email": u.email or "No Email",
            "name": data.get("name") or u.display_name or "Unknown",
            "role": role,
            "credits": data.get("credits", 0),
            "subscriptionPlan": data.get("subscriptionPlan", "None"),
            "joined_at": str(data.get("joined_at", "")),
            "is_approved": data.get("is_approved", False),
        })
    return sorted(users, key=lambda x: x["joined_at"], reverse=True)

@router.post("/users/topup")
async def top_up_user(action: UserTopUpRequest, x_user_id: str = Header(None, alias="X-User-ID")):
    await verify_admin(x_user_id)
    credits, plan = (80, "Individual Monthly (K50)") if action.amount_paid == 50 else (300, "Individual Termly (K120)") if action.amount_paid == 120 else (int(action.amount_paid * 1.5), "Custom Top-up")

    user_ref = db.collection("users").document(action.target_uid)
    user_doc = user_ref.get()
    
    # 1. GET NAME FROM DB (This matches your data structure)
    user_name = "Valued Teacher"
    if user_doc.exists:
        user_name = user_doc.to_dict().get("name", "Valued Teacher")
    
    # 2. UPDATE CREDITS
    user_ref.update({
        "credits": firestore.Increment(credits),
        "is_approved": True,
        "subscriptionPlan": plan,
        "last_payment_amount": action.amount_paid,
        "last_payment_date": firestore.SERVER_TIMESTAMP
    })

    # 3. RETURN DATA FOR RECEIPT
    return {
        "status": "success",
        "receipt_no": f"IND-{action.target_uid[:5].upper()}-{int(datetime.now().timestamp())}",
        "date": datetime.now().strftime('%Y-%m-%d'),
        "receipt_user_name": user_name,  # Matches variable used in frontend logic
        "plan_name": plan,
        "credits": credits,
        "amount": action.amount_paid
    }

@router.delete("/users/{uid}")
async def delete_user(uid: str, x_user_id: str = Header(None, alias="X-User-ID")):
    await verify_admin(x_user_id)
    try:
        db.collection("users").document(uid).delete()
        try: auth.delete_user(uid)
        except: pass
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(500, str(e))

# ==========================================
# 📊 STATS & CONTENT (UNCHANGED)
# ==========================================

@router.get("/content/all")
async def get_all_content(type: str = Query(...), x_user_id: str = Header(None, alias="X-User-ID")):
    await verify_admin(x_user_id)
    cmap = {"scheme": "generated_schemes", "weekly": "generated_weekly_plans", "lesson": "generated_lesson_plans"}
    if type not in cmap: raise HTTPException(400, "Invalid content type")
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
    def count_collection(name): return len(list(db.collection(name).stream()))
    return {
        "total_users": count_collection("users"),
        "total_schools": count_collection("schools"),
        "total_schemes": count_collection("generated_schemes"),
        "total_lessons": count_collection("generated_lesson_plans")
    }