"""
Portfolio AI Automation CMS
============================
Reads Notion pages with Status == "Pending", translates their
Title / Description fields (EN <-> VN) via OpenRouter LLM, writes
the translated text back, and flips Status to "Published".

Dependencies: requests, python-dotenv
Install: pip install requests python-dotenv
"""

import json
import logging
import os
import sys
import time
from typing import Optional

import requests
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Load environment variables from .env
# ---------------------------------------------------------------------------
load_dotenv()

NOTION_API_KEY: str = os.environ.get("NOTION_API_KEY", "")
OPENROUTER_API_KEY: str = os.environ.get("OPENROUTER_API_KEY", "")

if not NOTION_API_KEY:
    logger.error("NOTION_API_KEY is missing from .env. Exiting.")
    sys.exit(1)

if not OPENROUTER_API_KEY:
    logger.error("OPENROUTER_API_KEY is missing from .env. Exiting.")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Load model configuration from config.json
# ---------------------------------------------------------------------------
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")

try:
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        config: dict = json.load(f)
except FileNotFoundError:
    logger.error("config.json not found at %s. Exiting.", CONFIG_PATH)
    sys.exit(1)
except json.JSONDecodeError as exc:
    logger.error("Failed to parse config.json: %s. Exiting.", exc)
    sys.exit(1)

LLM_MODEL: str = config.get("model", "")
LLM_TEMPERATURE: float = float(config.get("temperature", 0.3))

if not LLM_MODEL:
    logger.error("'model' key is missing or empty in config.json. Exiting.")
    sys.exit(1)

logger.info("Using LLM model: %s (temperature=%.2f)", LLM_MODEL, LLM_TEMPERATURE)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
NOTION_VERSION = "2022-06-28"
NOTION_BASE_URL = "https://api.notion.com/v1"
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

NOTION_HEADERS = {
    "Authorization": f"Bearer {NOTION_API_KEY}",
    "Content-Type": "application/json",
    "Notion-Version": NOTION_VERSION,
}

OPENROUTER_HEADERS = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "Content-Type": "application/json",
    # Routing headers — identify this app in OpenRouter usage logs.
    # Replace the Referer with your real deployed portfolio URL when available.
    "HTTP-Referer": "https://app.notion.com/p/373ff6736afa80348c3bdf90581104a4?v=373ff6736afa80ba9788000c2589f363&source=copy_link",
    "X-Title": "Portfolio",
}

# Exact system prompt as specified in CONTEXT.md §5
SYSTEM_PROMPT = (
    "You are an expert bilingual translator (English and Vietnamese) specializing in "
    "IT, Software Engineering, and Tech Portfolios. Your task is to automatically detect "
    "the language of the provided text and translate it into the other language.\n\n"
    "CRITICAL RULES:\n"
    "1. You must ONLY output the exact translated text. Do not include any introductions, "
    "explanations, quotation marks, or conversational fillers.\n"
    "2. Preserve common IT/Tech terminology (e.g., Test, Bug, Deploy, App, Web, Frontend, "
    "Backend) in English even when translating to Vietnamese, unless there is a universally "
    "accepted Vietnamese tech equivalent.\n"
    "3. Maintain a professional, concise tone suitable for a Software Engineer's portfolio."
)

# Rate-limit retry settings
MAX_RETRIES = 3
RETRY_BACKOFF_SECONDS = 5


# ---------------------------------------------------------------------------
# Helper: extract plain text from a Notion rich-text array
# ---------------------------------------------------------------------------
def extract_rich_text(rich_text_list: list) -> str:
    """Return concatenated plain_text from a Notion rich_text property."""
    return "".join(block.get("plain_text", "") for block in rich_text_list).strip()


# ---------------------------------------------------------------------------
# Helper: extract plain text from a Notion title property
# ---------------------------------------------------------------------------
def extract_title(title_list: list) -> str:
    """Return concatenated plain_text from a Notion title property."""
    return "".join(block.get("plain_text", "") for block in title_list).strip()


