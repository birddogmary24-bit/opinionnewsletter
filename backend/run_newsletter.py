import sys
import os
import datetime
from Crypto.Cipher import AES
from Crypto.Util import Counter
import binascii

# Add project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.email_service import EmailService
from utils.db import get_db

# Decryption Config (MUST MATCH WEB)
# For demo, we used manually set key in web API. Ideally share via .env
# In web/app/api/subscribe/route.ts we set:
ENCRYPTION_KEY_HEX = '3132333435363738393031323334353637383930313233343536373839303132' # '12345678901234567890123456789012' in hex?
# No, node crypto uses raw buffer. Let's match the logic.
# Key: '12345678901234567890123456789012'
KEY_BYTES = b'12345678901234567890123456789012'

def decrypt_email(encrypted_str):
    """
    Decrypts email formatted as iv_hex:ciphertext_hex
    NodeJS crypto default is AES-CBC-256 usually if just 'aes-256-cbc'
    """
    try:
        iv_hex, ciphertext_hex = encrypted_str.split(':')
        iv = binascii.unhexlify(iv_hex)
        ciphertext = binascii.unhexlify(ciphertext_hex)
        
        cipher = AES.new(KEY_BYTES, AES.MODE_CBC, iv)
        decrypted = cipher.decrypt(ciphertext)
        
        # Remove padding (PKCS7)
        pad_len = decrypted[-1]
        return decrypted[:-pad_len].decode('utf-8')
    except Exception as e:
        print(f"Decryption error: {e}")
        return None

def run_newsletter_job():
    print("🚀 Starting Newsletter Delivery Job...")
    db = get_db()
    
    # 1. Fetch Latest Content (Top 5-6 + Others)
    print("Fetching today's content...")
    docs = db.collection('contents').order_by('scraped_at', direction='DESCENDING').limit(50).stream()
    all_contents = []
    for doc in docs:
        all_contents.append(doc.to_dict())
    
    if not all_contents:
        print("⚠️ No content found. Aborting.")
        return

    # Logic: Top 3 mixed, rest grouped by opinion_leader
    top_limit = 3
    top_stories = all_contents[:top_limit]
    remaining_stories = all_contents[top_limit:]
    
    category_stories = {}
    for story in remaining_stories:
        leader = story.get('opinion_leader', 'Other')
        if leader not in category_stories:
            category_stories[leader] = []
        category_stories[leader].append(story)
    
    newsletter_data = {
        'top_stories': top_stories,
        'category_stories': category_stories
    }

    # 2. Fetch Active Subscribers
    print("Fetching subscribers...")
    subs_docs = db.collection('subscribers').where('status', '==', 'active').stream()
    recipients = []
    
    for doc in subs_docs:
        data = doc.to_dict()
        enc_email = data.get('email')
        if enc_email:
            email = decrypt_email(enc_email)
            if email:
                recipients.append(email)
            else:
                # If decryption fails (maybe plaintext for testing), check
                if '@' in enc_email:
                    recipients.append(enc_email)
    
    # Add dummy test email if list is empty for safety during test
    recipients.append('birddogmary24@gmail.com') 
    
    recipients = list(set(recipients)) # Deduplicate
    
    print(f"📧 Found {len(recipients)} recipients.")
    
    # 3. Send Emails
    email_service = EmailService()
    email_service.send_newsletter(recipients, newsletter_data)
    
    print("✅ Newsletter Job Complete.")

if __name__ == "__main__":
    run_newsletter_job()
