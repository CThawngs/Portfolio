# 🚀 Project: Portfolio AI Automation CMS

## 1. Project Overview

This project is an AI-powered automation script designed to act as a bridge between a Notion database (serving as a Portfolio CMS) and OpenRouter's LLM API. The script automatically detects pending portfolio entries, translates their titles and descriptions seamlessly between English and Vietnamese, updates the Notion database with the translated text, and changes their status to published.

## 2. Tech Stack & Environment

- **Primary Language:** Python 3.x
- **APIs Used:**
  - Notion API (to read/write database items)
  - OpenRouter API (to process translations via LLM)
- **Environment Variables:** Stored securely in `.env`
  - `NOTION_API_KEY`
  - `OPENROUTER_API_KEY`
- **Configuration:** Model settings are stored in `config.json` at the root directory. The script must read the model ID and parameters from this file.

## 3. Notion Database Schema

**Database Name:** Portfolio CMS **Core Properties to Interact With:**

- `Title (VN)` (Type: Title) - Primary input/output
- `Title (EN)` (Type: Rich Text) - Primary input/output
- `Description (VN)` (Type: Rich Text) - Secondary input/output
- `Description (EN)` (Type: Rich Text) - Secondary input/output
- `Status` (Type: Status) - Values: `Pending`, `Published`, `Archived`

## 4. System Logic & Workflow

1. **Fetch:** Query the Notion API to retrieve all pages in the Portfolio CMS where `Status` == `Pending`.
2. **Extract:** For each retrieved page, extract the text from the Title and Description fields (whichever has content).
3. **Process (AI Translation):** Send the extracted text to OpenRouter using the predefined System Prompt.
4. **Update:** Use the Notion API to write the exact translated output back to the empty language fields (e.g., if VN is filled, write to EN).
5. **Finalize:** Update the `Status` property of the processed page from `Pending` to `Published`.

## 5. The AI System Prompt

The AI Agent MUST use this exact system prompt when calling the OpenRouter API:

> "You are an expert bilingual translator (English and Vietnamese) specializing in IT, Software Engineering, and Tech Portfolios. Your task is to automatically detect the language of the provided text and translate it into the other language.
>
> CRITICAL RULES:
> 1. You must ONLY output the exact translated text. Do not include any introductions, explanations, quotation marks, or conversational fillers.
> 2. Preserve common IT/Tech terminology (e.g., Test, Bug, Deploy, App, Web, Frontend, Backend) in English even when translating to Vietnamese, unless there is a universally accepted Vietnamese tech equivalent.
> 3. Maintain a professional, concise tone suitable for a Software Engineer's portfolio."

## 6. AI Agent Instructions (How to assist the developer)

- ALWAYS read this `CONTEXT.md` file first before generating or modifying any code.
- Write clean, modular Python code with clear comments.
- Handle API errors gracefully (e.g., retries for rate limits, logging failed entries).
- Do not expose API keys in the code; strictly use `os.environ` or `python-dotenv` to load them from `.env`.