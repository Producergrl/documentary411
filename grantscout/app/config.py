"""
Local config read/write. All user data stays on this machine.
File location:
  Mac:     ~/Library/Application Support/GrantScout/config.json
  Windows: %APPDATA%/GrantScout/config.json
"""

import json
import logging
import os
import platform
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

_DEFAULTS: dict[str, Any] = {
    "license_key": "",
    "license_activated": False,
    "full_name": "",
    "email": "",
    "film_title": "",
    "logline": "",
    "cause_area": "",
    "email_provider": "",
    "anthropic_api_key": "",
    "gmail_access_token": "",
    "gmail_refresh_token": "",
    "gmail_token_expiry": "",
    "outlook_access_token": "",
    "outlook_refresh_token": "",
    "outlook_token_expiry": "",
    "spreadsheet_path": "",
    "last_run_at": "",
}


def _config_dir() -> Path:
    system = platform.system()
    if system == "Darwin":
        base = Path.home() / "Library" / "Application Support"
    elif system == "Windows":
        base = Path(os.environ.get("APPDATA", Path.home()))
    else:
        base = Path.home() / ".config"
    return base / "GrantScout"


def _config_path() -> Path:
    return _config_dir() / "config.json"


def _log_path() -> Path:
    return _config_dir() / "grantscout.log"


def log_path() -> Path:
    """Public accessor so main.py can configure logging before anything else."""
    return _log_path()


def load() -> dict[str, Any]:
    path = _config_path()
    if not path.exists():
        return dict(_DEFAULTS)
    try:
        with path.open("r", encoding="utf-8") as fh:
            data = json.load(fh)
        # Fill in any keys added in newer versions
        for key, default in _DEFAULTS.items():
            data.setdefault(key, default)
        return data
    except Exception:
        logger.exception("Failed to read config — returning defaults")
        return dict(_DEFAULTS)


def save(cfg: dict[str, Any]) -> None:
    directory = _config_dir()
    directory.mkdir(parents=True, exist_ok=True)
    path = _config_path()
    # Write to a temp file then rename for atomic write
    tmp = path.with_suffix(".tmp")
    try:
        with tmp.open("w", encoding="utf-8") as fh:
            json.dump(cfg, fh, indent=2)
        tmp.replace(path)
    except Exception:
        logger.exception("Failed to save config")
        if tmp.exists():
            tmp.unlink(missing_ok=True)
        raise


def update(**kwargs: Any) -> dict[str, Any]:
    """Merge kwargs into config and persist. Returns the updated config."""
    cfg = load()
    cfg.update(kwargs)
    save(cfg)
    return cfg


def spreadsheet_default_path(film_title: str) -> Path:
    """Return the default spreadsheet save path for a given film title."""
    safe_title = "".join(
        c if c.isalnum() or c in (" ", "_", "-") else "_" for c in film_title
    ).strip()
    folder = Path.home() / "Documents" / "GrantScout"
    folder.mkdir(parents=True, exist_ok=True)
    return folder / f"{safe_title}_Funders.xlsx"
