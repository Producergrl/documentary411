"""
BeautifulSoup-based extraction of contact details from a funder's webpage.
"""

import logging
import re
from urllib.parse import urlparse

from bs4 import BeautifulSoup, Tag

logger = logging.getLogger(__name__)

_EMAIL_RE = re.compile(
    r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
)

_CONTACT_TITLES = [
    "program officer",
    "executive director",
    "grants director",
    "grants manager",
    "program director",
    "program manager",
    "development director",
    "director of programs",
    "director of grants",
    "contact",
]

_GRANT_RANGE_RE = re.compile(
    r"\$[\d,]+(?:\s*[–\-]\s*\$[\d,]+)?(?:\s*(?:thousand|million|k|m))?"
    r"|\bup to \$[\d,]+",
    re.IGNORECASE,
)

_DEADLINE_RE = re.compile(
    r"(?:deadline|due|submit by|applications? (?:due|close))[\s:]*"
    r"([A-Za-z]+ \d{1,2},?\s*\d{4}|\d{1,2}/\d{1,2}/\d{2,4})",
    re.IGNORECASE,
)


def parse_contact_from_html(soup: BeautifulSoup, url: str) -> "FunderResult":
    # Import here to avoid circular dependency
    from app.scraper.funder_search import FunderResult

    result = FunderResult()
    result.website = _clean_url(url)

    # Org name: prefer og:site_name > title tag > h1
    og_site = soup.find("meta", {"property": "og:site_name"})
    if og_site and isinstance(og_site, Tag):
        result.org_name = (og_site.get("content") or "").strip()

    if not result.org_name:
        title_tag = soup.find("title")
        if title_tag:
            raw = title_tag.get_text(strip=True)
            # Strip " | Home", " - About Us" style suffixes
            result.org_name = re.split(r"\s*[\|\-—]\s*", raw)[0].strip()

    if not result.org_name:
        h1 = soup.find("h1")
        if h1:
            result.org_name = h1.get_text(strip=True)

    # Mission: og:description > meta description > first substantial paragraph
    og_desc = soup.find("meta", {"property": "og:description"})
    if og_desc and isinstance(og_desc, Tag):
        result.mission = (og_desc.get("content") or "").strip()

    if not result.mission:
        meta_desc = soup.find("meta", {"name": "description"})
        if meta_desc and isinstance(meta_desc, Tag):
            result.mission = (meta_desc.get("content") or "").strip()

    if not result.mission:
        for p in soup.find_all("p"):
            text = p.get_text(strip=True)
            if len(text) > 80:
                result.mission = text[:400]
                break

    # Email: regex over full page text
    page_text = soup.get_text(separator=" ")
    emails = _EMAIL_RE.findall(page_text)
    # Filter out common non-contact emails
    filtered = [
        e for e in emails
        if not any(skip in e.lower() for skip in [
            "example", "noreply", "no-reply", "privacy", "webmaster",
            "support@", "info@sentry", "hello@sentry",
        ])
    ]
    if filtered:
        result.email = filtered[0]

    # Contact person + title: look near contact-title keywords
    contact_person, title = _extract_contact_person(soup)
    result.contact_person = contact_person
    result.title = title

    # Grant range
    grant_match = _GRANT_RANGE_RE.search(page_text)
    if grant_match:
        result.grant_range = grant_match.group(0).strip()

    # Deadline
    deadline_match = _DEADLINE_RE.search(page_text)
    if deadline_match:
        result.deadline = deadline_match.group(1).strip()

    return result


def _extract_contact_person(soup: BeautifulSoup) -> tuple[str, str]:
    """
    Look for a person name adjacent to a known contact title keyword.
    Returns (person_name, title_string).
    """
    page_text = soup.get_text(separator="\n")
    lines = [l.strip() for l in page_text.splitlines() if l.strip()]

    for i, line in enumerate(lines):
        line_lower = line.lower()
        for title_kw in _CONTACT_TITLES:
            if title_kw in line_lower:
                # The person name is often on the line just before the title
                if i > 0:
                    candidate = lines[i - 1]
                    if _looks_like_name(candidate):
                        return candidate, line
                # Or the title and name may be on the same line: "Jane Smith, Program Officer"
                parts = re.split(r",\s*", line)
                if len(parts) >= 2 and _looks_like_name(parts[0]):
                    return parts[0].strip(), ", ".join(parts[1:]).strip()
                break

    return "", ""


def _looks_like_name(text: str) -> bool:
    """Heuristic: 2–4 words, each capitalized, no digits, reasonable length."""
    words = text.split()
    if not (2 <= len(words) <= 4):
        return False
    if any(char.isdigit() for char in text):
        return False
    if len(text) > 60:
        return False
    return all(w[0].isupper() for w in words if w)


def _clean_url(url: str) -> str:
    """Strip query params and fragments from a URL."""
    try:
        parsed = urlparse(url)
        return parsed._replace(query="", fragment="").geturl()
    except Exception:
        return url
