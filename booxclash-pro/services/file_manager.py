from services.firebase_setup import db
from google.cloud.firestore import Query
from datetime import datetime

# ==========================================
# ✅ NEW: Save Function (Fixes ImportError)
# ==========================================
def save_generated_scheme(uid: str, subject: str, grade: str, term: str, data: list):
    """
    Saves the generated scheme to Firestore immediately after generation.
    This ensures data is safe even if the user closes the browser.
    """
    try:
        # Create a new document in the 'generated_schemes' collection
        doc_ref = db.collection("generated_schemes").document()
        
        doc_ref.set({
            "userId": uid,
            "schoolName": "Unknown School", # Default, user can update later
            "subject": subject,
            "grade": grade,
            "term": term,
            "schemeData": data,
            "createdAt": datetime.now(),
            "type": "Scheme of Work",
            "source": "backend_auto_save" # Tag to know it came from the API
        })
        print(f"💾 Scheme saved to Firestore ID: {doc_ref.id}")
        return True
    except Exception as e:
        print(f"❌ Firestore Save Error: {e}")
        return False

# ==========================================
# LOAD FUNCTIONS (For Agents)
# ==========================================
def load_generated_scheme(uid: str, subject: str, grade: str, term: str):
    """
    Fetches the most recent scheme from Firestore.
    """
    try:
        # If default_user (dev mode), return empty or handle differently
        if uid == "default_user":
             print("⚠️ Loading for default_user (might return empty if no manual file save exists)")

        docs = (
            db.collection("generated_schemes")
            .where("userId", "==", uid)
            .where("subject", "==", subject)
            .where("grade", "==", grade)
            .where("term", "==", term)
            .order_by("createdAt", direction=Query.DESCENDING)
            .limit(1)
            .stream()
        )
        
        for doc in docs:
            data = doc.to_dict()
            return data.get("schemeData", []) 
            
        print("⚠️ Scheme not found in Firestore.")
        return []
    except Exception as e:
        print(f"❌ Firestore Read Error: {e}")
        return []

def save_weekly_plan(uid: str, subject: str, grade: str, term: str, week: int, data: dict):
    """
    Saves the Weekly Plan to Firestore.
    """
    try:
        doc_ref = db.collection("generated_weekly_plans").document()
        doc_ref.set({
            "userId": uid,
            "subject": subject,
            "grade": grade,
            "term": term,
            "weekNumber": week,
            "planData": data,
            "createdAt": datetime.now(),
            "type": "Weekly Forecast",
            "source": "backend_auto_save"
        })
        print(f"💾 Weekly Plan saved to Firestore ID: {doc_ref.id}")
        return True
    except Exception as e:
        print(f"❌ Firestore Save Error: {e}")
        return False

def load_weekly_plan(uid: str, subject: str, grade: str, term: str, week: int):
    """
    Fetches the most recent weekly plan from Firestore.
    """
    try:
        docs = (
            db.collection("generated_weekly_plans")
            .where("userId", "==", uid)
            .where("subject", "==", subject)
            .where("grade", "==", grade)
            .where("term", "==", term)
            .where("weekNumber", "==", week)
            .order_by("createdAt", direction=Query.DESCENDING)
            .limit(1)
            .stream()
        )

        for doc in docs:
            data = doc.to_dict()
            return data.get("planData", {})

        print("⚠️ Weekly Plan not found in Firestore.")
        return None
    except Exception as e:
        print(f"❌ Firestore Read Error: {e}")
        return None