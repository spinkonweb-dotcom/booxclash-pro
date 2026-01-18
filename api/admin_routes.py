import os
import io
from datetime import datetime
from fastapi import APIRouter, HTTPException, Header, Query
from fastapi.responses import StreamingResponse
from firebase_admin import firestore, auth  # <--- Essential Import
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()
db = firestore.client()

# ==========================================
# 📦 MODELS & DEPENDENCIES
# ==========================================

class AdminAction(BaseModel):
    target_uid: str

class TopUpRequest(BaseModel):
    target_uid: str
    amount_paid: int  # 50 or 120

class ContentAction(BaseModel):
    doc_id: str
    collection_name: str 

async def verify_admin(x_user_id: str):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Check database for admin role
    user_ref = db.collection("users").document(x_user_id)
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_doc.to_dict().get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    
    return True

# ==========================================
# 📄 PDF GENERATOR FUNCTION
# ==========================================
def generate_receipt_pdf(user_name: str, uid: str, amount: int, plan_name: str, credits: int):
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    # Resolve Image Paths
    real_logo_path = get_image_path(LOGO_FILENAME)
    real_sig_path = get_image_path(SIGNATURE_FILENAME)

    # --- HEADER & LOGO ---
    if real_logo_path:
        try:
            # Removed mask='auto' to prevent transparency issues
            c.drawImage(real_logo_path, 40, height - 100, width=100, preserveAspectRatio=True)
        except Exception as e:
            print(f"Error loading logo: {e}")

    # Company Info
    c.setFont("Helvetica-Bold", 16)
    c.drawRightString(width - 40, height - 50, "PAYMENT RECEIPT")
    c.setFont("Helvetica-Bold", 12)
    c.drawRightString(width - 40, height - 70, COMPANY_NAME)
    c.setFont("Helvetica", 10)
    c.drawRightString(width - 40, height - 85, f"Date: {datetime.now().strftime('%Y-%m-%d')}")
    c.drawRightString(width - 40, height - 100, f"Receipt #: {uid[:8].upper()}")

    # Divider
    c.setStrokeColor(colors.grey)
    c.line(40, height - 120, width - 40, height - 120)

    # --- BILL TO ---
    c.setFont("Helvetica-Bold", 12)
    c.drawString(40, height - 150, "Bill To:")
    c.setFont("Helvetica", 12)
    c.drawString(40, height - 170, f"Name: {user_name}")
    c.drawString(40, height - 190, f"User ID: {uid}")

    # --- TABLE ---
    y_start = height - 240
    c.setFillColor(colors.lightgrey)
    c.rect(40, y_start, width - 80, 25, fill=1, stroke=0)
    
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y_start + 7, "Description")
    c.drawRightString(width - 50, y_start + 7, "Amount (ZMW)")

    # Row
    y_row = y_start - 30
    c.setFont("Helvetica", 12)
    c.drawString(50, y_row, f"{plan_name} - {credits} Credits")
    c.drawRightString(width - 50, y_row, f"K{amount}.00")

    # Total
    c.line(40, y_row - 20, width - 40, y_row - 20)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(width - 200, y_row - 50, "Total Paid:")
    c.drawRightString(width - 50, y_row - 50, f"K{amount}.00")

    # --- SIGNATURE ---
    sig_y_position = y_row - 130
    
    if real_sig_path:
        try:
            c.drawImage(real_sig_path, width - 200, sig_y_position, width=120, preserveAspectRatio=True)
        except Exception as e:
            print(f"Error loading signature: {e}")
    
    c.setStrokeColor(colors.black)
    c.line(width - 200, sig_y_position, width - 50, sig_y_position) 
    
    c.setFont("Helvetica-Bold", 10)
    c.drawRightString(width - 50, sig_y_position - 15, CEO_NAME)
    c.setFont("Helvetica", 10)
    c.drawRightString(width - 50, sig_y_position - 30, CEO_TITLE)

    c.drawString(40, 50, "Thank you for choosing Booxclash Learn!")
    c.drawCentredString(width / 2, 30, "Generated automatically by system.")

    c.save()
    buffer.seek(0)
    return buffer

# ==========================================
# 🚀 API ENDPOINTS
# ==========================================

