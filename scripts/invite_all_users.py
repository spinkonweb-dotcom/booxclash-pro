import firebase_admin
from firebase_admin import credentials, firestore
import sys
import os


# Get the folder where this script lives
script_dir = os.path.dirname(os.path.abspath(__file__))

# Go up one level to the project root (where main.py and serviceAccountKey.json are)
project_root = os.path.dirname(script_dir)

# Add root to system path so we can import 'services'
sys.path.append(project_root)

# Create the full path to the key file
key_path = os.path.join(project_root, "serviceAccountKey.json")

# Import the service (now that path is fixed)
try:
    from services.notification_service import send_whatsapp_invite
except ImportError:
    print("❌ Error: Could not import 'services'. Make sure you are running this correctly.")
    sys.exit(1)

# --- 2. INITIALIZE FIREBASE ---
if not firebase_admin._apps:
    print(f"🔑 Loading key from: {key_path}")
    if not os.path.exists(key_path):
        print("❌ Error: serviceAccountKey.json not found in the root folder!")
        sys.exit(1)
        
    cred = credentials.Certificate(key_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()

# --- 3. MAIN FUNCTION ---
def invite_existing_users():
    print("🔄 Fetching all users from Firestore...")
    
    # Get all users
    users_ref = db.collection("users")
    docs = users_ref.stream()
    
    count = 0
    success_count = 0
    
    for doc in docs:
        data = doc.to_dict()
        email = data.get("email")
        # Try to find a name, fallback to 'Teacher'
        name = data.get("displayName") or data.get("name") or "Teacher"
        
        # Check if they have an email and haven't been invited yet
        # We check 'whatsapp_invited' flag to prevent spamming people twice
        if email and not data.get("whatsapp_invited"):
            print(f"📩 Sending invite to {email}...")
            
            # Send the email
            sent = send_whatsapp_invite(email, name)
            
            if sent:
                success_count += 1
                # Mark as invited in database
                users_ref.document(doc.id).update({"whatsapp_invited": True})
            
            count += 1
        else:
            # Optional: Print skipped users
            # print(f"⏩ Skipping {email} (Already invited or no email)")
            pass

    print(f"\n🎉 Finished! Sent {success_count} invites out of {count} uninvited users found.")

if __name__ == "__main__":
    invite_existing_users()