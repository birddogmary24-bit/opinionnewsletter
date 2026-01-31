import sys
import os
import datetime

# Add project root to path to allow imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from crawler.sources.youtube import YouTubeCrawler
from utils.db import get_db

from google.cloud import translate_v2 as translate
import re

def translate_text(text, target_language='ko'):
    """Translates text to target language if it contains significant non-Korean characters."""
    # Simple check: if it has no Hangul, try translating
    if not re.search('[가-힣]', text):
        try:
            translate_client = translate.Client()
            result = translate_client.translate(text, target_language=target_language)
            return result['translatedText']
        except Exception as e:
            print(f"Translation failed for '{text}': {e}")
            return text
    return text

def run_crawlers():
    print("🚀 Starting Daily Crawler Job...")
    
    # 1. Define Sources
    sources = [
        {
            "type": "youtube",
            "name": "슈카월드",
            "url": "https://www.youtube.com/@syukaworld"
        },
        {
            "type": "youtube",
            "name": "매경 월가월부",
            "url": "https://www.youtube.com/@MK_Invest"
        }
    ]
    
    # 2. Initialize Crawlers
    yt_crawler = YouTubeCrawler()
    db = get_db()
    
    all_content = []
    
    # 3. Process Sources
    for source in sources:
        if source['type'] == 'youtube':
            print(f"Crawling {source['name']} ({source['url']})...")
            videos = yt_crawler.fetch_latest_videos(
                source['url'], 
                limit=10, 
                opinion_leader_name=source['name']
            )
            all_content.extend(videos)
            
    # 4. Save to Database
    print(f"💾 Saving {len(all_content)} items to Firestore...")
    collection_ref = db.collection('contents')
    
    saved_count = 0
    for item in all_content:
        # Translate Title if needed
        original_title = item['title']
        translated_title = translate_text(original_title)
        if original_title != translated_title:
             print(f"   - Translated: '{original_title}' -> '{translated_title}'")
             item['title'] = translated_title

        # Create a unique ID based on source and original ID to prevent duplicates
        doc_id = f"{item['source_type']}_{item['original_id']}"
        
        # Add metadata
        item['scraped_at'] = datetime.datetime.now()
        
        # Save (using set with merge=True to update if exists)
        collection_ref.document(doc_id).set(item, merge=True)
        print(f"   - Saved: {item['title']}")
        saved_count += 1
        
    print(f"✅ Job Complete. {saved_count} items processed.")

if __name__ == "__main__":
    run_crawlers()
