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

def run_newsletter_job(is_production=False):
    mode_text = "PRODUCTION" if is_production else "TEST MODE (Test Group Only)"
    print(f"🚀 Starting Newsletter Delivery Job [{mode_text}]...")
    db = get_db()
    
    # 1. Fetch Latest Content (Within 24 hours for fresh daily delivery)
    print("Fetching today's content (last 24h)...")
    yesterday = datetime.datetime.now() - datetime.timedelta(hours=24)
    
    docs = db.collection('contents')\
        .where('scraped_at', '>=', yesterday)\
        .stream()
    
    all_contents = []
    for doc in docs:
        all_contents.append(doc.to_dict())
    
    if not all_contents:
        print("⚠️ No content found in last 24h. Aborting.")
        return

    # Sort by view_count DESC (Handle None values by using 0)
    all_contents.sort(key=lambda x: x.get('view_count') or 0, reverse=True)
    
    # Limit to 30 items
    all_contents = all_contents[:30]
    
    # 2. Diversify Top Stories (Pick top 1 from each major category if available)
    # Categories: 경제, 부동산, IT, 과학
    major_cats = ['경제', '부동산', 'IT', '과학']
    top_stories = []
    seen_ids = set()
    
    # 2.1 First, try to get the top item from each major category
    for cat in major_cats:
        cat_items = [d for d in all_contents if d.get('category') == cat]
        if cat_items:
            item = cat_items[0]
            top_stories.append(item)
            seen_ids.add(f"{item['source_type']}_{item['original_id']}")
    
    # 2.2 Fill up to 3 (or 4) top stories if needed
    for item in all_contents:
        if len(top_stories) >= 4:
            break
        uid = f"{item['source_type']}_{item['original_id']}"
        if uid not in seen_ids:
            top_stories.append(item)
            seen_ids.add(uid)
            
    # Remaining stories for category sections
    remaining_stories = [i for i in all_contents if f"{i['source_type']}_{i['original_id']}" not in seen_ids]
    
    # Group by category strictly
    category_stories = {}
    for story in remaining_stories:
        cat = story.get('category') or '기타'
        if cat not in category_stories:
            category_stories[cat] = []
        category_stories[cat].append(story)
    
    newsletter_data = {
        'top_stories': top_stories,
        'category_stories': category_stories
    }

    # 2. Fetch Active Subscribers
    print(f"Fetching {'production' if is_production else 'test'} subscribers...")
    subs_docs = db.collection('subscribers').where('status', '==', 'active').stream()
    recipients = []
    
    for doc in subs_docs:
        data = doc.to_dict()
        is_test_user = data.get('is_test') == True
        
        # In production mode, skip test users
        if is_production and is_test_user:
            continue
        
        # In test mode, skip production users
        if not is_production and not is_test_user:
            continue
            
        enc_email = data.get('email')
        if enc_email:
            email = decrypt_email(enc_email)
            if email:
                recipients.append(email)
            else:
                # If decryption fails (maybe plaintext for testing), check
                if '@' in enc_email:
                    recipients.append(enc_email)
    
    recipients = list(set(recipients)) # Deduplicate
    
    if not recipients:
        print(f"ℹ️ No {'production' if is_production else 'test'} recipients found. Job skipped.")
        return

    print(f"📧 Found {len(recipients)} recipients.")
    
    # 3. Create mail_history entry first to get mail_id
    mail_history_ref = db.collection('mail_history').add({
        'sent_at': datetime.datetime.now().isoformat(),
        'type': 'production' if is_production else 'test_job',
        'recipient_count': len(recipients),
        'status': 'success',
        'simulated': False,
        'open_count': 0,      # Unique Opens (UV)
        'email_pv': 0,        # Total Page Views (PV)
        'click_count': 0      # Clicks
    })
    
    mail_id = mail_history_ref[1].id # Firestore .add returns (time, doc_ref)
    
    # 4. Send Emails
    email_service = EmailService()
    email_service.send_newsletter(recipients, newsletter_data, mail_id=mail_id)
    
    print(f"✅ Newsletter Job [{mode_text}] Complete.")

if __name__ == "__main__":
    # Check for --production flag
    is_prod = "--production" in sys.argv
    run_newsletter_job(is_production=is_prod)
