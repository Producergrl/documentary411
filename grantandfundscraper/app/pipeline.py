"""
The core GrantAndFundScraper pipeline. Called when the user clicks "Run GrantAndFundScraper".
Runs search → dedup → spreadsheet → personalize emails → deposit drafts.
Thread-safe status updates via a module-level status dict.
"""

import logging
import threading
from datetime import datetime, timezone
from pathlib import Path

import app.config as config
from app.scraper import funder_search, deduplicator
from app.spreadsheet import builder as spreadsheet_builder
from app.email_drafts import personalizer
from app.email_drafts import gmail_drafter, outlook_drafter

logger = logging.getLogger(__name__)

_status_lock = threading.Lock()
_status: dict = {"running": False, "message": "", "done": False, "error": ""}


def get_status() -> dict:
    with _status_lock:
        return dict(_status)


def _set_status(message: str = "", done: bool = False, error: str = "") -> None:
    with _status_lock:
        _status["message"] = message
        _status["done"] = done
        _status["error"] = error
        if done or error:
            _status["running"] = False


def run_pipeline() -> None:
    """
    Entry point called in a background thread from routes.py.
    Updates module-level status dict throughout.
    Results (new contacts + draft count) are stored in config on completion.
    """
    with _status_lock:
        if _status["running"]:
            return  # Prevent double-run
        _status.update({"running": True, "message": "Starting...", "done": False, "error": ""})

    try:
        cfg = config.load()
        _run(cfg)
    except Exception as e:
        logger.exception("Pipeline failed")
        _set_status(error=f"An unexpected error occurred. Please try again. ({type(e).__name__})")


def _run(cfg: dict) -> None:
    # 1. Validate required config
    cause_area = cfg.get("cause_area", "").strip()
    if not cause_area:
        _set_status(error="Cause area is not set. Please complete Setup in Settings.")
        return

    anthropic_key = cfg.get("anthropic_api_key", "").strip()
    if not anthropic_key:
        _set_status(error="Anthropic API key is not configured. Please check Settings.")
        return

    email_provider = cfg.get("email_provider", "").lower()
    if email_provider not in ("gmail", "outlook"):
        _set_status(error="No email account connected. Please connect Gmail or Outlook in Settings.")
        return

    spreadsheet_path = cfg.get("spreadsheet_path") or str(
        config.spreadsheet_default_path(cfg.get("film_title", "MyFilm"))
    )

    # 2. Search
    _set_status("Searching for funders — this takes about a minute...")
    try:
        candidates = funder_search.search(cause_area)
    except Exception as e:
        logger.exception("Search failed")
        _set_status(error=f"Search failed: {e}")
        return

    if not candidates:
        _set_status(
            done=True,
            message=(
                "No contacts found this run. Your spreadsheet is up to date. "
                "Try running again tomorrow or broaden your cause area in Settings."
            ),
        )
        _save_run_summary(cfg, spreadsheet_path, [], 0)
        return

    # 3. Dedup
    _set_status("Checking for duplicates...")
    new_funders = deduplicator.filter_new(candidates, spreadsheet_path)

    if not new_funders:
        _set_status(
            done=True,
            message=(
                "No new contacts found this run. Your spreadsheet is already up to date. "
                "Try running again tomorrow or broaden your cause area in Settings."
            ),
        )
        _save_run_summary(cfg, spreadsheet_path, [], 0)
        return

    # 4. Spreadsheet
    _set_status(f"Adding {len(new_funders)} new contact(s) to your spreadsheet...")
    try:
        spreadsheet_builder.append_and_save(new_funders, spreadsheet_path)
    except Exception as e:
        logger.exception("Spreadsheet write failed")
        _set_status(error=f"Could not update your spreadsheet: {e}")
        return

    # 5. Personalize + deposit drafts
    drafts_created = 0
    for i, funder in enumerate(new_funders, start=1):
        _set_status(
            f"Writing email {i} of {len(new_funders)}: {funder.org_name}..."
        )

        # Generate email via Claude
        try:
            email_data = personalizer.build_email(
                full_name=cfg.get("full_name", ""),
                film_title=cfg.get("film_title", ""),
                logline=cfg.get("logline", ""),
                org_name=funder.org_name,
                mission=funder.mission or funder.org_name,
                contact_person=funder.contact_person,
                anthropic_api_key=anthropic_key,
            )
        except ValueError as e:
            _set_status(error=str(e))
            return
        except Exception as e:
            logger.exception("Email personalization failed for %s", funder.org_name)
            continue  # Skip this contact, keep going

        # Deposit draft
        to_address = funder.email or ""
        subject = email_data["subject"]
        body = email_data["body"]

        try:
            if email_provider == "gmail":
                gmail_drafter.create_draft(to_address, subject, body)
            else:
                outlook_drafter.create_draft(to_address, subject, body)
            drafts_created += 1
        except RuntimeError as e:
            # Auth failure — surface it immediately
            _set_status(error=str(e))
            return
        except Exception as e:
            logger.exception("Draft deposit failed for %s", funder.org_name)
            # Don't abort the whole run for one failed draft

    _save_run_summary(cfg, spreadsheet_path, new_funders, drafts_created)

    contact_list = [
        {"org_name": f.org_name, "website": f.website} for f in new_funders
    ]
    _set_status(
        done=True,
        message="",
    )
    # Store results for the results page
    with _status_lock:
        _status["results"] = {
            "new_contacts": len(new_funders),
            "contact_list": contact_list,
            "drafts_created": drafts_created,
            "spreadsheet_path": str(spreadsheet_path),
        }


def _save_run_summary(
    cfg: dict, spreadsheet_path: str, new_funders: list, drafts_created: int
) -> None:
    config.update(
        spreadsheet_path=str(spreadsheet_path),
        last_run_at=datetime.now(timezone.utc).isoformat(),
    )


def start_pipeline_thread() -> bool:
    """Start pipeline in a background thread. Returns False if already running."""
    with _status_lock:
        if _status["running"]:
            return False
    t = threading.Thread(target=run_pipeline, daemon=True)
    t.start()
    return True
