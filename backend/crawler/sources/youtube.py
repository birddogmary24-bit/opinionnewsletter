import yt_dlp
import datetime

class YouTubeCrawler:
    """
    Crawls YouTube channels using yt-dlp to fetch the latest videos.
    """
    
    def __init__(self):
        self.ydl_opts = {
            'quiet': True,
            'extract_flat': False,  # Get full metadata including proper titles
            'force_generic_extractor': False,
            'ignoreerrors': True,
            'writesubtitles': False,
            'skip_download': True,
            'no_warnings': True,
        }

    def fetch_latest_videos(self, channel_url, limit=5, opinion_leader_name="Unknown"):
        """
        Fetches the latest videos from a given channel URL.
        
        Args:
            channel_url (str): The URL of the YouTube channel.
            limit (int): Number of latest videos to fetch.
            opinion_leader_name (str): Name of the opinion leader for metadata.
            
        Returns:
            list: A list of dicts containing video metadata.
        """
        print(f"Crawling {opinion_leader_name} ({channel_url})...")
        videos = []
        
        try:
            with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
                # 'tab' can be 'videos', 'shorts', 'live', etc. default is usually home.
                # Appending /videos ensures we get the latest uploads.
                target_url = f"{channel_url}/videos" if not channel_url.endswith('/videos') else channel_url
                
                result = ydl.extract_info(target_url, download=False)
                
                if 'entries' in result:
                    # Sort entries by upload date just in case, though usually sorted by new
                    # But yt-dlp flat extraction sometimes returns a generator or list
                    count = 0
                    for entry in result['entries']:
                        if count >= limit:
                            break
                        if not entry:
                            continue
                            
                        # Extract data
                        video_id = entry.get('id')
                        title = entry.get('title')
                        url = f"https://www.youtube.com/watch?v={video_id}"
                        thumbnails = entry.get('thumbnails', [])
                        thumbnail_url = thumbnails[-1]['url'] if thumbnails else f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
                        
                        # Generate a simple description if missing (flat extract might miss full desc)
                        description = entry.get('description', '')
                        if not description:
                            description = "No description available."
                        else:
                            # Truncate description for preview
                            description = description[:200] + "..." if len(description) > 200 else description

                        video_data = {
                            'source_type': 'youtube',
                            'opinion_leader': opinion_leader_name,
                            'title': title,
                            'url': url,
                            'thumbnail': thumbnail_url,
                            'description': description,
                            'published_at': datetime.datetime.now().isoformat(), # Ideally parse upload_date
                            'original_id': video_id
                        }
                        videos.append(video_data)
                        count += 1
                        
        except Exception as e:
            print(f"Error crawling {channel_url}: {e}")
            
        return videos

if __name__ == "__main__":
    # Test Use
    crawler = YouTubeCrawler()
    # Test with Syuka World
    test_videos = crawler.fetch_latest_videos("https://www.youtube.com/@syukaworld", limit=2, opinion_leader_name="슈카월드")
    import json
    print(json.dumps(test_videos, indent=2, ensure_ascii=False))
