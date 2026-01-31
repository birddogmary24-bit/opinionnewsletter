import yt_dlp
import datetime

class YouTubeCrawler:
    """
    Crawls YouTube channels using yt-dlp to fetch the latest videos.
    """
    
    def __init__(self):
        self.ydl_opts = {
            'quiet': True,
            'extract_flat': 'in_playlist',  # Flat for playlist, full for videos
            'force_generic_extractor': False,
            'ignoreerrors': True,
            'skip_download': True,
            'extractor_args': {
                'youtube': {
                    'lang': ['ko'],  # Request Korean language
                    'hl': 'ko'       # YouTube interface language
                }
            }
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
                # Appending /videos ensures we get the latest uploads.
                target_url = f"{channel_url}/videos" if not channel_url.endswith('/videos') else channel_url
                
                # First get the playlist
                result = ydl.extract_info(target_url, download=False)
                
                if 'entries' in result:
                    count = 0
                    for entry in result['entries']:
                        if count >= limit:
                            break
                        if not entry:
                            continue
                        
                        # Get video ID and fetch full info to get proper Korean title
                        video_id = entry.get('id')
                        if not video_id:
                            continue
                        
                        # Fetch full video info to get Korean title
                        video_url = f"https://www.youtube.com/watch?v={video_id}"
                        try:
                            video_info = ydl.extract_info(video_url, download=False)
                            
                            title = video_info.get('title', '')
                            thumbnails = video_info.get('thumbnails', [])
                            thumbnail_url = thumbnails[-1]['url'] if thumbnails else f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
                            
                            # Generate a simple description if missing
                            description = video_info.get('description', '')
                            if not description:
                                description = "No description available."
                            else:
                                # Truncate description for preview
                                description = description[:200] + "..." if len(description) > 200 else description

                            video_data = {
                                'source_type': 'youtube',
                                'opinion_leader': opinion_leader_name,
                                'title': title,
                                'url': video_url,
                                'thumbnail': thumbnail_url,
                                'description': description,
                                'published_at': datetime.datetime.now().isoformat(),
                                'original_id': video_id,
                                'view_count': video_info.get('view_count')
                            }
                            videos.append(video_data)
                            count += 1
                            print(f"  ✓ Fetched: {title}")
                        except Exception as e:
                            print(f"  ✗ Error fetching video {video_id}: {e}")
                            continue
                        
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