# ---------------------------------------------------------------------------
# Notion API: fetch all Pending pages from the database
# ---------------------------------------------------------------------------
def fetch_pending_pages(database_id: str) -> list[dict]:
    """
    Query the Notion database for all pages where Status == 'Pending'.
    Handles pagination automatically.
    """
    url = f"{NOTION_BASE_URL}/databases/{database_id}/query"
    payload = {
        "filter": {
            "property": "Status",
            "status": {"equals": "Pending"},
        }
    }

    pages: list[dict] = []
    has_more = True
    start_cursor: Optional[str] = None

    while has_more:
        if start_cursor:
            payload["start_cursor"] = start_cursor

        try:
            response = requests.post(url, headers=NOTION_HEADERS, json=payload, timeout=30)
            response.raise_for_status()
        except requests.exceptions.HTTPError as exc:
            logger.error("Notion query failed (HTTP %s): %s", response.status_code, response.text)
            raise RuntimeError("Failed to fetch pages from Notion.") from exc
        except requests.exceptions.RequestException as exc:
            logger.error("Notion request error: %s", exc)
            raise RuntimeError("Network error while contacting Notion API.") from exc

        data = response.json()
        pages.extend(data.get("results", []))
        has_more = data.get("has_more", False)
        start_cursor = data.get("next_cursor")

    logger.info("Fetched %d pending page(s) from Notion.", len(pages))
    return pages


# ---------------------------------------------------------------------------
# OpenRouter API: translate text via LLM
# ---------------------------------------------------------------------------
def translate_text(text: str) -> str:
    """
    Send `text` to OpenRouter for EN <-> VN translation.
    Returns only the translated string.
    Retries up to MAX_RETRIES times on rate-limit (429) errors.
    """
    url = f"{OPENROUTER_BASE_URL}/chat/completions"
    payload = {
        "model": LLM_MODEL,
        "temperature": LLM_TEMPERATURE,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": text},
        ],
    }

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = requests.post(
                url, headers=OPENROUTER_HEADERS, json=payload, timeout=60
            )

            if response.status_code == 429:
                wait = RETRY_BACKOFF_SECONDS * attempt
                logger.warning(
                    "OpenRouter rate limit hit (attempt %d/%d). Waiting %ds...",
                    attempt, MAX_RETRIES, wait,
                )
                time.sleep(wait)
                continue

            response.raise_for_status()

        except requests.exceptions.HTTPError as exc:
            logger.error(
                "OpenRouter HTTP error (attempt %d/%d, status %s): %s",
                attempt, MAX_RETRIES, response.status_code, response.text,
            )
            if attempt == MAX_RETRIES:
                raise RuntimeError("OpenRouter API request failed after retries.") from exc
            time.sleep(RETRY_BACKOFF_SECONDS * attempt)
            continue
        except requests.exceptions.RequestException as exc:
            logger.error("OpenRouter network error (attempt %d/%d): %s", attempt, MAX_RETRIES, exc)
            if attempt == MAX_RETRIES:
                raise RuntimeError("Network error while contacting OpenRouter API.") from exc
            time.sleep(RETRY_BACKOFF_SECONDS * attempt)
            continue

        # Parse the response
        data = response.json()
        try:
            translated = data["choices"][0]["message"]["content"].strip()
        except (KeyError, IndexError) as exc:
            raise RuntimeError(
                f"Unexpected OpenRouter response format: {data}"
            ) from exc

        return translated

    raise RuntimeError("Exhausted all retries for OpenRouter API.")


# ---------------------------------------------------------------------------
# Notion API: update a page's properties
# ---------------------------------------------------------------------------
def update_notion_page(page_id: str, properties: dict) -> None:
    """
    PATCH a Notion page with the given properties payload.
    Raises RuntimeError if the API call fails.
    """
    url = f"{NOTION_BASE_URL}/pages/{page_id}"
    try:
        response = requests.patch(
            url, headers=NOTION_HEADERS, json={"properties": properties}, timeout=30
        )
        response.raise_for_status()
    except requests.exceptions.HTTPError as exc:
        logger.error(
            "Failed to update Notion page %s (HTTP %s): %s",
            page_id, response.status_code, response.text,
        )
        raise RuntimeError(f"Notion update failed for page {page_id}.") from exc
    except requests.exceptions.RequestException as exc:
        logger.error("Network error updating Notion page %s: %s", page_id, exc)
        raise RuntimeError(f"Network error for Notion page {page_id}.") from exc


# ---------------------------------------------------------------------------
# Build Notion rich-text / title property payloads
# ---------------------------------------------------------------------------
def build_rich_text_payload(text: str) -> list[dict]:
    return [{"type": "text", "text": {"content": text}}]


def build_title_payload(text: str) -> list[dict]:
    return [{"type": "text", "text": {"content": text}}]


