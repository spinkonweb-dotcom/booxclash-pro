# services/credit_manager.py
import json
import os

CREDITS_FILE = "user_credits.json"
FREE_TRIAL_CREDITS = 2
COST_PER_GENERATION = 1

def load_credits_db():
    if not os.path.exists(CREDITS_FILE):
        return {}
    with open(CREDITS_FILE, "r") as f:
        return json.load(f)

def save_credits_db(data):
    with open(CREDITS_FILE, "w") as f:
        json.dump(data, f, indent=4)

def get_user_balance(user_id: str) -> int:
    db = load_credits_db()
    
    # If user is new, give them the Free Trial credits automatically
    if user_id not in db:
        db[user_id] = FREE_TRIAL_CREDITS
        save_credits_db(db)
        return FREE_TRIAL_CREDITS
    
    return db[user_id]

def deduct_credit(user_id: str) -> bool:
    db = load_credits_db()
    
    current_balance = db.get(user_id, FREE_TRIAL_CREDITS)
    
    if current_balance < COST_PER_GENERATION:
        return False # Not enough credits
    
    # Deduct credit
    db[user_id] = current_balance - COST_PER_GENERATION
    save_credits_db(db)
    return True

def add_credits(user_id: str, amount: int):
    """ Call this function when they pay K50 or K120 """
    db = load_credits_db()
    current = db.get(user_id, 0) # If they pay, they might be new or existing
    db[user_id] = current + amount
    save_credits_db(db)
    return db[user_id]