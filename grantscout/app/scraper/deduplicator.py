"""
Deduplication: filter out any funder already in the user's spreadsheet.
Matching is done by normalised domain name and org name to handle minor
variations in how the same org appears across runs.
"""

import logging
import re
from pathlib import Path
from urllib.parse import urlparse

import openpyxl

logger = logging.getLogger(__name__)


def filter_new(
    candidates: list,  # list[FunderResult]
    spreadsheet_path: str | Path,
) -> list:
    """
    Return only those candidates whose org / website do not already
    appear in the spreadsheet at spreadsheet_path.
    """
    existing = _load_existing(spreadsheet_path)
    if not existing:
        return candidates

    new = []
    for funder in candidates:
        key_domain = _domain_key(funder.website)
        key_name = _name_key(funder.org_name)

        already_present = any(
            (_domain_key(e["website"]) and _domain_key(e["website"]) == key_domain)
            or (_name_key(e["org_name"]) and _name_key(e["org_name"]) == key_name)
            for e in existing
        )

        if not already_present:
            new.append(funder)
        else:
            logger.debug("Dedup skip: %s", funder.org_name)

    logger.info(
        "Dedup: %d candidates, %d already known, %d new",
        len(candidates),
        len(candidates) - len(new),
        len(new),
    )
    return new


def _load_existing(spreadsheet_path: str | Path) -> list[dict]:
    """Load org name + website from every row of the spreadsheet."""
    path = Path(spreadsheet_path)
    if not path.exists():
        return []

    try:
        wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
        ws = wb.active
        rows = list(ws.iter_rows(min_row=2, values_only=True))  # skip header
        wb.close()
    except Exception:
        logger.exception("Could not read spreadsheet for dedup: %s", path)
        return []

    # Column indices (0-based): 0=org name, 6=website
    results = []
    for row in rows:
        org = str(row[0] or "").replace("★ ", "").strip()
        website = str(row[6] or "").strip() if len(row) > 6 else ""
        if org or website:
            results.append({"org_name": org, "website": website})

    return results


def _domain_key(url: str) -> str:
    """Normalised domain for comparison, or empty string."""
    if not url:
        return ""
    try:
        raw = url if "://" in url else f"https://{url}"
        netloc = urlparse(raw).netloc.lower()
        return re.sub(r"^www\.", "", netloc)
    except Exception:
        return ""


def _name_key(name: str) -> str:
    """Normalised org name: lowercase, alphanumeric only."""
    if not name:
        return ""
    return re.sub(r"[^a-z0-9]", "", name.lower())
