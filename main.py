"""
Portfolio AI Automation CMS — v5 (Real-Time Gemini Flash & Intelligent Sanitizer)
================================================================================
Processes TWO Notion databases:
  1. Portfolio CMS  (NOTION_DATABASE_ID)
     Fields: Title (VN) [title], Title (EN) [rich_text],
             Description (VN) [rich_text], Description (EN) [rich_text]

  2. Profile Config (NOTION_PROFILE_DATABASE_ID)
     Fields: Name (VN) [title], Name (EN) [rich_text],
             Role (VN) [rich_text], Role (EN) [rich_text],
             Bio  (VN) [rich_text], Bio  (EN) [rich_text]

Execution Priority:
  • If GEMINI_API_KEY is available:
      Tier 1: Google Gemini Flash Direct (Real-Time Auto-Tracked latest model)
      Tier 2: OpenRouter Primary (openrouter/free)
      Tier 3: OpenRouter Dynamic Backup Free Models
  • If only OPENROUTER_API_KEY is available:
      Tier 1: OpenRouter Primary
      Tier 2: OpenRouter Dynamic Backup Free Models

Intelligent Output Sanitizer:
  • Automatically detects and cleans any AI preamble or safety meta headers
    (e.g., 'User Safety: safe', 'Here is the translation:').
  • Validates that the output is an actual translation, rejecting meta-labels.

Dependencies: pip install requests python-dotenv
"""

from __future__ import annotations

import json
import logging
import os
import re
import sys
import time
from dataclasses import dataclass
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
GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "") or os.environ.get("GOOGLE_API_KEY", "")
PORTFOLIO_DB_ID: str = os.environ.get("NOTION_DATABASE_ID", "")
PROFILE_DB_ID: str = os.environ.get("NOTION_PROFILE_DATABASE_ID", "")

for var_name, var_value in [
    ("NOTION_API_KEY", NOTION_API_KEY),
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

LLM_MODEL: str = _cfg.get("model", "openrouter/free")
LLM_TEMPERATURE: float = float(_cfg.get("temperature", 0.3))

if GEMINI_API_KEY:
    logger.info("🤖 Primary Translation Engine: Google Gemini Flash Direct (Real-Time Tracking)")
    logger.info("🔄 Secondary Fallback: OpenRouter (%s)", LLM_MODEL)
else:
    logger.info("🤖 Primary Translation Engine: OpenRouter (%s)", LLM_MODEL)

# ---------------------------------------------------------------------------
# API constants
# ---------------------------------------------------------------------------
NOTION_VERSION = "2022-06-28"
NOTION_BASE_URL = "https://api.notion.com/v1"
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

NOTION_HEADERS = {
    "Authorization": f"Bearer {NOTION_API_KEY}",
    "Content-Type": "application/json",
    "Notion-Version": NOTION_VERSION,
}

OPENROUTER_HEADERS = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "Content-Type": "application/json",
    "HTTP-Referer": "https://nguyen-chi-thang-portfolio.vercel.app/",
    "X-Title": "Portfolio",
}

VIETNAMESE_DIACRITICS_RE = re.compile(
    r"[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệđìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]",
    re.IGNORECASE,
)

# ---------------------------------------------------------------------------
# Real-Time Dynamic Model Tracking Engine
# ---------------------------------------------------------------------------
_CACHED_LATEST_GEMINI_MODELS: Optional[list[str]] = None
_CACHED_LATEST_OPENROUTER_MODELS: Optional[list[str]] = None

