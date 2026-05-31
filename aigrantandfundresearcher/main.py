"""
AIGrantAndFundResearcher entry point.
Starts the Flask server on localhost:5000 and opens the user's browser.
"""

import logging
import os
import sys
import threading
import time
import webbrowser
from pathlib import Path

# ---------------------------------------------------------------------------
# Logging — written to local app-data directory, never transmitted
# ---------------------------------------------------------------------------

def _configure_logging() -> None:
    from app.config import log_path

    log_file = log_path()
    log_file.parent.mkdir(parents=True, exist_ok=True)

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[
            logging.FileHandler(log_file, encoding="utf-8"),
            # Only show to stdout in non-packaged (dev) mode
            *([] if getattr(sys, "frozen", False) else [logging.StreamHandler()]),
        ],
    )
    # Suppress noisy third-party loggers
    logging.getLogger("werkzeug").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("googleapiclient.discovery").setLevel(logging.WARNING)


# ---------------------------------------------------------------------------
# Load bundled environment variables (build-time constants)
# ---------------------------------------------------------------------------

def _load_build_env() -> None:
    """
    In a packaged build, os.environ is already populated by the spec file.
    In dev mode, load from .env if present.
    """
    if not getattr(sys, "frozen", False):
        try:
            from dotenv import load_dotenv
            load_dotenv()
        except ImportError:
            pass


# ---------------------------------------------------------------------------
# Open browser after a brief delay so Flask is ready
# ---------------------------------------------------------------------------

def _open_browser(url: str, delay: float = 1.2) -> None:
    def _open():
        time.sleep(delay)
        webbrowser.open(url)
    t = threading.Thread(target=_open, daemon=True)
    t.start()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    _load_build_env()
    _configure_logging()

    logger = logging.getLogger(__name__)
    logger.info("AIGrantAndFundResearcher starting")

    # Import here so logging is configured first
    from app import create_app

    flask_app = create_app()

    host = "127.0.0.1"
    port = 5000
    url = f"http://{host}:{port}"

    _open_browser(url)

    logger.info("Serving on %s", url)
    flask_app.run(host=host, port=port, debug=False, use_reloader=False)


if __name__ == "__main__":
    main()