@router.get("/users")
async def get_all_users(x_user_id: str = Header(None, alias="X-User-ID")):
    await verify_admin(x_user_id)
    
    # 1. Fetch from Auth (The Master List)
    try:
        all_auth_users = auth.list_users().iterate_all()
    except Exception as e:
        raise HTTPException(500, f"Error fetching auth users: {str(e)}")
    
    # 2. Fetch from DB
    db_docs = {doc.id: doc.to_dict() for doc in db.collection("users").stream()}
    
    combined_users = []
    
    for user in all_auth_users:
        uid = user.uid
        email = user.email or "No Email"
        db_data = db_docs.get(uid, {})
        
        # Robust Name Logic
        display_name = db_data.get("name")
        if not display_name: display_name = user.display_name
        if not display_name and email != "No Email": display_name = email.split("@")[0].title()
        if not display_name: display_name = "Unknown User"

        # Determine Status
        status = "active" if uid in db_docs else "new_signup"
        if db_data.get("is_approved"): status = "approved"

        combined_users.append({
            "uid": uid,
            "email": email,
            "name": display_name,
            "role": db_data.get("role", "user"),
            "credits": db_data.get("credits", 0),
            "joined_at": str(db_data.get("joined_at", datetime.fromtimestamp(user.user_metadata.creation_timestamp / 1000) if user.user_metadata.creation_timestamp else "Unknown")),
            "status": status,
            "is_approved": db_data.get("is_approved", False)
        })
    
    # Return sorted by newest
    return sorted(combined_users, key=lambda x: x['joined_at'], reverse=True)

@router.post("/users/topup")
async def top_up_user(action: TopUpRequest, x_user_id: str = Header(None, alias="X-User-ID")):
    await verify_admin(x_user_id)
    
    credits_to_add = 0
    plan_name = "Unknown"

    if action.amount_paid == 50:
        credits_to_add = 80
        plan_name = "Standard Plan (K50)"
    elif action.amount_paid == 120:
        credits_to_add = 300
        plan_name = "Premium Plan (K120)"
    else:
        raise HTTPException(status_code=400, detail="Invalid amount. Use 50 or 120.")

    user_ref = db.collection("users").document(action.target_uid)
    
    # AUTO-CREATE IF MISSING
    if not user_ref.get().exists:
        try:
            auth_user = auth.get_user(action.target_uid)
            d_name = auth_user.display_name or auth_user.email.split('@')[0]
            user_ref.set({
                "email": auth_user.email,
                "name": d_name,
                "role": "user",
                "joined_at": firestore.SERVER_TIMESTAMP,
                "credits": 0,
                "is_approved": False
            })
        except:
            pass # Continue to update()

    # Update DB
    user_ref.update({
        "is_approved": True, 
        "credits": firestore.Increment(credits_to_add),
        "last_payment_amount": action.amount_paid,
        "current_plan": plan_name,
        "last_payment_date": firestore.SERVER_TIMESTAMP
    })
    
    # Get User Data for Receipt
    u_data = user_ref.get().to_dict()
    u_name = u_data.get("name", "Valued Customer")
    
    # Return JSON Data for Frontend PDF Generation
    return {
        "status": "success",
        "receipt_no": action.target_uid[:8].upper(),
        "date": datetime.now().strftime('%Y-%m-%d'),
        "user_name": u_name,
        "user_uid": action.target_uid,
        "plan_name": plan_name,
        "credits": credits_to_add,
        "amount": action.amount_paid
    }
# --- OTHER ENDPOINTS ---
@router.post("/users/approve")
async def approve_user(action: AdminAction, x_user_id: str = Header(None, alias="X-User-ID")):
    await verify_admin(x_user_id)
    db.collection("users").document(action.target_uid).update({"is_approved": True, "credits": 9999})
    return {"status": "success"}

@router.delete("/users/{target_uid}")
async def delete_user(target_uid: str, x_user_id: str = Header(None, alias="X-User-ID")):
    await verify_admin(x_user_id)
    try:
        auth.delete_user(target_uid) # Delete from Auth
    except: pass
    db.collection("users").document(target_uid).delete() # Delete from DB
    return {"status": "success"}

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
    # Note: These are simple counts. For production with thousands of users, use aggregation queries.
    return {
        "total_users": len(list(db.collection("users").stream())),
        "total_schemes": len(list(db.collection("generated_schemes").stream())),
        "total_lessons": len(list(db.collection("generated_lesson_plans").stream()))
    }