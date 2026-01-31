import sys
import os
import datetime

# Add project root to path to allow imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from crawler.sources.youtube import YouTubeCrawler
from utils.db import get_db

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
            videos = yt_crawler.fetch_latest_videos(
                source['url'], 
                limit=3, 
                opinion_leader_name=source['name']
            )
            all_content.extend(videos)
            
    # 4. Save to Database
    print(f"💾 Saving {len(all_content)} items to Firestore...")
    collection_ref = db.collection('contents')
    
    saved_count = 0
    for item in all_content:
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
