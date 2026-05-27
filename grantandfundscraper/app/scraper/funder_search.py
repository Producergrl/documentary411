"""
Web search for mission-aligned funders using DuckDuckGo.
No API key required. Rate-limited to be a good citizen.
"""

import logging
import time
from dataclasses import dataclass, field

import requests
from bs4 import BeautifulSoup
from duckduckgo_search import DDGS

from app.scraper.contact_parser import parse_contact_from_html

logger = logging.getLogger(__name__)

_DELAY_BETWEEN_FETCHES = 2.0  # seconds
_MAX_PAGES_PER_RUN = 40        # raised to allow multiple terms
_FETCH_TIMEOUT = 10  # seconds
_MAX_RESULTS_PER_QUERY = 5
_MAX_TERMS = 6                 # cap so a runaway list can't hang the app

_QUERY_TEMPLATES = [
    '"{cause_area}" foundation grants contact',
    '"{cause_area}" documentary film fund 2026',
    '"{cause_area}" nonprofit grants "program officer" email',
    '"{cause_area}" family office philanthropy contact',
    '"{cause_area}" fiscal sponsor documentary',
]

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; GrantAndFundScraper/1.0; +https://documentary411.org)"
    )
}


@dataclass
class FunderResult:
    org_name: str = ""
    contact_person: str = ""
    title: str = ""
    email: str = ""
    website: str = ""
    mission: str = ""
    grant_range: str = ""
    deadline: str = ""


def parse_terms(cause_area: str) -> list[str]:
    """
    Split a comma-separated cause area string into individual search terms.
    E.g. "child safety, child protection, abuse prevention"
         -> ["child safety", "child protection", "abuse prevention"]
    """
    terms = [t.strip() for t in cause_area.split(",") if t.strip()]
    return terms[:_MAX_TERMS]


def search(cause_area: str) -> list[FunderResult]:
    """
    Run all search queries for every term in the (comma-separated) cause area.
    Returns a deduplicated list of FunderResult objects.
    """
    if not cause_area or not cause_area.strip():
        logger.warning("search() called with empty cause_area")
        return []

    terms = parse_terms(cause_area)
    logger.info("Search terms: %s", terms)

    urls_seen: set[str] = set()
    results: list[FunderResult] = []
    pages_fetched = 0

    for term in terms:
        for template in _QUERY_TEMPLATES:
            if pages_fetched >= _MAX_PAGES_PER_RUN:
                break

            query = template.format(cause_area=term)
            logger.info("DuckDuckGo query: %s", query)

            try:
                ddg_results = list(
                    DDGS().text(query, max_results=_MAX_RESULTS_PER_QUERY)
                )
            except Exception:
                logger.exception("DuckDuckGo search failed for query: %s", query)
                continue

            for item in ddg_results:
                if pages_fetched >= _MAX_PAGES_PER_RUN:
                    break

                url: str = item.get("href", "")
                if not url or url in urls_seen:
                    continue
                urls_seen.add(url)

                funder = _fetch_and_parse(url, item)
                if funder:
                    results.append(funder)
                pages_fetched += 1
                time.sleep(_DELAY_BETWEEN_FETCHES)

        if pages_fetched >= _MAX_PAGES_PER_RUN:
            break

    # Deduplicate by domain across all terms
    seen_domains: set[str] = set()
    unique: list[FunderResult] = []
    for r in results:
        domain = _domain(r.website or r.org_name)
        if domain and domain not in seen_domains:
            seen_domains.add(domain)
            unique.append(r)

    logger.info("search() returning %d unique results from %d terms", len(unique), len(terms))
    return unique


def _fetch_and_parse(url: str, ddg_item: dict) -> FunderResult | None:
    """Fetch a URL and extract funder details. Returns None on failure."""
    try:
        resp = requests.get(url, headers=_HEADERS, timeout=_FETCH_TIMEOUT)
        resp.raise_for_status()
        html = resp.text
    except Exception:
        logger.debug("Failed to fetch %s", url)
        # Fall back to DuckDuckGo snippet data only
        return _from_snippet(url, ddg_item)

    try:
        soup = BeautifulSoup(html, "lxml")
        parsed = parse_contact_from_html(soup, url)
        # Fill in any blanks from the DDG snippet
        if not parsed.org_name:
            parsed.org_name = ddg_item.get("title", "")
        if not parsed.mission:
            parsed.mission = ddg_item.get("body", "")
        if not parsed.website:
            parsed.website = url
        return parsed
    except Exception:
        logger.debug("Failed to parse %s", url)
        return _from_snippet(url, ddg_item)


def _from_snippet(url: str, item: dict) -> FunderResult | None:
    """Build a minimal FunderResult from a DuckDuckGo snippet."""
    title = (item.get("title") or "").strip()
    if not title:
        return None
    return FunderResult(
        org_name=title,
        mission=(item.get("body") or "").strip(),
        website=url,
    )


def _domain(url: str) -> str:
    """Extract bare domain from a URL for deduplication."""
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url if "://" in url else f"https://{url}")
        return parsed.netloc.lower().lstrip("www.")
    except Exception:
        return url.lower()
