import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

# CONFIGURATION
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
# Ideally load these from environment variables for security
SENDER_EMAIL = os.getenv("EMAIL_USER", "booxclash@gmail.com")
SENDER_PASSWORD = os.getenv("EMAIL_PASS", "ygbh vgzy dvfw nies") 
WHATSAPP_LINK = "https://chat.whatsapp.com/GK2ahWLvPe3AN7ZkikXzhZ"

def send_whatsapp_invite(user_email: str, user_name: str = None):
    """
    Sends a friendly email inviting the user to the WhatsApp Community.
    Autodetects the first name for a personal touch.
    """
    if not user_email or "@" not in user_email:
        print(f"⚠️ Invalid email: {user_email}")
        return False

    # --- 1. SMART NAME LOGIC ---
    # If no name provided, default to 'Teacher'
    # If "John Doe" provided, split it to just "John"
    greeting_name = "Teacher"
    if user_name:
        greeting_name = user_name.split(" ")[0].capitalize()

    try:
        msg = MIMEMultipart()
        msg['From'] = f"BooxClash Team <{SENDER_EMAIL}>"
        msg['To'] = user_email
        msg['Subject'] = f"Hi {greeting_name}! Claim your Free Credits & Join our Community 🚀"

        # --- 2. THE UPDATED EMAIL BODY ---
        body = f"""Hi {greeting_name},

Thank you for joining BooxClash! We are thrilled to have you.

🎁 We have free credits for those joining our platform for the first time!

We teach you how to generate the lesson plans, schemes of work, and weekly records in seconds. 

To help you get the most out of BooxClash, we have a VIP WhatsApp group where we share:
✅ Instant support for Scheme/Lesson generation
✅ Updates on new Ministry formats
✅ Tips from other Head Teachers

👉 Click here to Join the Group: {WHATSAPP_LINK}

*(Note: If you have already joined our WhatsApp group, please ignore this message!)*

See you there!

Best,
The BooxClash Team
"""
        
        msg.attach(MIMEText(body, 'plain')) 

        # Connect to Server
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        print(f"✅ Invite sent to: {user_email} (Hi {greeting_name})")
        return True

    except Exception as e:
        print(f"❌ Failed to email {user_email}: {e}")
        return False