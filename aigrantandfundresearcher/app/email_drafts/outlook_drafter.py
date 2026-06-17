"""
Insert email drafts into Outlook via Microsoft Graph API.
OAuth 2.0 public-client flow — tokens stored in local config only.
"""

import logging
import os
import secrets
import threading
import time
import urllib.parse
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

import requests

import app.config as config

logger = logging.getLogger(__name__)

_CLIENT_ID = os.environ.get("MICROSOFT_CLIENT_ID", "")
_TENANT_ID = os.environ.get("MICROSOFT_TENANT_ID", "common")
_REDIRECT_URI = "http://localhost:5001/callback"
_SCOPES = "Mail.ReadWrite offline_access"
_TOKEN_URL = f"https://login.microsoftonline.com/{_TENANT_ID}/oauth2/v2.0/token"
_AUTH_URL = f"https://login.microsoftonline.com/{_TENANT_ID}/oauth2/v2.0/authorize"
_GRAPH_DRAFTS_URL = "https://graph.microsoft.com/v1.0/me/messages"
_TIMEOUT = 15


def run_oauth_flow() -> tuple[bool, str]:
    """
    Run the Outlook OAuth consent flow. Opens the browser; listens on
    localhost:5001 for the callback. Returns (ok, message).
    """
    client_id = _CLIENT_ID
    if not client_id:
        return False, (
            "Microsoft OAuth credentials are missing. "
            "Please contact support at documentary411.com."
        )

    state = secrets.token_urlsafe(16)
    auth_params = {
        "client_id": client_id,
        "response_type": "code",
        "redirect_uri": _REDIRECT_URI,
        "scope": _SCOPES,
        "state": state,
        "response_mode": "query",
    }
    auth_url = _AUTH_URL + "?" + urllib.parse.urlencode(auth_params)

    code_holder: dict = {}
    error_holder: dict = {}

    class _Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            parsed = urllib.parse.urlparse(self.path)
            params = urllib.parse.parse_qs(parsed.query)
            if "code" in params:
                code_holder["code"] = params["code"][0]
                self.send_response(200)
                self.send_header("Content-Type", "text/html")
                self.end_headers()
                self.wfile.write(
                    b"<h2>AIGrantAndFundResearcher: Outlook connected! You can close this tab.</h2>"
                )
            else:
                error_holder["error"] = params.get("error_description", ["Unknown error"])[0]
                self.send_response(400)
                self.end_headers()

        def log_message(self, *args):
            pass  # suppress access log noise

    server = HTTPServer(("localhost", 5001), _Handler)
    server.timeout = 120  # 2 minutes for user to complete consent

    webbrowser.open(auth_url)

    # Accept exactly one request then shut down
    server.handle_request()
    server.server_close()

    if error_holder:
        return False, f"Outlook connection failed: {error_holder.get('error', 'Unknown error')}"

    code = code_holder.get("code")
    if not code:
        return False, "No authorization code received from Microsoft."

    # Exchange code for tokens
    try:
        resp = requests.post(
            _TOKEN_URL,
            data={
                "client_id": client_id,
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": _REDIRECT_URI,
                "scope": _SCOPES,
            },
            timeout=_TIMEOUT,
        )
        resp.raise_for_status()
        tokens = resp.json()
    except Exception as e:
        return False, f"Failed to exchange authorization code: {e}"

    expiry = str(int(time.time()) + int(tokens.get("expires_in", 3600)))
    config.update(
        outlook_access_token=tokens.get("access_token", ""),
        outlook_refresh_token=tokens.get("refresh_token", ""),
        outlook_token_expiry=expiry,
        email_provider="outlook",
    )
    return True, "Outlook connected successfully."


def _get_access_token() -> str:
    """Return a valid access token, refreshing if necessary."""
    cfg = config.load()
    access_token = cfg.get("outlook_access_token", "")
    refresh_token = cfg.get("outlook_refresh_token", "")
    expiry = int(cfg.get("outlook_token_expiry") or 0)

    if not access_token:
        raise RuntimeError("Outlook is not connected. Please reconnect in Settings.")

    if time.time() > expiry - 60 and refresh_token:
        try:
            resp = requests.post(
                _TOKEN_URL,
                data={
                    "client_id": _CLIENT_ID,
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token,
                    "scope": _SCOPES,
                },
                timeout=_TIMEOUT,
            )
            resp.raise_for_status()
            tokens = resp.json()
            new_expiry = str(int(time.time()) + int(tokens.get("expires_in", 3600)))
            config.update(
                outlook_access_token=tokens.get("access_token", access_token),
                outlook_refresh_token=tokens.get("refresh_token", refresh_token),
                outlook_token_expiry=new_expiry,
            )
            return tokens.get("access_token", access_token)
        except Exception:
            logger.exception("Failed to refresh Outlook token")
            raise RuntimeError(
                "Outlook session has expired. Please reconnect in Settings."
            )

    return access_token


def create_draft(to: str, subject: str, body: str) -> bool:
    """
    Insert one draft into the authenticated user's Outlook drafts.
    Returns True on success. Raises RuntimeError on auth failure.
    """
    token = _get_access_token()

    payload = {
        "subject": subject,
        "body": {"contentType": "Text", "content": body},
        "toRecipients": [{"emailAddress": {"address": to}}],
        "isDraft": True,
    }

    try:
        resp = requests.post(
            _GRAPH_DRAFTS_URL,
            json=payload,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            timeout=_TIMEOUT,
        )
        if resp.status_code == 401:
            raise RuntimeError(
                "Outlook session has expired. Please reconnect in Settings."
            )
        resp.raise_for_status()
        return True
    except RuntimeError:
        raise
    except Exception as e:
        logger.error("Graph API error: %s", e)
        raise RuntimeError(f"Outlook API error: {e}")
