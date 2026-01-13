from datetime import datetime
from google.cloud.firestore import Increment
from services.firebase_setup import db


def check_and_deduct_credit(uid: str):
    """
    Checks user credits and deducts 1 credit atomically.
    - Initializes new users with 5 credits
    - Approved users have unlimited access
    - Prevents stale UID / deleted-user issues
    """

    # 🔧 Dev fallback
    if not uid or uid == "default_user":
        print("⚠️ Dev mode credit bypass")
        return True

    print(f"🔑 Credit Check UID: {uid}")

    user_ref = db.collection("users").document(uid)
    doc = user_ref.get()

    # 🆕 FIRST-TIME USER (or Firestore doc deleted)
    if not doc.exists:
        user_ref.set({
            "credits": 5,
            "is_approved": False,
            "joined_at": datetime.utcnow(),
        })
        print(f"🆕 User initialized with 5 credits: {uid}")
        return True

    user_data = doc.to_dict()

    # ✅ APPROVED USERS → UNLIMITED
    if user_data.get("is_approved", False):
        print(f"✅ Approved user detected: {uid}")
        return True

    # 🛡️ SAFETY: Missing credits field
    if "credits" not in user_data:
        user_ref.update({"credits": 5})
        print(f"♻️ Credits field missing — reset to 5 for {uid}")
        return True

    current_credits = int(user_data.get("credits", 0))

    # ⛔ NO CREDITS LEFT
    if current_credits <= 0:
        print(f"⛔ Credit exhausted for {uid}")
        raise Exception(
            "Free trial limit reached (2 Documents). Please upgrade to Premium."
        )

    # 💰 ATOMIC CREDIT DEDUCTION
    user_ref.update({
        "credits": Increment(-1)
    })

    print(f"💰 Credit deducted for {uid}. Remaining: {current_credits - 1}")
    return True
