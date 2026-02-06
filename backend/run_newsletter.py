import sys
import os
import datetime
import random
from utils.db import get_db
from services.email_service import EmailService
from services.crypto_service import decrypt_email

# Add project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def run_newsletter_job(is_production=False):
    mode_text = "PRODUCTION" if is_production else "TEST MODE (Test Group Only)"
    print(f"🚀 Starting Newsletter Delivery Job [{mode_text}]...")
    db = get_db()
    
    # 1. Fetch Latest Content (Within last 24h OR recently updated)
    # Note: We look back 26 hours to catch everything from the previous morning's crawl
    print("Fetching today's content (last 26h)...")
    time_threshold = datetime.datetime.now() - datetime.timedelta(hours=26)
    
    docs = db.collection('contents')\
        .where('scraped_at', '>=', time_threshold)\
        .stream()
    
    all_contents = []
    for doc in docs:
        all_contents.append(doc.to_dict())
    
    if not all_contents:
        print("⚠️ No content found in last 26h. Aborting.")
        return

    # Sort all by view_count DESC to prioritize quality
    # Treat None as -1 to put them at the end of sorted list but still allow selection
    all_contents.sort(key=lambda x: x.get('view_count') if x.get('view_count') is not None else -1, reverse=True)
    
    # All Categories
    major_cats = ['정치', '경제', '사회', '부동산', 'IT', '과학', '문화', '지식']
    random.shuffle(major_cats)
    
    top_stories = []
    category_stories = {}
    seen_ids = set()
    seen_channels = set() # Global channel deduplication to ensure maximum variety
    
    # Selection Phase 1: Pick Top Highlights
    # We want 4 highlights from 4 different categories AND 4 different channels
    potential_highlight_cats = [cat for cat in major_cats if any(d.get('category') == cat for d in all_contents)]
    highlight_cats = potential_highlight_cats[:4]
    
    for cat in highlight_cats:
        cat_items = [d for d in all_contents if d.get('category') == cat]
        for item in cat_items:
            channel = item.get('opinion_leader')
            if channel not in seen_channels:
                top_stories.append(item)
                seen_ids.add(f"{item['source_type']}_{item['original_id']}")
                seen_channels.add(channel)
                break # Move to next category highlight

    # Selection Phase 2: Fill Category Sections
    # We iterate through ALL categories that have content
    for cat in major_cats:
        cat_items = [d for d in all_contents if d.get('category') == cat]
        if not cat_items:
            continue
            
        display_items = []
        for item in cat_items:
            # Skip if already in highlights or if this channel was already used
            item_id = f"{item['source_type']}_{item['original_id']}"
            channel = item.get('opinion_leader')
            
            if item_id not in seen_ids and channel not in seen_channels:
                display_items.append(item)
                seen_ids.add(item_id)
                seen_channels.add(channel)
                
                if len(display_items) >= 3:
                    break
        
        if display_items:
            category_stories[cat] = display_items

    newsletter_data = {
        'top_stories': top_stories,
        'category_stories': category_stories
    }
    
    # 1.5 Thumbnail Repair & Default Injection
    DEFAULT_THUMB = "https://opinion-newsletter-web-810426728503.us-central1.run.app/default_thumb.png"
    
    def repair_thumbnail(item):
        # 1. YouTube: Always reconstruct stable URL to fix broken/expiring links
        if item.get('source_type') == 'youtube' and item.get('original_id'):
            return f"https://i.ytimg.com/vi/{item['original_id']}/hqdefault.jpg"
        
        # 2. Others: Use existing or fallback to default
        if item.get('thumbnail'):
            return item['thumbnail']
            
        return DEFAULT_THUMB

    for item in newsletter_data['top_stories']:
        item['thumbnail'] = repair_thumbnail(item)
            
    for cat_items in newsletter_data['category_stories'].values():
        for item in cat_items:
            item['thumbnail'] = repair_thumbnail(item)

    # 2. Fetch Active Subscribers
    print(f"Fetching {'production' if is_production else 'test'} subscribers...")
    subs_docs = db.collection('subscribers').where('status', '==', 'active').stream()
    recipients = []
    
    for doc in subs_docs:
        data = doc.to_dict()
        is_test_user = data.get('is_test') == True
        
        if is_production:
            if not is_test_user: recipients.append(decrypt_email(data['email']))
        else:
            if is_test_user: recipients.append(decrypt_email(data['email']))
    
    recipients = [r for r in list(set(recipients)) if r]
    
    if not recipients:
        print(f"ℹ️ No recipients found logic. Job skipped.")
        return

    print(f"📧 Found {len(recipients)} recipients.")
    
    # 3. Create mail_history entry
    mail_history_ref = db.collection('mail_history').add({
        'sent_at': datetime.datetime.now().isoformat(),
        'type': 'production' if is_production else 'test_job',
        'recipient_count': len(recipients),
        'status': 'success',
        'simulated': False,
        'open_count': 0,
        'email_pv': 0,
        'click_count': 0
    })
    
    mail_id = mail_history_ref[1].id
    
    # 4. Send Emails
    email_service = EmailService()
    email_service.send_newsletter(recipients, newsletter_data, mail_id=mail_id)
    
    print(f"✅ Newsletter Job Complete.")

if __name__ == "__main__":
    # If run manually, default to test mode unless production arg passed
    prod = "--production" in sys.argv
    run_newsletter_job(is_production=prod)
