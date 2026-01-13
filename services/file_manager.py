from services.firebase_setup import db
from google.cloud.firestore import Query
from datetime import datetime

# ==========================================
# 1. SCHEMES OF WORK
# ==========================================
def save_generated_scheme(uid: str, subject: str, grade: str, term: str, data: list):
    """
    Saves the generated scheme to Firestore immediately after generation.
    """
    try:
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
            "source": "backend_auto_save"
        })
        print(f"💾 Scheme saved to Firestore ID: {doc_ref.id}")
        return True
    except Exception as e:
        print(f"❌ Firestore Save Error: {e}")
        return False

def load_generated_scheme(uid: str, subject: str, grade: str, term: str):
    """
    Fetches the most recent scheme from Firestore.
    """
    try:
        if uid == "default_user":
             print("⚠️ Loading for default_user")

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

# ==========================================
# 2. WEEKLY PLANS
# ==========================================
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
            "weekNumber": int(week),
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
            .where("weekNumber", "==", int(week))
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

# ==========================================
# 3. LESSON PLANS (✅ ADDED)
# ==========================================
def save_lesson_plan(uid: str, subject: str, grade: str, term: str, week: int, data: dict):
    """
    Saves the Lesson Plan to Firestore.
    """
    try:
        doc_ref = db.collection("generated_lesson_plans").document()
        
        # Extract meaningful identifiers from the data if possible
        topic = data.get("topic", "General Topic")
        subtopic = data.get("subtopic", "General Lesson")

        doc_ref.set({
            "userId": uid,
            "subject": subject,
            "grade": grade,
            "term": term,
            "weekNumber": int(week),
            "topic": topic,
            "subtopic": subtopic,
            "lessonData": data,
            "createdAt": datetime.now(),
            "type": "Lesson Plan",
            "source": "backend_auto_save"
        })
        print(f"💾 Lesson Plan saved to Firestore ID: {doc_ref.id}")
        return True
    except Exception as e:
        print(f"❌ Firestore Save Error: {e}")
        return False

def load_lesson_plan(uid: str, subject: str, grade: str, term: str, week: int, subtopic: str = None):
    """
    Fetches a specific lesson plan.
    """
    try:
        query_ref = (
            db.collection("generated_lesson_plans")
            .where("userId", "==", uid)
            .where("subject", "==", subject)
            .where("grade", "==", grade)
            .where("term", "==", term)
            .where("weekNumber", "==", int(week))
        )

        if subtopic:
            query_ref = query_ref.where("subtopic", "==", subtopic)

        docs = query_ref.order_by("createdAt", direction=Query.DESCENDING).limit(1).stream()

        for doc in docs:
            data = doc.to_dict()
            return data.get("lessonData", {})

        print("⚠️ Lesson Plan not found in Firestore.")
        return None
    except Exception as e:
        print(f"❌ Firestore Read Error: {e}")
        return None