# FILE: services/credit_manager.py
from datetime import datetime
from google.cloud.firestore import Increment
from services.firebase_setup import db 

def check_and_deduct_credit(uid: str, cost: int = 1):
    """
    Checks user credits and deducts 'cost' credits atomically.
    - Initializes new users with 5 credits.
    - Approved users have unlimited access.
    """

    # 🔧 Dev fallback
    if not uid or uid == "default_user":
        print("⚠️ Dev mode credit bypass")
        return True

    print(f"🔑 Credit Check UID: {uid} | Cost: {cost}")

    user_ref = db.collection("users").document(uid)
    doc = user_ref.get()

    # 🆕 FIRST-TIME USER (Initialize & Deduct)
    if not doc.exists:
        initial_credits = 5
        # We give them 5, but this action consumes 'cost'
        # So we set their balance to 5 - cost
        user_ref.set({
            "credits": initial_credits - cost, 
            "is_approved": False,
            "joined_at": datetime.utcnow(),
            "email": "user@example.com" # Placeholder if not passed
        })
        print(f"🆕 User initialized with 5 credits. Deducted {cost}. Remaining: {initial_credits - cost}")
        return True

    user_data = doc.to_dict()

    # ✅ APPROVED USERS → UNLIMITED
    if user_data.get("is_approved", False):
        print(f"✅ Approved user detected: {uid}")
        return True

    # 🛡️ SAFETY: Missing credits field (Reset to 5)
    if "credits" not in user_data:
        user_ref.update({"credits": 5 - cost})
        print(f"♻️ Credits field missing — reset to 5 and deducted {cost}")
        return True

    current_credits = int(user_data.get("credits", 0))

    # ⛔ NO CREDITS LEFT
    if current_credits < cost:
        print(f"⛔ Credit exhausted for {uid}. Has: {current_credits}, Needs: {cost}")
        raise Exception(
            f"Insufficient credits (Required: {cost}, Available: {current_credits}). Please upgrade to Premium."
        )

    # 💰 ATOMIC CREDIT DEDUCTION
    user_ref.update({
        "credits": Increment(-cost)
    })

    print(f"💰 Credit deducted for {uid}. Remaining: {current_credits - cost}")
    return True