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
    
    # 1. Define Sources (Comprehensive list of Opinion Leaders)
    sources = [
        # 경제/투자 (Economy & Finance)
        {"type": "youtube", "name": "슈카월드", "url": "https://www.youtube.com/channel/UCsJ6RuBiTVWRX156FVbeaGg", "category": "경제"},
        {"type": "youtube", "name": "매경 월가월부", "url": "https://www.youtube.com/channel/UCIipmgxpUxDmPP-ma3Ahvbw", "category": "경제"},
        {"type": "youtube", "name": "홍춘욱의 경제강의노트", "url": "https://www.youtube.com/channel/UCmNbuxmvRVv9OcdAO0cpLnw", "category": "경제"},
        
        # 부동산 (Real Estate)
        {"type": "youtube", "name": "월급쟁이부자들TV", "url": "https://www.youtube.com/channel/UCDSj40X9FFUAnx1nv7gQhcA", "category": "부동산"},
        {"type": "youtube", "name": "부읽남TV", "url": "https://www.youtube.com/channel/UC2QeHNJFfuQWB4cy3M-745g", "category": "부동산"},
        {"type": "youtube", "name": "재테크 읽어주는 파일럿", "url": "https://www.youtube.com/@pilot_money", "category": "부동산"},
        
        # IT/코딩 (IT & Tech)
        {"type": "youtube", "name": "조코딩", "url": "https://www.youtube.com/@jocoding", "category": "IT"},
        {"type": "youtube", "name": "노마드 코더", "url": "https://www.youtube.com/@nomadcoders", "category": "IT"},
        {"type": "youtube", "name": "포프TV", "url": "https://www.youtube.com/@popekim", "category": "IT"},
        
        # 과학 (Science)
        {"type": "youtube", "name": "안될과학", "url": "https://www.youtube.com/@the_AS", "category": "과학"},
        {"type": "youtube", "name": "궤도", "url": "https://www.youtube.com/@science_orbit", "category": "과학"},
        {"type": "youtube", "name": "과학드림", "url": "https://www.youtube.com/@ScienceDream", "category": "과학"}
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
            # Add category to each video item
            for v in videos:
                v['category'] = source.get('category', '기타')
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
        
        # Check if exists first to preserve discovery date (scraped_at)
        doc_ref = collection_ref.document(doc_id)
        doc_snapshot = doc_ref.get()
        
        if doc_snapshot.exists:
            # Update only dynamic fields, preserve scraped_at
            print(f"   - Updating views for: {item['title']}")
            doc_ref.update({
                'view_count': item.get('view_count'),
                'description': item.get('description') # Update description if it was improved
            })
        else:
            # New Discovery
            item['scraped_at'] = datetime.datetime.now()
            doc_ref.set(item)
            print(f"   - Newly Discovered: {item['title']}")
            saved_count += 1
        
    print(f"✅ Job Complete. {saved_count} items processed.")

if __name__ == "__main__":
    run_crawlers()