def get_realtime_gemini_flash_models() -> list[str]:
    global _CACHED_LATEST_GEMINI_MODELS
    default_candidates = [
        "gemini-flash-latest",
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash",
    ]

    if not GEMINI_API_KEY:
        return default_candidates

    if _CACHED_LATEST_GEMINI_MODELS:
        return _CACHED_LATEST_GEMINI_MODELS

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models?key={GEMINI_API_KEY}"
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            models = data.get("models", [])
            discovered = []
            for m in models:
                name = m.get("name", "").replace("models/", "")
                methods = m.get("supportedGenerationMethods", [])
                if "generateContent" in methods and "flash" in name.lower():
                    if not any(x in name.lower() for x in ["embedding", "tts", "imagen", "audio"]):
                        discovered.append(name)

            if discovered:
                def version_sort_key(m_name: str):
                    if "latest" in m_name:
                        return (99.0, m_name)
                    numbers = re.findall(r"(\d+(?:\.\d+)?)", m_name)
                    if numbers:
                        try:
                            return (float(numbers[0]), m_name)
                        except ValueError:
                            pass
                    return (0.0, m_name)

                discovered.sort(key=version_sort_key, reverse=True)
                final_list = []
                for m in discovered + default_candidates:
                    if m not in final_list:
                        final_list.append(m)

                _CACHED_LATEST_GEMINI_MODELS = final_list
                logger.info("🔍 [Real-Time Google Tracker] Discovered latest Gemini Flash models: %s", final_list[:3])
                return _CACHED_LATEST_GEMINI_MODELS
    except Exception as exc:
        logger.warning("Could not query Google model list in real-time (%s). Using defaults.", exc)

    return default_candidates