# ---------------------------------------------------------------------------
# Core processing logic for a single page
# ---------------------------------------------------------------------------
def process_page(page: dict) -> None:
    """
    Extract text from the page, translate missing fields, and update Notion.
    """
    page_id: str = page["id"]
    props: dict = page.get("properties", {})

    # ── Extract current field values ────────────────────────────────────────
    title_vn: str = extract_title(props.get("Title (VN)", {}).get("title", []))
    title_en: str = extract_rich_text(props.get("Title (EN)", {}).get("rich_text", []))
    desc_vn: str = extract_rich_text(props.get("Description (VN)", {}).get("rich_text", []))
    desc_en: str = extract_rich_text(props.get("Description (EN)", {}).get("rich_text", []))

    logger.info(
        "Processing page %s | Title VN: '%s' | Title EN: '%s'",
        page_id, title_vn[:40] or "<empty>", title_en[:40] or "<empty>",
    )

    updated_properties: dict = {}

    # ── Translate Title ──────────────────────────────────────────────────────
    if title_vn and not title_en:
        logger.info("  Translating Title (VN → EN)...")
        translated_title = translate_text(title_vn)
        updated_properties["Title (EN)"] = {
            "rich_text": build_rich_text_payload(translated_title)
        }
        logger.info("  Title EN: '%s'", translated_title[:80])

    elif title_en and not title_vn:
        logger.info("  Translating Title (EN → VN)...")
        translated_title = translate_text(title_en)
        updated_properties["Title (VN)"] = {
            "title": build_title_payload(translated_title)
        }
        logger.info("  Title VN: '%s'", translated_title[:80])

    elif not title_vn and not title_en:
        logger.warning("  Page %s has no title content in either language — skipping title.", page_id)

    # ── Translate Description ────────────────────────────────────────────────
    if desc_vn and not desc_en:
        logger.info("  Translating Description (VN → EN)...")
        translated_desc = translate_text(desc_vn)
        updated_properties["Description (EN)"] = {
            "rich_text": build_rich_text_payload(translated_desc)
        }
        logger.info("  Description EN: '%s'", translated_desc[:80])

    elif desc_en and not desc_vn:
        logger.info("  Translating Description (EN → VN)...")
        translated_desc = translate_text(desc_en)
        updated_properties["Description (VN)"] = {
            "rich_text": build_rich_text_payload(translated_desc)
        }
        logger.info("  Description VN: '%s'", translated_desc[:80])

    elif not desc_vn and not desc_en:
        logger.warning(
            "  Page %s has no description content in either language — skipping description.", page_id
        )

    # ── Mark as Published ────────────────────────────────────────────────────
    updated_properties["Status"] = {"status": {"name": "Published"}}

    if updated_properties:
        update_notion_page(page_id, updated_properties)
        logger.info("  ✅ Page %s updated and marked as Published.", page_id)
    else:
        logger.warning("  ⚠️  No properties to update for page %s.", page_id)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
def main() -> None:
    # The Notion Database ID can optionally be stored in .env as NOTION_DATABASE_ID,
    # or passed as the first CLI argument: python main.py <database_id>
    database_id: str = os.environ.get("NOTION_DATABASE_ID", "")

    if not database_id and len(sys.argv) > 1:
        database_id = sys.argv[1].strip()

    if not database_id:
        logger.error(
            "No Notion Database ID provided.\n"
            "Set NOTION_DATABASE_ID in .env, or pass it as a CLI argument:\n"
            "  python main.py <database_id>"
        )
        sys.exit(1)

    logger.info("Starting Portfolio AI Automation CMS...")
    logger.info("Target Notion Database ID: %s", database_id)

    # 1. Fetch all pending pages
    try:
        pending_pages = fetch_pending_pages(database_id)
    except RuntimeError as exc:
        logger.error("Aborting: %s", exc)
        sys.exit(1)

    if not pending_pages:
        logger.info("No pending pages found. Nothing to do.")
        return

    # 2. Process each page
    success_count = 0
    fail_count = 0

    for page in pending_pages:
        try:
            process_page(page)
            success_count += 1
        except RuntimeError as exc:
            logger.error("Failed to process page %s: %s", page.get("id"), exc)
            fail_count += 1

    logger.info(
        "Done. %d page(s) processed successfully, %d failed.",
        success_count, fail_count,
    )


if __name__ == "__main__":
    main()
