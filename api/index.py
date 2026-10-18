import sys, os

# Setup temporary directory for SQLite & cache on Vercel read-only filesystem
os.environ.setdefault("RESTRAM_DATABASE_PATH", "/tmp/restram.db")
os.environ.setdefault("RESTRAM_CACHE_DIR", "/tmp/cache")
os.environ.setdefault("TATAP_DATABASE_PATH", "/tmp/restram.db")
os.environ.setdefault("TATAP_CACHE_DIR", "/tmp/cache")

# Add backend directory to sys.path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(root_dir, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

try:
    from main import app
except Exception as e:
    import traceback
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    app = FastAPI(title="ReStram Serverless Fallback")

    @app.get("/api/health")
    @app.get("/api/ping")
    def ping():
        return JSONResponse({
            "success": False,
            "status": "error_loading_backend",
            "error": str(e),
            "traceback": traceback.format_exc()
        })
