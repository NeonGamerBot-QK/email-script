import imaplib
import email
from email.header import decode_header

# --- CONFIGURATION ---
IMAP_SERVER = "saahild.com"  # Replace with your email provider's IMAP server
EMAIL_ACCOUNT = "neon@saahild.com"
EMAIL_PASSWORD = ""  # For Gmail, use an app-specific password
MAILBOX = "INBOX"  # You can change this if you want a different folder

# --- CONNECT TO IMAP SERVER ---
try:
    mail = imaplib.IMAP4_SSL(IMAP_SERVER)
    mail.login(EMAIL_ACCOUNT, EMAIL_PASSWORD)
    print("Logged in successfully")
except Exception as e:
    print("Login failed:", e)
    exit(1)

# --- SELECT MAILBOX ---
mail.select(MAILBOX)

# --- SEARCH FOR ALL EMAILS ---
status, messages = mail.search(None, "ALL")
if status != "OK":
    print("Failed to retrieve emails")
    exit(1)

email_ids = messages[0].split()

print(f"Found {len(email_ids)} emails\n")

# --- FETCH EACH EMAIL AND LOG SUBJECT ---
for email_id in email_ids:
    status, msg_data = mail.fetch(email_id, "(RFC822)")
    if status != "OK":
        print(f"Failed to fetch email ID {email_id}")
        continue

    for response_part in msg_data:
        if isinstance(response_part, tuple):
            msg = email.message_from_bytes(response_part[1])
            subject, encoding = decode_header(msg["Subject"])[0]

            if isinstance(subject, bytes):
                try:
                    subject = subject.decode(encoding if encoding else "utf-8")
                except:
                    subject = subject.decode("utf-8", errors="replace")
            
            print(f"Email ID {email_id.decode()}: {subject}")

# --- LOGOUT ---
mail.logout()
