import sys
import os
import datetime
import re
from google.cloud import translate_v2 as translate
from crawler.sources.youtube import YouTubeCrawler
from utils.db import get_db

# Add project root to path to allow imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def translate_text(text, target_language='ko'):
    """Translates text to target language if it contains significant non-Korean characters."""
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
    print("🚀 Starting Daily Crawler Job (40 Channels with Correct Handles)...")
    
    # 1. Comprehensive Source List (Verified Handles for 40 channels)
    sources = [
        # 정치 (Politics & Current Affairs)
        {"type": "youtube", "name": "김현정의 뉴스쇼", "url": "https://www.youtube.com/@newsshow981", "category": "정치"},
        {"type": "youtube", "name": "슈카월드", "url": "https://www.youtube.com/@syukaworld", "category": "정치"},
        {"type": "youtube", "name": "크랩 KLAB", "url": "https://www.youtube.com/@kbsklab", "category": "정치"},
        {"type": "youtube", "name": "스브스뉴스", "url": "https://www.youtube.com/@subusunews", "category": "정치"},
        {"type": "youtube", "name": "YTN 시사", "url": "https://www.youtube.com/@ytnnews24", "category": "정치"},
        
        # 경제 (Economy & Finance)
        {"type": "youtube", "name": "삼프로TV", "url": "https://www.youtube.com/@3protv", "category": "경제"},
        {"type": "youtube", "name": "머니인사이드", "url": "https://www.youtube.com/@moneyinside", "category": "경제"},
        {"type": "youtube", "name": "박곰희TV", "url": "https://www.youtube.com/@gOM-TV", "category": "경제"},
        {"type": "youtube", "name": "한경 코리아마켓", "url": "https://www.youtube.com/@hankyung_koreamarket", "category": "경제"},
        {"type": "youtube", "name": "달란트투자", "url": "https://www.youtube.com/@talentinvestment", "category": "경제"},
        
        # 사회 (Society)
        {"type": "youtube", "name": "씨리얼 CeREEL", "url": "https://www.youtube.com/@creal", "category": "사회"},
        {"type": "youtube", "name": "ODG", "url": "https://www.youtube.com/@odg.studio", "category": "사회"},
        {"type": "youtube", "name": "보따 BODA", "url": "https://www.youtube.com/@BODA_original", "category": "사회"},
        {"type": "youtube", "name": "희철리즘", "url": "https://www.youtube.com/@Heechulism", "category": "사회"},
        {"type": "youtube", "name": "헤이뉴스", "url": "https://www.youtube.com/@HeyNews", "category": "사회"},
        
        # 부동산 (Real Estate)
        {"type": "youtube", "name": "월급쟁이부자들TV", "url": "https://www.youtube.com/@weolbu", "category": "부동산"},
        {"type": "youtube", "name": "부읽남", "url": "https://www.youtube.com/@reading_man", "category": "부동산"},
        {"type": "youtube", "name": "빠숑의 세상 답사기", "url": "https://www.youtube.com/@ppassong", "category": "부동산"},
        {"type": "youtube", "name": "집코노미TV", "url": "https://www.youtube.com/@jipconomy", "category": "부동산"},
        {"type": "youtube", "name": "리얼캐스트TV", "url": "https://www.youtube.com/@realcasttv", "category": "부동산"},
        
        # IT (Tech)
        {"type": "youtube", "name": "ITSub잇섭", "url": "https://www.youtube.com/@ITSUB", "category": "IT"},
        {"type": "youtube", "name": "주연 ZUYONI", "url": "https://www.youtube.com/@zuyoni", "category": "IT"},
        {"type": "youtube", "name": "EO 이오", "url": "https://www.youtube.com/@eo_studio", "category": "IT"},
        {"type": "youtube", "name": "UNDERkg", "url": "https://www.youtube.com/@underkg", "category": "IT"},
        {"type": "youtube", "name": "뻘짓연구소", "url": "https://www.youtube.com/@BullsLab", "category": "IT"},
        
        # 과학 (Science)
        {"type": "youtube", "name": "안될과학", "url": "https://www.youtube.com/@Unrealscience", "category": "과학"},
        {"type": "youtube", "name": "긱블", "url": "https://www.youtube.com/@Geekble", "category": "과학"},
        {"type": "youtube", "name": "과학드림", "url": "https://www.youtube.com/@ScienceDream", "category": "과학"},
        {"type": "youtube", "name": "1분과학", "url": "https://www.youtube.com/@1minscience", "category": "과학"},
        {"type": "youtube", "name": "에스오디 SOD", "url": "https://www.youtube.com/@SOD_", "category": "과학"},
        
        # 문화 (Culture/Art)
        {"type": "youtube", "name": "이동진의 파이아키아", "url": "https://www.youtube.com/@Btv_piaquia", "category": "문화"},
        {"type": "youtube", "name": "셜록현준", "url": "https://www.youtube.com/@sherlock_hj", "category": "문화"},
        {"type": "youtube", "name": "조승연의 탐구생활", "url": "https://www.youtube.com/@Tamgu", "category": "문화"},
        {"type": "youtube", "name": "널 위한 문화예술", "url": "https://www.youtube.com/@art_for_you", "category": "문화"},
        {"type": "youtube", "name": "essential;", "url": "https://www.youtube.com/@essentialme", "category": "문화"},
        
        # 지식 (Knowledge/Trivia)
        {"type": "youtube", "name": "사물궁이 잡학지식", "url": "https://www.youtube.com/@speedwg_", "category": "지식"},
        {"type": "youtube", "name": "지식한입", "url": "https://www.youtube.com/@knowledge_sip", "category": "지식"},
        {"type": "youtube", "name": "교양만두", "url": "https://www.youtube.com/@gyoyangmandoo", "category": "지식"},
        {"type": "youtube", "name": "14F 일사에프", "url": "https://www.youtube.com/@14FMBC", "category": "지식"},
        {"type": "youtube", "name": "효짱", "url": "https://www.youtube.com/@hyozzang2", "category": "지식"}
    ]
    
    # 2. Initialize
    yt_crawler = YouTubeCrawler()
    db = get_db()
    all_content = []
    
    # 3. Process Sources
    for source in sources:
        try:
            print(f"Crawling {source['name']} ({source['url']})...")
            videos = yt_crawler.fetch_latest_videos(
                source['url'], 
                limit=5, 
                opinion_leader_name=source['name']
            )
            for v in videos:
                v['category'] = source.get('category', '기타')
            all_content.extend(videos)
        except Exception as e:
            print(f"Error crawling {source['name']}: {e}")
            
    # 4. Save to Database
    print(f"💾 Saving {len(all_content)} items to Firestore...")
    collection_ref = db.collection('contents')
    saved_count = 0
    now = datetime.datetime.now()
    
    for item in all_content:
        # Translate Title if needed
        item['title'] = translate_text(item['title'])

        doc_id = f"{item['source_type']}_{item['original_id']}"
        doc_ref = collection_ref.document(doc_id)
        doc_snapshot = doc_ref.get()
        
        if doc_snapshot.exists:
            # Update category and other fields, preserve scraped_at ONLY if it's within last 48h
            # If it's older, we refresh it so it appears in the next newsletter.
            existing_data = doc_snapshot.to_dict()
            scraped_at = existing_data.get('scraped_at')
            
            update_data = {
                'view_count': item.get('view_count'),
                'description': item.get('description'),
                'category': item.get('category') # Update category!
            }
            
            # If the video is very old (>48h), but it's one of the current top 5,
            # we don't want to spam it forever, but for this migration we want to see them.
            # Actually, Discovery should be once. 
            # But let's check if we should refresh scraped_at for this big update.
            # I'll refresh it if the category name changed, to ensure it shows up.
            if existing_data.get('category') != item.get('category'):
                update_data['scraped_at'] = now
                print(f"   - Category Migrated: {item['title']} -> {item['category']}")
            
            doc_ref.update(update_data)
        else:
            item['scraped_at'] = now
            doc_ref.set(item)
            saved_count += 1
        
    print(f"✅ Job Complete. {saved_count} new items processed.")

if __name__ == "__main__":
    run_crawlers()
