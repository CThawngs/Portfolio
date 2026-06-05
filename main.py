"""
Portfolio AI Automation CMS — v2 (Dual-Database Edition)
=========================================================
Processes TWO Notion databases:
  1. Portfolio CMS  (NOTION_DATABASE_ID)
     Fields: Title (VN) [title], Title (EN) [rich_text],
             Description (VN) [rich_text], Description (EN) [rich_text]

  2. Profile Config (NOTION_PROFILE_DATABASE_ID)
     Fields: Name (VN) [title], Name (EN) [rich_text],
             Bio (VN) [rich_text],   Bio (EN) [rich_text]

Gatekeeper rule (ZERO-cost protection) applied to every field pair:
  • BOTH empty  → skip (nothing to translate)
  • BOTH filled → skip (already done; don't waste tokens)
  • VN filled / EN empty → translate VN → EN, write result immediately
  • EN filled / VN empty → translate EN → VN, write result immediately

Status workflow:
  • Only pages with Status == "Pending" are fetched.
  • After ALL field pairs of a page are processed, Status is set to "Published".
  • If a translation call fails, the page is NOT marked Published so it will
    be retried on the next run.

Dependencies: pip install requests python-dotenv
"""

from __future__ import annotations

import json
import logging
import os
import sys
import time
from dataclasses import dataclass, field
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
# Environment & config
# ---------------------------------------------------------------------------
load_dotenv()

NOTION_API_KEY: str = os.environ.get("NOTION_API_KEY", "")
OPENROUTER_API_KEY: str = os.environ.get("OPENROUTER_API_KEY", "")
PORTFOLIO_DB_ID: str = os.environ.get("NOTION_DATABASE_ID", "")
PROFILE_DB_ID: str = os.environ.get("NOTION_PROFILE_DATABASE_ID", "")

for var_name, var_value in [
    ("NOTION_API_KEY", NOTION_API_KEY),
    ("OPENROUTER_API_KEY", OPENROUTER_API_KEY),
    ("NOTION_DATABASE_ID", PORTFOLIO_DB_ID),
    ("NOTION_PROFILE_DATABASE_ID", PROFILE_DB_ID),
]:
    if not var_value:
        logger.error("%s is missing from .env — exiting.", var_name)
        sys.exit(1)

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")
try:
    with open(CONFIG_PATH, "r", encoding="utf-8") as fh:
        _cfg: dict = json.load(fh)
except FileNotFoundError:
    logger.error("config.json not found at %s — exiting.", CONFIG_PATH)
    sys.exit(1)
except json.JSONDecodeError as exc:
    logger.error("Failed to parse config.json: %s — exiting.", exc)
    sys.exit(1)

LLM_MODEL: str = _cfg.get("model", "")
LLM_TEMPERATURE: float = float(_cfg.get("temperature", 0.3))

if not LLM_MODEL:
    logger.error("'model' key is missing or empty in config.json — exiting.")
    sys.exit(1)

logger.info("LLM model: %s  (temperature=%.2f)", LLM_MODEL, LLM_TEMPERATURE)

# ---------------------------------------------------------------------------
# API constants
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
    "HTTP-Referer": "https://portfolio-cms.notion.so",
    "X-Title": "Portfolio CMS AI Automation",
}

# System prompt — see CONTEXT.md §5
SYSTEM_PROMPT = (
    "You are an expert bilingual translator (English and Vietnamese) specialising in "
    "IT, Software Engineering, and Tech Portfolios. Your task is to automatically detect "
    "the language of the provided text and translate it into the other language.\n\n"
    "CRITICAL RULES:\n"
    "1. Output ONLY the exact translated text. No introductions, explanations, "
    "quotation marks, or conversational fillers.\n"
    "2. Preserve common IT/Tech terminology (e.g., Test, Bug, Deploy, App, Web, "
    "Frontend, Backend) in English even when translating to Vietnamese, unless a "
    "universally accepted Vietnamese tech equivalent exists.\n"
    "3. Maintain a professional, concise tone suitable for a Software Engineer's portfolio."
)

MAX_RETRIES = 3
RETRY_BACKOFF_SECONDS = 5


# ---------------------------------------------------------------------------
# Field-pair descriptor
# ---------------------------------------------------------------------------
@dataclass
class FieldPair:
    """
    Describes one bilingual pair inside a Notion page.

    vn_key / en_key   — property names in Notion
    vn_type / en_type — "title" or "rich_text"
    label             — human-readable name for logs
    """

    label: str
    vn_key: str
    en_key: str
    vn_type: str = "rich_text"
    en_type: str = "rich_text"


# Database schemas
PORTFOLIO_FIELDS: list[FieldPair] = [
    FieldPair(
        label="Title",
        vn_key="Title (VN)",
        en_key="Title (EN)",
        vn_type="title",
        en_type="rich_text",
    ),
    FieldPair(
        label="Description",
        vn_key="Description (VN)",
        en_key="Description (EN)",
        vn_type="rich_text",
        en_type="rich_text",
    ),
]

