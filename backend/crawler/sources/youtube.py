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
                # Use a more robust check for channel URL
                if '/channel/' in channel_url or '/c/' in channel_url or '/user/' in channel_url or '@' in channel_url:
                    target_url = f"{channel_url.rstrip('/')}/videos"
                else:
                    target_url = channel_url
                
                # First get the playlist
                result = None
                try:
                    result = ydl.extract_info(target_url, download=False)
                except Exception as e:
                    print(f"  ✗ Failed to extract channel info for {target_url}: {e}")
                    # Try without /videos as fallback
                    if '/videos' in target_url:
                        try:
                            print(f"  ℹ️ Retrying without /videos: {channel_url}")
                            result = ydl.extract_info(channel_url, download=False)
                        except:
                            pass

                if result and 'entries' in result:
                    count = 0
                    for entry in result['entries']:
                        if not entry:
                            continue
                        if count >= limit:
                            break
                        
                        video_id = entry.get('id')
                        if not video_id:
                            continue
                        
                        video_url = f"https://www.youtube.com/watch?v={video_id}"
                        
                        # Default data from flat entry (Initial fallback)
                        title = entry.get('title', 'Unknown Title')
                        view_count = entry.get('view_count')
                        thumbnails = entry.get('thumbnails', [])
                        thumbnail_url = thumbnails[-1]['url'] if thumbnails else f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
                        description = "No description available."
                        
                        # Try full extraction for richer data, but fallback if blocked
                        try:
                            video_info = ydl.extract_info(video_url, download=False)
                            if video_info:
                                title = video_info.get('title', title)
                                view_count = video_info.get('view_count', view_count)
                                description_full = video_info.get('description', '')
                                if description_full:
                                    description = description_full[:200] + "..." if len(description_full) > 200 else description_full
                                thumbnails = video_info.get('thumbnails', thumbnails)
                                if thumbnails:
                                    # Pick the best thumbnail
                                    thumbnail_url = thumbnails[-1]['url']
                                # print(f"  ✓ Fetched full info for: {title}")
                            else:
                                print(f"  ℹ️ Using basic info for: {title} (Full info skipped)")
                        except Exception as e:
                            # If blocked, we still have the basic info from the entry!
                            # print(f"  ℹ️ Using basic info for: {title}")
                            pass

                        video_data = {
                            'source_type': 'youtube',
                            'opinion_leader': opinion_leader_name,
                            'title': title,
                            'url': video_url,
                            'thumbnail': thumbnail_url,
                            'description': description,
                            'published_at': datetime.datetime.now().isoformat(),
                            'original_id': video_id,
                            'view_count': view_count
                        }
                        videos.append(video_data)
                        count += 1
                        
                else:
                    print(f"  ✗ No videos found for {opinion_leader_name}")
                        
        except Exception as e:
            print(f"Error crawling {channel_url}: {e}")
            
        return videos

if __name__ == "__main__":
    # Test Use
    crawler = YouTubeCrawler()
    # Test with Syuka World
    test_videos = crawler.fetch_latest_videos("https://www.youtube.com/channel/UCsJ6RuBiTVWRX156FVbeaGg", limit=2, opinion_leader_name="슈카월드")
    import json
    print(json.dumps(test_videos, indent=2, ensure_ascii=False))
