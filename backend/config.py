import os
from dotenv import load_dotenv

load_dotenv()

APP_PORT = int(os.getenv("APP_PORT", "8767"))
APP_HOST = os.getenv("APP_HOST", "127.0.0.1")

# --- satu-satunya sumber katalog (single source) ---
HI_BASE = os.getenv("HI_BASE", "https://hianime.at")
OTAKU_BASE = os.getenv("OTAKU_BASE", "https://ww2.otakudesu.biz")
HI_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
XOR_KEY = b"otaku-embed-v1"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IS_VERCEL = bool(os.getenv("VERCEL"))
default_db = "/tmp/restram.db" if IS_VERCEL else os.path.join(BASE_DIR, "anime.db")
default_cache = "/tmp/cache" if IS_VERCEL else os.path.join(BASE_DIR, "cache")
DATABASE_PATH = os.getenv("RESTRAM_DATABASE_PATH", os.getenv("TATAP_DATABASE_PATH", default_db))
CACHE_DIR = os.getenv("RESTRAM_CACHE_DIR", os.getenv("TATAP_CACHE_DIR", default_cache))
try:
    if os.path.dirname(DATABASE_PATH):
        os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
    if CACHE_DIR:
        os.makedirs(CACHE_DIR, exist_ok=True)
except Exception:
    pass

