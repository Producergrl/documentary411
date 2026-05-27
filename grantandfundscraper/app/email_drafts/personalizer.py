"""
Claude API email personalizer.
Uses the user's own Anthropic API key — no key is bundled in the app.
Model: claude-haiku-4-5-20251001 (fast, low-cost per email)
"""

import logging

import anthropic

logger = logging.getLogger(__name__)

_MODEL = "claude-haiku-4-5-20251001"
_MAX_TOKENS = 512

_SYSTEM_PROMPT = (
    "You write personalized outreach emails for documentary filmmakers seeking funding. "
    "You are warm, professional, and specific. Never use ellipses or hyphens unless "
    "grammatically necessary. Use commas instead of hyphens where possible. "
    "Keep emails under 200 words."
)


def build_email(
    full_name: str,
    film_title: str,
    logline: str,
    org_name: str,
    mission: str,
    contact_person: str,
    anthropic_api_key: str,
) -> dict[str, str]:
    """
    Generate a personalized draft email for one funder.
    Returns {"subject": ..., "body": ...}.
    Raises ValueError if the API key is missing or invalid.
    """
    if not anthropic_api_key or not anthropic_api_key.strip():
        raise ValueError("Anthropic API key is not configured.")

    salutation = (
        f"Dear {contact_person},"
        if contact_person and contact_person.strip()
        else f"Dear Team at {org_name},"
    )

    user_prompt = (
        f"Write a funding outreach email on behalf of {full_name}, "
        f"writer, producer, and director of '{film_title}' ({logline}). "
        f"The contact is {org_name}, whose mission is: {mission}. "
        f"Write one paragraph (2 to 3 sentences) that speaks directly to how this film "
        f"aligns with their specific mission. Then add a standard closing paragraph "
        f"inviting them to learn more and visit OpenSecretTheFilm.com. "
        f"Sign off as {full_name}."
    )

    try:
        client = anthropic.Anthropic(api_key=anthropic_api_key.strip())
        message = client.messages.create(
            model=_MODEL,
            max_tokens=_MAX_TOKENS,
            system=_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
        )
        ai_body = message.content[0].text.strip()
    except anthropic.AuthenticationError:
        raise ValueError(
            "Your Anthropic API key is invalid. "
            "Please check it at console.anthropic.com."
        )
    except anthropic.RateLimitError:
        raise ValueError(
            "Your Anthropic account has reached its rate limit. "
            "Please try again in a few minutes."
        )
    except anthropic.BadRequestError as e:
        raise ValueError(f"Anthropic API error: {e}")
    except Exception as e:
        logger.exception("Unexpected error calling Claude API")
        raise ValueError(f"Could not generate email: {e}")

    subject = f"{film_title} — A Documentary Aligned With Your Mission"

    body = "\n\n".join([
        salutation,
        ai_body,
        "--\n"
        f"{full_name}\n"
        "OpenSecretTheFilm.com",
    ])

    return {"subject": subject, "body": body}


def test_api_key(api_key: str) -> tuple[bool, str]:
    """Quick validation of an Anthropic API key. Returns (ok, message)."""
    if not api_key or not api_key.strip():
        return False, "Please enter your Anthropic API key."
    try:
        client = anthropic.Anthropic(api_key=api_key.strip())
        client.messages.create(
            model=_MODEL,
            max_tokens=5,
            messages=[{"role": "user", "content": "Hi"}],
        )
        return True, "API key is valid."
    except anthropic.AuthenticationError:
        return False, "Invalid API key. Please check it at console.anthropic.com."
    except anthropic.RateLimitError:
        return True, "API key is valid (rate limited, but will work)."
    except Exception as e:
        return False, f"Could not verify key: {e}"