PROFILE_FIELDS: list[FieldPair] = [
    FieldPair(
        label="Name",
        vn_key="Name (VN)",
        en_key="Name (EN)",
        vn_type="title",
        en_type="rich_text",
    ),
    FieldPair(
        label="Bio",
        vn_key="Bio (VN)",
        en_key="Bio (EN)",
        vn_type="rich_text",
        en_type="rich_text",
    ),
]

# Role fields are informational only (translator doesn't need to handle them).
# They are omitted intentionally.


# ---------------------------------------------------------------------------
# Helpers — extract text from Notion property blocks
# ---------------------------------------------------------------------------
def _extract(prop: dict, kind: str) -> str:
    """
    Extract plain text from a Notion property dict.

    kind must be "title" or "rich_text".
    Returns an empty string if the property is absent or empty.
    """
    blocks: list = prop.get(kind, [])
    return "".join(b.get("plain_text", "") for b in blocks).strip()


def extract_text(props: dict, key: str, kind: str) -> str:
    """Safe wrapper: returns '' if key not present."""
    return _extract(props.get(key, {}), kind)


# ---------------------------------------------------------------------------
# Helpers — build Notion property payloads
# ---------------------------------------------------------------------------
def rich_text_payload(text: str) -> dict:
    return {"rich_text": [{"type": "text", "text": {"content": text}}]}


def title_payload(text: str) -> dict:
    return {"title": [{"type": "text", "text": {"content": text}}]}


def make_payload(text: str, kind: str) -> dict:
    """Return the correct Notion property payload for the given field type."""
    if kind == "title":
        return title_payload(text)
    return rich_text_payload(text)


