"""
Insert email drafts into Gmail via the Gmail API.
OAuth 2.0 with InstalledAppFlow — tokens stored in local config only.
"""

import base64
import json
import logging
import os
from datetime import datetime, timezone
from email.mime.text import MIMEText
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

import app.config as config

logger = logging.getLogger(__name__)

_SCOPES = ["https://www.googleapis.com/auth/gmail.compose"]


def _client_secrets_path() -> Path:
    """
    Resolve the bundled client_secrets.json.
    Works both in development and in a PyInstaller bundle.
    """
    if getattr(__import__("sys"), "frozen", False):
        import sys
        base = Path(sys._MEIPASS)  # type: ignore[attr-defined]
    else:
        base = Path(__file__).parent.parent.parent
    return base / "client_secrets.json"


def _credentials_from_config(cfg: dict) -> Credentials | None:
    """Reconstruct Google credentials from stored config tokens."""
    if not cfg.get("gmail_access_token"):
        return None

    client_secrets = _load_client_secrets()
    if not client_secrets:
        return None

    web = client_secrets.get("installed") or client_secrets.get("web") or {}

    creds = Credentials(
        token=cfg["gmail_access_token"],
        refresh_token=cfg.get("gmail_refresh_token") or None,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=web.get("client_id", ""),
        client_secret=web.get("client_secret", ""),
        scopes=_SCOPES,
    )
    return creds


def _load_client_secrets() -> dict | None:
    path = _client_secrets_path()
    if not path.exists():
        logger.error("client_secrets.json not found at %s", path)
        return None
    try:
        with path.open("r") as fh:
            return json.load(fh)
    except Exception:
        logger.exception("Failed to read client_secrets.json")
        return None


def run_oauth_flow() -> tuple[bool, str]:
    """
    Run the Gmail OAuth consent flow in the user's browser.
    Saves tokens to config on success. Returns (ok, message).
    """
    secrets_path = _client_secrets_path()
    if not secrets_path.exists():
        return False, (
            "Google OAuth credentials are missing. "
            "Please contact support at documentary411.org."
        )

    try:
        flow = InstalledAppFlow.from_client_secrets_file(
            str(secrets_path), scopes=_SCOPES
        )
        creds = flow.run_local_server(port=0, open_browser=True)
    except Exception as e:
        logger.exception("Gmail OAuth flow failed")
        return False, f"Gmail connection failed: {e}"

    expiry_str = (
        creds.expiry.isoformat() if creds.expiry else ""
    )
    config.update(
        gmail_access_token=creds.token or "",
        gmail_refresh_token=creds.refresh_token or "",
        gmail_token_expiry=expiry_str,
        email_provider="gmail",
    )
    return True, "Gmail connected successfully."


def _get_service():
    """Return an authorised Gmail service, refreshing the token if needed."""
    cfg = config.load()
    creds = _credentials_from_config(cfg)

    if creds is None:
        raise RuntimeError(
            "Gmail is not connected. Please reconnect in Settings."
        )

    if not creds.valid:
        if creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
                config.update(
                    gmail_access_token=creds.token or "",
                    gmail_token_expiry=(
                        creds.expiry.isoformat() if creds.expiry else ""
                    ),
                )
            except Exception:
                logger.exception("Failed to refresh Gmail token")
                raise RuntimeError(
                    "Gmail session has expired. Please reconnect in Settings."
                )
        else:
            raise RuntimeError(
                "Gmail session has expired. Please reconnect in Settings."
            )

    return build("gmail", "v1", credentials=creds)


def create_draft(to: str, subject: str, body: str) -> bool:
    """
    Insert one draft into the authenticated user's Gmail drafts.
    Returns True on success. Raises RuntimeError on auth failure.
    """
    service = _get_service()

    mime = MIMEText(body, "plain", "utf-8")
    mime["to"] = to
    mime["subject"] = subject

    raw = base64.urlsafe_b64encode(mime.as_bytes()).decode("utf-8")

    try:
        service.users().drafts().create(
            userId="me", body={"message": {"raw": raw}}
        ).execute()
        return True
    except HttpError as e:
        logger.error("Gmail API error creating draft: %s", e)
        raise RuntimeError(f"Gmail API error: {e.reason}")
