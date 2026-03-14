import os
import datetime
import requests


class YouTubeCrawler:
    """
    YouTube Data API v3를 사용하여 채널 최신 영상을 크롤링합니다.
    yt-dlp 방식 대비 IP 차단 없음, 공식 API 사용으로 안정적입니다.

    할당량: 채널당 ~3 units, 40채널 = ~120 units/일 (10,000 할당량 대비 1.2%)
    """

    BASE_URL = "https://www.googleapis.com/youtube/v3"

    def __init__(self):
        self.api_key = os.environ.get("YOUTUBE_API_KEY")
        if not self.api_key:
            raise ValueError("YOUTUBE_API_KEY 환경변수가 설정되지 않았습니다.")
        # handle → channel_id 캐시 (중복 조회 방지)
        self._channel_cache: dict[str, str] = {}

    def _get(self, endpoint: str, params: dict) -> dict:
        params["key"] = self.api_key
        resp = requests.get(f"{self.BASE_URL}/{endpoint}", params=params, timeout=15)
        resp.raise_for_status()
        return resp.json()

    def _get_uploads_playlist_id(self, channel_url: str) -> str | None:
        """
        채널 URL에서 uploads 플레이리스트 ID를 가져옵니다.
        @handle, /channel/UC..., /c/name, /user/name 형식 모두 지원합니다.
        """
        if channel_url in self._channel_cache:
            return self._channel_cache[channel_url]

        params: dict = {"part": "contentDetails"}

        # @handle 추출
        if "/@" in channel_url:
            handle = channel_url.split("/@")[-1].rstrip("/")
            params["forHandle"] = f"@{handle}"
        elif "/channel/" in channel_url:
            channel_id = channel_url.split("/channel/")[-1].rstrip("/")
            params["id"] = channel_id
        elif "/user/" in channel_url:
            username = channel_url.split("/user/")[-1].rstrip("/")
            params["forUsername"] = username
        elif "/c/" in channel_url:
            # /c/ 형식은 forHandle로 시도
            name = channel_url.split("/c/")[-1].rstrip("/")
            params["forHandle"] = f"@{name}"
        else:
            print(f"  ⚠️ 지원하지 않는 채널 URL 형식: {channel_url}")
            return None

        try:
            data = self._get("channels", params)
            items = data.get("items", [])
            if not items:
                print(f"  ⚠️ 채널을 찾을 수 없음: {channel_url}")
                return None

            uploads_id = items[0]["contentDetails"]["relatedPlaylists"]["uploads"]
            self._channel_cache[channel_url] = uploads_id
            return uploads_id
        except Exception as e:
            print(f"  ❌ channels.list 실패 ({channel_url}): {e}")
            return None

    def _get_video_ids(self, uploads_playlist_id: str, limit: int) -> list[str]:
        """uploads 플레이리스트에서 최신 영상 ID를 가져옵니다."""
        try:
            data = self._get("playlistItems", {
                "part": "contentDetails",
                "playlistId": uploads_playlist_id,
                "maxResults": limit,
            })
            return [
                item["contentDetails"]["videoId"]
                for item in data.get("items", [])
            ]
        except Exception as e:
            print(f"  ❌ playlistItems.list 실패: {e}")
            return []

    def _get_video_details(self, video_ids: list[str]) -> list[dict]:
        """영상 ID 목록으로 제목/조회수/썸네일/설명을 일괄 조회합니다."""
        if not video_ids:
            return []
        try:
            data = self._get("videos", {
                "part": "snippet,statistics",
                "id": ",".join(video_ids),
            })
            return data.get("items", [])
        except Exception as e:
            print(f"  ❌ videos.list 실패: {e}")
            return []

    def fetch_latest_videos(self, channel_url: str, limit: int = 5, opinion_leader_name: str = "Unknown") -> list[dict]:
        """
        채널 URL에서 최신 영상 메타데이터를 가져옵니다.

        Returns:
            list[dict]: video metadata 리스트
        """
        print(f"Crawling {opinion_leader_name} ({channel_url})...")
        videos = []

        uploads_id = self._get_uploads_playlist_id(channel_url)
        if not uploads_id:
            return videos

        video_ids = self._get_video_ids(uploads_id, limit)
        if not video_ids:
            print(f"  ⚠️ 영상 없음: {opinion_leader_name}")
            return videos

        items = self._get_video_details(video_ids)

        for item in items:
            video_id = item.get("id", "")
            snippet = item.get("snippet", {})
            statistics = item.get("statistics", {})

            title = snippet.get("title", "Unknown Title")

            # 썸네일: maxres → high → medium → 직접 생성 순서
            thumbnails = snippet.get("thumbnails", {})
            thumbnail_url = (
                thumbnails.get("maxres", {}).get("url")
                or thumbnails.get("high", {}).get("url")
                or thumbnails.get("medium", {}).get("url")
                or f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
            )

            description_full = snippet.get("description", "")
            description = (
                description_full[:200] + "..."
                if len(description_full) > 200
                else description_full or "No description available."
            )

            view_count_raw = statistics.get("viewCount")
            view_count = int(view_count_raw) if view_count_raw else 0

            # 실제 업로드 시각 사용 (yt-dlp는 크롤링 시각을 저장하던 버그 있었음)
            published_at = snippet.get("publishedAt", datetime.datetime.now(datetime.timezone.utc).isoformat())

            videos.append({
                "source_type": "youtube",
                "opinion_leader": opinion_leader_name,
                "title": title,
                "url": f"https://www.youtube.com/watch?v={video_id}",
                "thumbnail": thumbnail_url,
                "description": description,
                "published_at": published_at,
                "original_id": video_id,
                "view_count": view_count,
            })
            print(f"  ✅ {title[:40]}")

        return videos


if __name__ == "__main__":
    import json
    crawler = YouTubeCrawler()
    test = crawler.fetch_latest_videos("https://www.youtube.com/@syukaworld", limit=2, opinion_leader_name="슈카월드")
    print(json.dumps(test, indent=2, ensure_ascii=False))