def get_realtime_openrouter_backup_models() -> list[str]:
    global _CACHED_LATEST_OPENROUTER_MODELS
    default_openrouter_backups = [
        "google/gemini-2.0-flash:free",
        "google/gemini-2.0-flash-lite:free",
        "meta-llama/llama-3.3-70b-instruct:free",
        "meta-llama/llama-3.1-8b-instruct:free",
        "deepseek/deepseek-chat:free",
    ]

    if _CACHED_LATEST_OPENROUTER_MODELS:
        return _CACHED_LATEST_OPENROUTER_MODELS

    try:
        url = f"{OPENROUTER_BASE_URL}/models"
        resp = requests.get(url, headers=OPENROUTER_HEADERS, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            models_list = data.get("data", [])
            discovered_free_gemini = []
            for m in models_list:
                m_id = m.get("id", "")
                pricing = m.get("pricing", {})
                is_free = (
                    pricing.get("prompt") == "0"
                    and pricing.get("completion") == "0"
                ) or ":free" in m_id

                if is_free and "gemini" in m_id.lower() and "flash" in m_id.lower():
                    discovered_free_gemini.append(m_id)

            if discovered_free_gemini:
                discovered_free_gemini.sort(reverse=True)
                final_openrouter = []
                for m in discovered_free_gemini + default_openrouter_backups:
                    if m not in final_openrouter:
                        final_openrouter.append(m)
                _CACHED_LATEST_OPENROUTER_MODELS = final_openrouter
                return _CACHED_LATEST_OPENROUTER_MODELS
    except Exception as exc:
        logger.debug("OpenRouter dynamic model discovery skipped (%s).", exc)

    return default_openrouter_backups

# ---------------------------------------------------------------------------
# Output Sanitizer & Validator
# ---------------------------------------------------------------------------
def clean_and_validate_translation(raw_text: str, source_text: str) -> str:
    """
    Strips AI meta-comments, safety headers (e.g. 'User Safety: safe'),
    preambles, and validates that output is actual translated content.
    """
    if not raw_text:
        raise ValueError("Empty response received from AI")

    cleaned = raw_text.strip()
    
    # Strip safety evaluation headers
    cleaned = re.sub(r"^(User\s+Safety|Safety\s+Assessment|Safety|Rating|Content\s+Safety)\s*:\s*\w+\s*\n*", "", cleaned, flags=re.IGNORECASE)
    # Strip preambles
    cleaned = re.sub(r"^(Here(?:'s| is) the (?:translation|translated text)[^:\n]*:\s*)", "", cleaned, flags=re.IGNORECASE)
    # Strip markdown code blocks / quotes
    cleaned = cleaned.strip().strip("`").strip('"').strip("'").strip()

    # Reject if output is purely a safety label
    if cleaned.lower() in ["safe", "unsafe", "user safety: safe", "none", "n/a", "ok"] and len(source_text.strip()) > 8:
        raise ValueError(f"AI returned meta safety tag '{cleaned}' instead of translation")

    if not cleaned:
        raise ValueError("Translation is empty after sanitization")

    return cleaned

# ---------------------------------------------------------------------------
# System prompt factory
# ---------------------------------------------------------------------------
def build_system_prompt(target_lang: str) -> str:
    return (
        f"You are a professional localized translator specialising in "
        f"IT, Software Engineering, and Tech Portfolios.\n"
        f"You are translating text into {target_lang}.\n\n"
        f"STRICT RULES — follow every rule without exception:\n"
        f"RULE 1: DO NOT translate industry-specific keywords, technical terms, "
        f"certifications, or proper nouns (e.g., Data Analytics, TOEIC, Coding, "
        f"Gemini Arena, Frontend, Backend, Deploy, API, App, Web, Bug, Test, Fullstack, Developer). "
        f"Keep them EXACTLY as they appear in the source text.\n"
        f"RULE 2: If the input text is already written in {target_lang}, return it "
        f"EXACTLY as-is. Do NOT translate it back into the other language.\n"
        f"RULE 3: Output ONLY the final translated string. "
        f"Do NOT include any safety labels, explanations, intros, quotation marks, or notes.\n"
        f"RULE 4: Any URL or hyperlink found in the source text (starting with "
        f"http://, https://, or www.) MUST be copied into the output EXACTLY as-is, "
        f"character for character. Do NOT translate, shorten, paraphrase, or alter "
        f"any URL in any way."
    )

# ---------------------------------------------------------------------------
# Field-pair descriptor
# ---------------------------------------------------------------------------
@dataclass
class FieldPair:
    label: str
    vn_key: str
    en_key: str
    vn_type: str = "rich_text"
    en_type: str = "rich_text"

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
        label="Role",
        vn_key="Role (VN)",
        en_key="Role (EN)",
        vn_type="rich_text",
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

# ---------------------------------------------------------------------------
# Helpers — extract text from Notion property blocks
# ---------------------------------------------------------------------------
def _extract(prop: dict, kind: str) -> str:
    blocks: list = prop.get(kind, [])
    return "".join(b.get("plain_text", "") for b in blocks).strip()

def extract_text(props: dict, key: str, kind: str) -> str:
    return _extract(props.get(key, {}), kind)

# ---------------------------------------------------------------------------
# Helpers — build Notion property payloads
# ---------------------------------------------------------------------------
def rich_text_payload(text: str) -> dict:
    return {"rich_text": [{"type": "text", "text": {"content": text}}]}

def title_payload(text: str) -> dict:
    return {"title": [{"type": "text", "text": {"content": text}}]}

def make_payload(text: str, kind: str) -> dict:
    if kind == "title":
        return title_payload(text)
    return rich_text_payload(text)

# ---------------------------------------------------------------------------
# Notion API — fetch database pages
# ---------------------------------------------------------------------------
def fetch_database_pages(database_id: str, is_profile: bool = False) -> list[dict]:
    url = f"{NOTION_BASE_URL}/databases/{database_id}/query"
    payload: dict = {}

    if not is_profile:
        payload = {
            "filter": {
                "property": "Status",
                "status": {"does_not_equal": "Archived"},
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
            if resp.status_code == 400 and "filter" in payload:
                logger.warning("Status filter rejected on DB %s, retrying without filter...", database_id)
                payload.pop("filter", None)
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

    logger.info("  → %d page(s) retrieved from DB %s.", len(pages), database_id)
    return pages

# ---------------------------------------------------------------------------
# AI Engines — Calling APIs
# ---------------------------------------------------------------------------
def _call_gemini_direct(text: str, target_lang: str) -> str:
    if not GEMINI_API_KEY:
        raise ValueError("No GEMINI_API_KEY available")

    candidate_models = get_realtime_gemini_flash_models()
    system_instruction = build_system_prompt(target_lang)

    for model_name in candidate_models:
        url = f"{GEMINI_API_BASE_URL}/{model_name}:generateContent?key={GEMINI_API_KEY}"
        payload = {
            "system_instruction": {
                "parts": [{"text": system_instruction}]
            },
            "contents": [
                {
                    "parts": [{"text": f"Translate this to {target_lang}:\n{text}"}]
                }
            ],
            "generationConfig": {
                "temperature": LLM_TEMPERATURE,
            }
        }
        try:
            resp = requests.post(url, json=payload, timeout=60)
            if resp.status_code == 404:
                continue
            resp.raise_for_status()
            data = resp.json()
            raw_output = data["candidates"][0]["content"]["parts"][0]["text"]
            cleaned = clean_and_validate_translation(raw_output, text)
            logger.info("    [Success] Translated via Google Gemini Direct (%s)", model_name)
            return cleaned
        except Exception as exc:
            logger.warning("    Google Gemini (%s) error: %s", model_name, exc)
            continue

    raise RuntimeError("All Real-Time Google Gemini Flash models failed.")

def _call_openrouter(text: str, target_lang: str, model: str) -> str:
    url = f"{OPENROUTER_BASE_URL}/chat/completions"
    payload = {
        "model": model,
        "temperature": LLM_TEMPERATURE,
        "messages": [
            {"role": "system", "content": build_system_prompt(target_lang)},
            {"role": "user", "content": f"Translate this to {target_lang}:\n{text}"},
        ],
    }

    resp = requests.post(url, headers=OPENROUTER_HEADERS, json=payload, timeout=60)
    resp.raise_for_status()
    raw_output = resp.json()["choices"][0]["message"]["content"]
    cleaned = clean_and_validate_translation(raw_output, text)
    return cleaned

def translate_text(text: str, target_lang: str) -> str:
    """
    Translates text with prioritization:
      1. Google Gemini Flash Direct (if GEMINI_API_KEY present)
      2. OpenRouter Primary (openrouter/free)
      3. OpenRouter Free Backup Models
    """
    if target_lang.lower() == "english":
        has_diacritics = bool(VIETNAMESE_DIACRITICS_RE.search(text))
        if not has_diacritics and len(text) < 50:
            logger.info(
                "    [Guardrail] Text has no Vietnamese diacritics and is short (%d chars). Bypassing API call.",
                len(text),
            )
            return text

    # --- Option A: If GEMINI_API_KEY is available, use Google Gemini Direct as Primary ---
    if GEMINI_API_KEY:
        try:
            translated = _call_gemini_direct(text, target_lang)
            return translated
        except Exception as exc:
            logger.warning("    Google Gemini Direct failed (%s). Falling back to OpenRouter...", exc)

    # --- Option B: OpenRouter Primary ---
    if OPENROUTER_API_KEY:
        try:
            translated = _call_openrouter(text, target_lang, LLM_MODEL)
            return translated
        except Exception as exc:
            logger.warning("    OpenRouter primary model '%s' failed: %s", LLM_MODEL, exc)

        # --- Option C: OpenRouter Backup Models ---
        backup_models = get_realtime_openrouter_backup_models()
        for backup_model in backup_models:
            if backup_model == LLM_MODEL:
                continue
            try:
                logger.info("    -> Trying OpenRouter backup: %s", backup_model)
                translated = _call_openrouter(text, target_lang, backup_model)
                logger.info("    [Success] Translated via OpenRouter backup: %s", backup_model)
                return translated
            except Exception as exc:
                logger.warning("    OpenRouter backup '%s' failed: %s", backup_model, exc)
                time.sleep(1)

    raise RuntimeError("All translation engines failed.")

# ---------------------------------------------------------------------------
# Notion API — update a page
# ---------------------------------------------------------------------------
def update_notion_page(page_id: str, properties: dict) -> None:
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
    page_id: str = page["id"]
    props: dict = page.get("properties", {})

    any_failure = False
    any_translated = False

    for fp in field_pairs:
        vn_text = extract_text(props, fp.vn_key, fp.vn_type)
        en_text = extract_text(props, fp.en_key, fp.en_type)

        # If existing text in Notion was accidentally polluted with 'User Safety: safe', clean it up
        if vn_text.lower() in ["user safety: safe", "safe"] and not en_text:
            vn_text = ""
        if en_text.lower() in ["user safety: safe", "safe"] and not vn_text:
            en_text = ""

        # ── Gatekeeper ──────────────────────────────────────────────────────
        if vn_text and en_text:
            # If one of the fields was polluted with 'User Safety: safe', overwrite it
            if vn_text.lower() == "user safety: safe":
                vn_text = ""
            elif en_text.lower() == "user safety: safe":
                en_text = ""
            else:
                continue

        if not vn_text and not en_text:
            continue

        # ── Exactly one field is populated: translate ────────────────────────
        if vn_text and not en_text:
            direction = "VN → EN"
            target_lang = "English"
            source_text = vn_text
            target_key = fp.en_key
            target_type = fp.en_type
        else:
            direction = "EN → VN"
            target_lang = "Vietnamese"
            source_text = en_text
            target_key = fp.vn_key
            target_type = fp.vn_type

        logger.info(
            "    [%s] Translating (%s) — source: '%.60s…'",
            fp.label, direction, source_text,
        )

        try:
            translated = translate_text(source_text, target_lang)
            any_translated = True
        except RuntimeError as exc:
            logger.error(
                "    [%s] Translation FAILED for page %s: %s", fp.label, page_id, exc
            )
            any_failure = True
            continue

        # Write translation immediately to Notion
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

    if any_failure:
        logger.warning("  ⚠ Page %s had errors during translation.", page_id)
        return False

    if any_translated:
        logger.info("  ✅ Page %s — translations completed and written to Notion.", page_id)
    return True

# ---------------------------------------------------------------------------
# Database runner
# ---------------------------------------------------------------------------
def run_database(db_label: str, database_id: str, field_pairs: list[FieldPair], is_profile: bool = False) -> tuple[int, int]:
    logger.info("=" * 60)
    logger.info("Database: %s  (ID: %s)", db_label, database_id)
    logger.info("=" * 60)

    try:
        pages = fetch_database_pages(database_id, is_profile=is_profile)
    except RuntimeError as exc:
        logger.error("Skipping database %s — fetch error: %s", db_label, exc)
        return 0, 0

    if not pages:
        logger.info("No pages found in %s.", db_label)
        return 0, 0

    success = 0
    fail = 0

    for i, page in enumerate(pages, start=1):
        page_id = page.get("id", "unknown")
        ok = process_page(page, field_pairs)
        if ok:
            success += 1
        else:
            fail += 1

    logger.info(
        "Finished %s — %d pages scanned/processed, %d had errors.\n", db_label, success, fail
    )
    return success, fail

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
def main() -> None:
    logger.info("Portfolio AI Automation CMS — v5 (Real-Time Gemini Flash & Intelligent Sanitizer)")
    total_success = 0
    total_fail = 0

    # 1. Portfolio CMS
    s, f = run_database("Portfolio CMS", PORTFOLIO_DB_ID, PORTFOLIO_FIELDS, is_profile=False)
    total_success += s
    total_fail += f

    # 2. Profile Config
    s, f = run_database("Profile Config", PROFILE_DB_ID, PROFILE_FIELDS, is_profile=True)
    total_success += s
    total_fail += f

    logger.info("=" * 60)
    logger.info(
        "ALL DONE — %d page(s) processed, %d page(s) had errors.",
        total_success, total_fail,
    )

if __name__ == "__main__":
    main()
