import os
import sys
import time
import json
import threading
import uvicorn
from playwright.sync_api import sync_playwright

TEST_PORT = 8798

def run_server():
    backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend")
    sys.path.insert(0, backend_dir)
    import main
    uvicorn.run(main.app, host="127.0.0.1", port=TEST_PORT, log_level="warning")

def test_banner_and_schedule():
    thread = threading.Thread(target=run_server, daemon=True)
    thread.start()

    import urllib.request
    ready = False
    for _ in range(30):
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{TEST_PORT}/api/health", timeout=1) as resp:
                if resp.status == 200:
                    ready = True
                    break
        except Exception:
            time.sleep(0.3)
    assert ready, "Server failed to start"

    print("[E2E] Server ready on port", TEST_PORT)

    # 1. Test Schedule API
    req = urllib.request.urlopen(f"http://127.0.0.1:{TEST_PORT}/api/schedule?day=all")
    sched_data = json.loads(req.read().decode("utf-8"))
    assert sched_data.get("success"), "Schedule API failed"
    total_sched = sched_data.get("data", {}).get("total", 0)
    print(f"[E2E] Schedule API total anime: {total_sched}")
    assert total_sched >= 40, f"Expected >= 40 anime in schedule, got {total_sched}"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        page.on("console", lambda msg: print(f"[BROWSER LOG] {msg.text}", flush=True))
        page.on("pageerror", lambda err: print(f"[BROWSER ERR] {err}", flush=True))

        # 2. Visit frontend
        page.goto(f"http://127.0.0.1:{TEST_PORT}/", wait_until="domcontentloaded", timeout=15000)
        page.wait_for_timeout(1000)
        print("[E2E] Loaded ReStram page. Title:", page.title(), flush=True)

        # 3. Test Banner Click Responsiveness
        hero_box = page.locator("#net-hero")
        assert hero_box.count() > 0, "Hero banner not found"
        hero_box.click(position={"x": 500, "y": 200})
        page.wait_for_timeout(500)

        # Modal title should open
        title_modal = page.locator("#title-modal")
        assert not title_modal.evaluate("el => el.classList.contains('hidden')"), "Title modal should open on hero banner click"
        print("[E2E] PASS: Hero banner click opens title modal", flush=True)

        # 4. Test Detail Hero Backdrop Click to Play
        page.locator(".tm-hero-wrap").click(position={"x": 300, "y": 50})
        page.wait_for_timeout(500)
        player_modal = page.locator("#player-modal")
        assert not player_modal.evaluate("el => el.classList.contains('hidden')"), "Player modal should open on detail banner click"
        print("[E2E] PASS: Detail banner click triggers play", flush=True)

        # Close player
        page.locator("#pm-close").click()
        page.wait_for_timeout(300)

        # 5. Test My Hero Academia playback does NOT default to One Piece
        page.evaluate("""() => {
            App.openTitle("my-hero-academia-1395", "My Hero Academia", "", "TV", "13/13", {
                id: "my-hero-academia-1395",
                title: "My Hero Academia",
                anilist_id: 21459
            });
        }""")
        page.wait_for_timeout(200)

        # Click Putar Sekarang
        page.locator("#tm-btn-play-primary").click()
        page.wait_for_timeout(1000)

        # Check player meta & embed source
        meta_text = page.locator("#pm-meta").inner_text()
        print("[E2E] Player meta text:", meta_text)
        assert "[object Object]" not in meta_text, "Episode number must not be [object Object]"

        frame_src = page.evaluate("() => document.getElementById('pm-embed-frame') ? document.getElementById('pm-embed-frame').src : ''")
        print("[E2E] Player embed frame src:", frame_src)
        assert "one-piece" not in frame_src.lower(), "Must NOT stream One Piece for My Hero Academia"
        print("[E2E] PASS: Playback resolves correctly without One Piece contamination")

        # Close player and title modal
        page.evaluate("() => { if(window.closePlayer) window.closePlayer(); if(window.closeTitle) window.closeTitle(); }")
        page.wait_for_timeout(300)

        # 6. Test Schedule UI Bar & Category navigation
        eval_res = page.evaluate("""() => {
            if(window.setView) window.setView('terbaru');
            return {
                view: window.Tui ? window.Tui.view() : null,
                sBar: document.getElementById('schedule-days-bar') ? document.getElementById('schedule-days-bar').className : null,
                hasSetView: typeof window.setView
            };
        }""")
        print("[E2E EVAL]", eval_res, flush=True)
        page.wait_for_timeout(2000)
        res_html = page.evaluate("() => document.getElementById('results') ? document.getElementById('results').innerHTML.substring(0, 200) : ''")
        print("[E2E RESULTS HTML]", res_html.encode('ascii', 'ignore').decode(), flush=True)

        sched_bar = page.locator("#schedule-days-bar")
        assert not sched_bar.evaluate("el => el.classList.contains('hidden')"), "Schedule days bar must be visible in terbaru view"
        cards = page.locator("#results .trow, #results .poster-card")
        card_count = cards.count()
        print(f"[E2E] Schedule items rendered: {card_count}", flush=True)
        assert card_count > 0, "Schedule items must be rendered"
        print("[E2E] PASS: Realtime schedule UI renders correctly", flush=True)

        # 7. Test unhosted / 404 anime fallback (e.g. Manin Densha)
        page.evaluate("""() => {
            if(window.closeTitle) window.closeTitle();
            if(window.closePlayer) window.closePlayer();
            App.openTitle("manin-densha", "Manin Densha", "", "OVA", "3/3", {
                id: "manin-densha",
                title: "Manin Densha"
            });
        }""")
        page.wait_for_timeout(300)
        page.locator("#tm-btn-play-primary").click()
        page.wait_for_timeout(2500)

        # Ensure player is not failing on a dead video element
        player_active = page.evaluate("""() => {
            var frame = document.getElementById('pm-embed-frame');
            var status = document.getElementById('pm-status') ? document.getElementById('pm-status').textContent : '';
            return {
                frameVisible: frame && !frame.classList.contains('hidden') && frame.style.display !== 'none',
                frameSrc: frame ? frame.src : '',
                status: status
            };
        }""")
        print("[E2E] Manin Densha Player state:", player_active, flush=True)
        assert player_active["frameVisible"], "Embed frame must be visible for unhosted anime fallback"
        assert "vidlink.pro" in player_active["frameSrc"] or "vidsrc" in player_active["frameSrc"], "Must stream via VidLink/VidSrc fallback"
        print("[E2E] PASS: Unhosted anime fallback successfully activates VidLink embed", flush=True)

        browser.close()
        print("[E2E] ALL TESTS PASSED!")

if __name__ == "__main__":
    test_banner_and_schedule()
