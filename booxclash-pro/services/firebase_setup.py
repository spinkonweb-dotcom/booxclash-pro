import os
import json
import firebase_admin
from firebase_admin import credentials, firestore

# Check if already initialized to prevent errors during hot-reload
if not firebase_admin._apps:
    # On Render, we will store the JSON string in an ENV variable called FIREBASE_CREDENTIALS
    # Locally, you can use a file path if you prefer, but ENV is safer.
    
    firebase_json = os.getenv("FIREBASE_CREDENTIALS")
    
    if firebase_json:
        # Load from Environment Variable (Production)
        cred_dict = json.loads(firebase_json)
        cred = credentials.Certificate(cred_dict)
    else:
        # Fallback for Loca (If you have the file locally)
        # Ensure 'serviceAccountKey.json' is in your .gitignore!
        cred = credentials.Certificate("serviceAccountKey.json")

    firebase_admin.initialize_app(cred)

db = firestore.client()