"""
Gumroad license validation.
Called exactly once on first activation. Result cached in config.json.
The only outbound network call to Kerry's infrastructure.
"""

import logging
import os

import requests

logger = logging.getLogger(__name__)

_GUMROAD_VERIFY_URL = "https://api.gumroad.com/v2/licenses/verify"
_PRODUCT_ID = os.environ.get("GUMROAD_PRODUCT_ID", "")  # bundled at build time
_TIMEOUT = 10  # seconds


def validate(license_key: str) -> tuple[bool, str]:
    """
    Validate a Gumroad license key.
    Returns (success: bool, message: str).
    On success the caller should set license_activated=True in config and
    never call this function again for this installation.
    """
    key = license_key.strip()
    if not key:
        return False, "Please enter your license key."

    product_id = _PRODUCT_ID
    if not product_id:
        # Fallback for dev builds where env var is not set
        logger.warning("GUMROAD_PRODUCT_ID not configured — skipping validation in dev mode")
        return True, "Dev mode: license validation skipped."

    try:
        resp = requests.post(
            _GUMROAD_VERIFY_URL,
            data={"product_id": product_id, "license_key": key},
            timeout=_TIMEOUT,
        )
        resp.raise_for_status()
        payload = resp.json()
    except requests.exceptions.Timeout:
        return False, "License server timed out. Check your internet connection and try again."
    except requests.exceptions.ConnectionError:
        return False, "Could not reach the license server. Check your internet connection."
    except Exception:
        logger.exception("Unexpected error during license validation")
        return False, "An unexpected error occurred. Please try again."

    if payload.get("success"):
        return True, "License activated."
    else:
        msg = payload.get("message", "Invalid license key.")
        return False, msg
