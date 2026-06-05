# 🚀 Project: Portfolio AI Automation CMS

## 1. Project Overview
This project is an AI-powered automation script acting as a serverless bridge between a Notion database (Portfolio CMS) and OpenRouter's LLM API. It automatically detects pending portfolio entries, translates titles and descriptions with deep tech-context awareness between English and Vietnamese, updates Notion, and publishes them.

## 2. Tech Stack & Environment
- **Primary Language:** Python 3.x
- **Infrastructure:** GitHub Actions (Automated cron job running every hour)
- **APIs Used:** Notion API & OpenRouter API
- **Environment Variables (Stored in GitHub Secrets & Local .env):**
  - `NOTION_API_KEY`
  - `NOTION_DATABASE_ID`
  - `OPENROUTER_API_KEY`
- **Configuration:** Model settings are stored in `config.json` at the root directory.

## 3. Notion Database Schema
**Database Name:** Portfolio CMS
**Core Properties:**
- `Title (VN)` (Title) / `Title (EN)` (Rich Text)
- `Description (VN)` (Rich Text) / `Description (EN)` (Rich Text)
- `Status` (Status) - Values: `Pending`, `Published`, `Archived`

## 4. System Logic & Workflow
1. **Fetch:** GitHub Actions triggers `main.py` hourly. Queries Notion for pages where `Status` == `Pending`.
2. **Extract:** If 0 pages, script terminates immediately (0 tokens used). Otherwise, extracts filled content.
3. **Process (Context-Aware AI):** Sends text to OpenRouter using the App ID headers (`HTTP-Referer` pointed to the portfolio website, `X-Title` set to "Portfolio").
4. **Update & Finalize:** Writes translation back to Notion and flips `Status` to `Published` in a single PATCH call.

## 5. The AI System Prompt (Tech-Context Aware)
> "You are an expert bilingual translator (English and Vietnamese) specializing in IT, Software Engineering, and Tech Portfolios. Your task is to automatically detect the language of the provided text and translate it into the other language.
> 
> CRITICAL RULES:
> 1. You must ONLY output the exact translated text. Do not include any introductions, explanations, quotation marks, or conversational fillers.
> 2. Preserve common IT/Tech terminology (e.g., Test, Bug, Deploy, App, Web, Frontend, Backend) in English even when translating to Vietnamese, unless there is a universally accepted Vietnamese tech equivalent.
> 3. Maintain a professional, concise tone suitable for a Software Engineer's portfolio."