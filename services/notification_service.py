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

# IMPORTANT: Put your actual WhatsApp number here (include the country code, no + or spaces)
# Example for Zambia: "https://wa.me/260971234567"
WHATSAPP_LINK = "https://wa.me/260967001972" 

def send_whatsapp_invite(user_email: str, user_name: str = None):
    """
    Sends a personal email from the founder offering 50 free credits for a chat.
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
        # Make it look like it's coming directly from you, not a generic "Team"
        msg['From'] = f"Kondwani from BooxClash <{SENDER_EMAIL}>"
        msg['To'] = user_email
        msg['Subject'] = "Can I give you 50 free Booxclash credits? 🎁"

        # --- 2. THE FOUNDER MESSAGE ---
        body = f"""Hi {greeting_name},

I'm Kondwani, the founder of Booxclash. I saw you signed up recently, and I want to make sure the platform is actually saving you time on your lesson plans.

I am talking to a few early users this week to learn how I can improve the app for Zambian teachers. If you have 5 minutes to chat with me on WhatsApp, I will add 50 free credits to your account right now.

Reply to this email with your WhatsApp number, or click here to message me directly: {WHATSAPP_LINK}

Thank you for building with me!

Kondwani
"""
        
        msg.attach(MIMEText(body, 'plain')) 

        # Connect to Server
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        print(f"✅ Founder invite sent to: {user_email} (Hi {greeting_name})")
        return True

    except Exception as e:
        print(f"❌ Failed to email {user_email}: {e}")
        return False