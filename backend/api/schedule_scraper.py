import re
import json
import logging
from typing import Dict, List, Any

logger = logging.getLogger("restram.schedule_scraper")

DAYS_MAP = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
DAYS_ID = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]

def scrape_realtime_schedule() -> Dict[str, List[Dict[str, Any]]]:
    """
    Scrape real-time anime release schedule using Scrapling (with httpx fallback).
    Primary target: https://v2.samehadaku.how/jadwal-rilis/
    """
    schedule_data: Dict[str, List[Dict[str, Any]]] = {k: [] for k in DAYS_MAP}
    
    html = ""
    try:
        from scrapling import Fetcher
        res = Fetcher.get('https://v2.samehadaku.how/jadwal-rilis/', timeout=12)
        if res.status == 200:
            results = res.css('.result-schedule')
            for idx, day_container in enumerate(results[:7]):
                day_key = DAYS_MAP[idx]
                day_id = DAYS_ID[idx]
                for card in day_container.css('.animepost'):
                    title = card.css('a[title]::attr(title)').get() or card.css('img::attr(title)').get() or ""
                    link = card.css('a[title]::attr(href)').get() or card.css('a::attr(href)').get() or ""
                    img = card.css('img::attr(src)').get() or ""
                    slug = ""
                    m = re.search(r'/anime/([^/]+)/?', link)
                    if m:
                        slug = m.group(1)
                    
                    if title:
                        schedule_data[day_key].append({
                            "title": title.strip(),
                            "slug": slug or title.lower().replace(" ", "-"),
                            "url": link,
                            "poster": img,
                            "day": day_id,
                            "day_key": day_key,
                            "type": "TV",
                            "score": 8.5
                        })
            if any(len(v) > 0 for v in schedule_data.values()):
                logger.info("Successfully scraped schedule using Scrapling")
                return schedule_data
    except Exception as e:
        logger.warning(f"Scrapling scrape failed, attempting httpx fallback: {e}")

    # Fallback to httpx + regex parser if Scrapling or site was interrupted
    try:
        import httpx
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Referer": "https://www.google.com/"
        }
        with httpx.Client(timeout=12, follow_redirects=True, headers=headers) as client:
            resp = client.get("https://v2.samehadaku.how/jadwal-rilis/")
            if resp.status_code == 200:
                html = resp.text
                parts = html.split('<div class="result-schedule">')
                if len(parts) >= 8:
                    for idx, part in enumerate(parts[1:8]):
                        day_key = DAYS_MAP[idx]
                        day_id = DAYS_ID[idx]
                        cards = part.split('class="animepost"')
                        for c in cards[1:]:
                            m_title = re.search(r'title="([^"]+)"', c)
                            m_href = re.search(r'href="([^"]+)"', c)
                            m_img = re.search(r'src="([^"]+)"', c)
                            if m_title:
                                t = m_title.group(1).strip()
                                l = m_href.group(1).strip() if m_href else ""
                                im = m_img.group(1).strip() if m_img else ""
                                m_slug = re.search(r'/anime/([^/]+)/?', l)
                                sl = m_slug.group(1) if m_slug else t.lower().replace(" ", "-")
                                schedule_data[day_key].append({
                                    "title": t,
                                    "slug": sl,
                                    "url": l,
                                    "poster": im,
                                    "day": day_id,
                                    "day_key": day_key,
                                    "type": "TV",
                                    "score": 8.5
                                })
                    if any(len(v) > 0 for v in schedule_data.values()):
                        return schedule_data
    except Exception as ex:
        logger.error(f"Fallback schedule scrape failed: {ex}")

    return schedule_data

if __name__ == "__main__":
    data = scrape_realtime_schedule()
    total = sum(len(v) for v in data.values())
    print(f"Total scraped animes across 7 days: {total}")
    for d, items in data.items():
        print(f"  {d}: {len(items)} items")