# ---------------------------------------------------------------------------
# Notion API — fetch pending pages
# ---------------------------------------------------------------------------
def fetch_pending_pages(database_id: str) -> list[dict]:
    """
    Query a Notion database for pages where Status == 'Pending'.
    Automatically follows pagination cursors.
    """
    url = f"{NOTION_BASE_URL}/databases/{database_id}/query"
    payload: dict = {
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
            resp = requests.post(url, headers=NOTION_HEADERS, json=payload, timeout=30)
            resp.raise_for_status()
        except requests.exceptions.HTTPError:
            logger.error(
                "Notion query error (HTTP %s) for DB %s: %s",
                resp.status_code, database_id, resp.text,
            )
            raise RuntimeError(f"Failed to fetch pages from Notion DB {database_id}.")
        except requests.exceptions.RequestException as exc:
            logger.error("Network error querying Notion DB %s: %s", database_id, exc)
            raise RuntimeError(f"Network error for Notion DB {database_id}.") from exc

        data = resp.json()
        pages.extend(data.get("results", []))
        has_more = data.get("has_more", False)
        start_cursor = data.get("next_cursor")

    logger.info("  → %d pending page(s) found in DB %s.", len(pages), database_id)
    return pages


# ---------------------------------------------------------------------------
# OpenRouter API — translate with retries
# ---------------------------------------------------------------------------
def translate_text(text: str) -> str:
    """
    Send `text` to OpenRouter for EN ↔ VN translation.
    Retries up to MAX_RETRIES times on rate-limit (429) or transient errors.
    Returns the translated string.
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
            resp = requests.post(
                url, headers=OPENROUTER_HEADERS, json=payload, timeout=90
            )

            if resp.status_code == 429:
                wait = RETRY_BACKOFF_SECONDS * attempt
                logger.warning(
                    "OpenRouter rate limit (attempt %d/%d). Waiting %ds…",
                    attempt, MAX_RETRIES, wait,
                )
                time.sleep(wait)
                continue

            resp.raise_for_status()

        except requests.exceptions.HTTPError:
            logger.error(
                "OpenRouter HTTP error (attempt %d/%d, status %s): %s",
                attempt, MAX_RETRIES, resp.status_code, resp.text,
            )
            if attempt == MAX_RETRIES:
                raise RuntimeError("OpenRouter API request failed after retries.")
            time.sleep(RETRY_BACKOFF_SECONDS * attempt)
            continue

        except requests.exceptions.RequestException as exc:
            logger.error(
                "OpenRouter network error (attempt %d/%d): %s",
                attempt, MAX_RETRIES, exc,
            )
            if attempt == MAX_RETRIES:
                raise RuntimeError("Network error contacting OpenRouter API.") from exc
            time.sleep(RETRY_BACKOFF_SECONDS * attempt)
            continue

        try:
            translated = resp.json()["choices"][0]["message"]["content"].strip()
        except (KeyError, IndexError) as exc:
            raise RuntimeError(
                f"Unexpected OpenRouter response: {resp.text[:300]}"
            ) from exc

        return translated

    raise RuntimeError("Exhausted all retries for OpenRouter.")


# ---------------------------------------------------------------------------
# Notion API — update a page
# ---------------------------------------------------------------------------
def update_notion_page(page_id: str, properties: dict) -> None:
    """PATCH a Notion page with the given properties. Raises RuntimeError on failure."""
    url = f"{NOTION_BASE_URL}/pages/{page_id}"
    try:
        resp = requests.patch(
            url, headers=NOTION_HEADERS, json={"properties": properties}, timeout=30
        )
        resp.raise_for_status()
    except requests.exceptions.HTTPError:
        logger.error(
            "Failed to update page %s (HTTP %s): %s",
            page_id, resp.status_code, resp.text,
        )
        raise RuntimeError(f"Notion update failed for page {page_id}.")
    except requests.exceptions.RequestException as exc:
        logger.error("Network error updating page %s: %s", page_id, exc)
        raise RuntimeError(f"Network error updating Notion page {page_id}.") from exc


# ---------------------------------------------------------------------------
# Core: process a single page
# ---------------------------------------------------------------------------
def process_page(page: dict, field_pairs: list[FieldPair]) -> bool:
    """
    Apply the Gatekeeper logic to each field pair, write translations to Notion
    immediately as they are produced, and finally flip Status → Published.

    Returns True if all translations succeeded, False otherwise.
    """
    page_id: str = page["id"]
    props: dict = page.get("properties", {})

    any_failure = False

    for fp in field_pairs:
        vn_text = extract_text(props, fp.vn_key, fp.vn_type)
        en_text = extract_text(props, fp.en_key, fp.en_type)

        # ── Gatekeeper ──────────────────────────────────────────────────────
        if vn_text and en_text:
            logger.info(
                "    [%s] Both fields filled → SKIP (saving tokens)", fp.label
            )
            continue

        if not vn_text and not en_text:
            logger.info(
                "    [%s] Both fields empty → SKIP (nothing to translate)", fp.label
            )
            continue

        # ── Exactly one field is populated: translate ────────────────────────
        if vn_text and not en_text:
            direction = "VN → EN"
            source_text = vn_text
            target_key = fp.en_key
            target_type = fp.en_type
        else:
            direction = "EN → VN"
            source_text = en_text
            target_key = fp.vn_key
            target_type = fp.vn_type

        logger.info(
            "    [%s] Translating (%s) — source: '%.60s…'",
            fp.label, direction, source_text,
        )

        try:
            translated = translate_text(source_text)
        except RuntimeError as exc:
            logger.error(
                "    [%s] Translation FAILED for page %s: %s", fp.label, page_id, exc
            )
            any_failure = True
            continue  # Try remaining field pairs; do NOT mark Published

        # Write translation immediately — fail fast if Notion is unreachable
        try:
            update_notion_page(page_id, {target_key: make_payload(translated, target_type)})
            logger.info(
                "    [%s] Written to Notion — result: '%.60s…'",
                fp.label, translated,
            )
        except RuntimeError as exc:
            logger.error(
                "    [%s] Notion write FAILED for page %s: %s", fp.label, page_id, exc
            )
            any_failure = True
            continue

    # ── Mark as Published only when everything succeeded ─────────────────────
    if any_failure:
        logger.warning(
            "  ⚠  Page %s had errors — keeping Status = Pending for retry.", page_id
        )
        return False

    try:
        update_notion_page(page_id, {"Status": {"status": {"name": "Published"}}})
        logger.info("  ✅ Page %s → Published.", page_id)
    except RuntimeError as exc:
        logger.error("  Failed to mark page %s as Published: %s", page_id, exc)
        return False

    return True


# ---------------------------------------------------------------------------
# Database runner
# ---------------------------------------------------------------------------
def run_database(db_label: str, database_id: str, field_pairs: list[FieldPair]) -> tuple[int, int]:
    """
    Fetch all pending pages from *database_id*, process each one,
    and return (success_count, fail_count).
    """
    logger.info("=" * 60)
    logger.info("Database: %s  (ID: %s)", db_label, database_id)
    logger.info("=" * 60)

    try:
        pages = fetch_pending_pages(database_id)
    except RuntimeError as exc:
        logger.error("Skipping database %s — fetch error: %s", db_label, exc)
        return 0, 0

    if not pages:
        logger.info("No pending pages in %s — nothing to do.", db_label)
        return 0, 0

    success = 0
    fail = 0

    for i, page in enumerate(pages, start=1):
        page_id = page.get("id", "unknown")
        logger.info(
            "Processing page %d/%d  [%s]  ID: %s",
            i, len(pages), db_label, page_id,
        )
        ok = process_page(page, field_pairs)
        if ok:
            success += 1
        else:
            fail += 1

    logger.info(
        "Finished %s — %d succeeded, %d failed.\n", db_label, success, fail
    )
    return success, fail


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
def main() -> None:
    logger.info("Portfolio AI Automation CMS — Dual-Database Edition")
    logger.info("Model: %s", LLM_MODEL)

    total_success = 0
    total_fail = 0

    for db_label, database_id, field_pairs in [
        ("Portfolio CMS", PORTFOLIO_DB_ID, PORTFOLIO_FIELDS),
        ("Profile Config", PROFILE_DB_ID, PROFILE_FIELDS),
    ]:
        s, f = run_database(db_label, database_id, field_pairs)
        total_success += s
        total_fail += f

    logger.info("=" * 60)
    logger.info(
        "ALL DONE — %d page(s) published, %d page(s) kept pending (errors).",
        total_success, total_fail,
    )


if __name__ == "__main__":
    main()
