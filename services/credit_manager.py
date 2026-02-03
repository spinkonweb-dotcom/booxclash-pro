from datetime import datetime
from google.cloud.firestore import Increment
from services.firebase_setup import db 

def check_and_deduct_credit(uid: str, cost: int = 1, school_id: str = None):
    """
    Checks credits and deducts 'cost' credits atomically.
    - 🏫 If 'school_id' is provided, it deducts from the SCHOOL document.
    - 👤 If NOT provided, it deducts from the USER document (individual).
    """

    # 🔧 Dev fallback
    if not uid or uid == "default_user":
        print("⚠️ Dev mode credit bypass")
        return True

    print(f"🔑 Credit Check | UID: {uid} | School ID: {school_id} | Cost: {cost}")

    # =========================================================
    # 🏫 PATH A: SCHOOL CREDIT DEDUCTION
    # =========================================================
    if school_id:
        school_ref = db.collection("schools").document(school_id)
        doc = school_ref.get()

        if not doc.exists:
            print(f"❌ School ID {school_id} not found.")
            raise Exception("School account not found or invalid.")

        school_data = doc.to_dict()
        current_credits = int(school_data.get("credits", 0))

        if current_credits < cost:
            print(f"⛔ SCHOOL Credit exhausted for {school_id}. Has: {current_credits}, Needs: {cost}")
            raise Exception(f"School credits exhausted (Available: {current_credits}). Please contact Admin.")

        # Deduct from School
        school_ref.update({ "credits": Increment(-cost) })
        print(f"💰 SCHOOL Credit deducted. Remaining: {current_credits - cost}")
        return True

    # =========================================================
    # 👤 PATH B: INDIVIDUAL USER DEDUCTION
    # =========================================================
    user_ref = db.collection("users").document(uid)
    doc = user_ref.get()

    # 🆕 FIRST-TIME USER (Initialize & Deduct)
    if not doc.exists:
        initial_credits = 3
        user_ref.set({
            "credits": initial_credits - cost, 
            "is_approved": False,
            "joined_at": datetime.utcnow(),
            "email": "user@example.com" 
        })
        print(f"🆕 User initialized with 3 credits. Deducted {cost}. Remaining: {initial_credits - cost}")
        return True

    user_data = doc.to_dict()

    # 🛡️ SAFETY: Missing credits field (Reset to 3)
    if "credits" not in user_data:
        user_ref.update({"credits": 3 - cost})
        print(f"♻️ Credits field missing — reset to 3 and deducted {cost}")
        return True

    current_credits = int(user_data.get("credits", 0))

    # ⛔ NO CREDITS LEFT
    if current_credits < cost:
        print(f"⛔ Credit exhausted for {uid}. Has: {current_credits}, Needs: {cost}")
        raise Exception(
            f"Insufficient credits (Required: {cost}, Available: {current_credits}). Please upgrade to Premium."
        )

    # 💰 ATOMIC CREDIT DEDUCTION
    user_ref.update({ "credits": Increment(-cost) })
    print(f"💰 Credit deducted for {uid}. Remaining: {current_credits - cost}")
    return True