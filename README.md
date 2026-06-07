<h6 align="center">English</h6>

# Overview
**Chi Thang Portfolio** is a fully automated, AI-powered CMS that turns a Notion database into a live portfolio website. **Zero code required for content management.** Add a project in Notion, click a button, and it's live — translated into both English and Vietnamese by an AI bot running on GitHub Actions.

Built as a passion project and powered entirely by **Google's Antigravity** AI assistant.

## Why This Exists
Managing a portfolio shouldn't mean touching code every time you ship a new project. This system treats **Notion as the single source of truth** — every title, description, image, tag, and link lives in a familiar spreadsheet-like interface. The website reads from Notion in real time, and an AI translation bot keeps both languages in perfect sync.

### What You Can Do — Without Writing a Single Line of Code:
- ✏️ **Add, edit, or archive** any project/certificate directly in Notion.
- 🚀 **1-click publish** to the live Next.js website — no deploy commands, no PRs, no CI/CD knowledge needed.
- 🤖 **Automatic dual-language translation** (Vietnamese ↔ English) powered by LLMs via OpenRouter, triggered by GitHub Actions.

## Demo Website: [Chi Thang Portfolio](https://nguyen-chi-thang-portfolio.vercel.app/)

---

## 🎬 Demo

### 📦 Archiving a Project
Need to hide a project from the live site? Just change its status in Notion. Done.

<video autoplay loop muted playsinline width="100%">
  <source src="https://github.com/CThawngs/Portfolio/raw/main/frontend/public/Portfolio%20Archive.mp4" type="video/mp4">
</video>

---

### 🚀 1-Click Publishing
Add your content in Notion, set the status to "Published", and trigger a single webhook. The website updates in seconds.

<video autoplay loop muted playsinline width="100%">
  <source src="https://github.com/CThawngs/Portfolio/raw/main/frontend/public/Portfolio%20Publish%20One%20Click.mp4" type="video/mp4">
</video>

---

### 🤖 AI Translation Automation
Write in one language. The bot detects the gap, translates the missing fields using a tech-aware prompt, and writes the result back to Notion — preserving terms like *Deploy*, *Frontend*, *Backend*, and *API*.

<video autoplay loop muted playsinline width="100%">
  <source src="https://github.com/CThawngs/Portfolio/raw/main/frontend/public/Portfolio%20Translate%20Automation.mp4" type="video/mp4">
</video>

---

## Key Features
- 🗂️ **Notion-Powered CMS** — All project data (title, description, images, tags, links, dates) is managed directly in Notion. No database setup required.
- 🌐 **Bilingual UI (EN / VI)** — Full English and Vietnamese interface with an instant language-toggle button.
- 🤖 **AI Translation Bot** — A Python script triggered via GitHub Actions. It detects `Pending` items, translates missing fields (Title, Description, Role, Bio) using OpenRouter LLMs, and writes the result back to Notion — never overwriting existing content.
- 🔒 **Strict Token & Cost Protection** — The bot skips any item where both language fields are filled OR both are empty, ensuring zero wasted API calls.
- 🎨 **Dark / Light Mode** — Fully themed interface with a persistent theme toggle, built with `next-themes`.
- 🏷️ **Dynamic Filtering & Sorting** — Filter projects by category or multi-select tags; sort by newest, oldest, or A–Z title.
- 📄 **Paginated Project Grid** — Projects are paginated (6 per page) with animated card transitions powered by Framer Motion.
- 🖼️ **Project Detail Modal** — Click any card to open a full-detail vertical popup with image, description, tags, and a direct project link.
- 📡 **On-demand Revalidation** — A `/api/revalidate` webhook is triggered after Notion updates, flushing the Next.js cache for instant content refresh.
- 👤 **Dynamic Profile Section** — Name, role, bio, date of birth, and social links (Email, GitHub, LinkedIn, Instagram) are all sourced from a dedicated Notion profile database.

## Technology
| Layer | Stack |
|---|---|
| **Frontend** | Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Framer Motion |
| **CMS** | Notion API (headless) |
| **Translation** | Python · OpenRouter (free LLM tier) |
| **Automation** | GitHub Actions (`repository_dispatch` + `workflow_dispatch`) |
| **Hosting** | Vercel |

## Project Architecture
```
Portfolio/
├── frontend/               # Next.js 16 App Router (deployed on Vercel)
│   ├── app/
│   │   ├── page.tsx        # Server component — fetches data from Notion
│   │   ├── PortfolioUI.tsx # Client component — full UI, filtering, theming
│   │   ├── layout.tsx      # Root layout with Geist font & ThemeProvider
│   │   └── api/
│   │       ├── revalidate/ # On-demand cache revalidation endpoint
│   │       └── trigger-bot/# Webhook to dispatch GitHub Actions
│   └── lib/
│       └── notion.js       # Notion API helpers (portfolio + profile queries)
├── main.py                 # AI translation bot (Python)
├── config.json             # OpenRouter model config
├── .github/workflows/      # GitHub Actions (repository_dispatch + manual)
└── .env                    # Local secrets (not committed)
```

## Conclusion
Developed with passion 💎 and **Google Antigravity** 🤖.

<br><br>

&nbsp;
<h6 align="center">Tiếng Việt</h6>

# Tổng quan
**Chi Thang Portfolio** là một hệ thống CMS tự động hoàn toàn, được hỗ trợ bởi AI, biến cơ sở dữ liệu Notion thành một website portfolio trực tiếp. **Không cần viết code để quản lý nội dung.** Thêm một dự án trong Notion, nhấn một nút, và nó sẽ xuất hiện trên website — được dịch sang cả tiếng Anh và tiếng Việt bởi bot AI chạy trên GitHub Actions.

Được xây dựng như một dự án đam mê và được hỗ trợ hoàn toàn bởi trợ lý AI **Antigravity** của Google.

## Tại sao dự án này tồn tại
Quản lý portfolio không nên đồng nghĩa với việc phải sửa code mỗi khi hoàn thành một dự án mới. Hệ thống này coi **Notion là nguồn sự thật duy nhất** — mọi tiêu đề, mô tả, hình ảnh, thẻ và liên kết đều nằm trong một giao diện bảng tính quen thuộc. Website đọc dữ liệu từ Notion theo thời gian thực, và bot dịch AI giữ cả hai ngôn ngữ luôn đồng bộ hoàn hảo.

### Những gì bạn có thể làm — Mà không cần viết một dòng code nào:
- ✏️ **Thêm, chỉnh sửa hoặc lưu trữ** bất kỳ dự án/chứng chỉ nào trực tiếp trong Notion.
- 🚀 **Xuất bản 1 lần nhấp** lên website Next.js trực tiếp — không cần lệnh deploy, không cần PR, không cần kiến thức CI/CD.
- 🤖 **Dịch tự động song ngữ** (Việt ↔ Anh) được hỗ trợ bởi LLM thông qua OpenRouter, kích hoạt bởi GitHub Actions.

## Thử nghiệm Website tại đây: [Chi Thang Portfolio](https://nguyen-chi-thang-portfolio.vercel.app/)

---

## 🎬 Demo

### 📦 Lưu trữ Dự án
Cần ẩn một dự án khỏi website? Chỉ cần thay đổi trạng thái của nó trong Notion. Xong.

<video autoplay loop muted playsinline width="100%">
  <source src="https://github.com/CThawngs/Portfolio/raw/main/frontend/public/Portfolio%20Archive.mp4" type="video/mp4">
</video>

---

### 🚀 Xuất bản 1-Click
Thêm nội dung trong Notion, đặt trạng thái thành "Published", và kích hoạt một webhook duy nhất. Website cập nhật trong vài giây.

<video autoplay loop muted playsinline width="100%">
  <source src="https://github.com/CThawngs/Portfolio/raw/main/frontend/public/Portfolio%20Publish%20One%20Click.mp4" type="video/mp4">
</video>

---

### 🤖 Tự động Dịch thuật bằng AI
Viết bằng một ngôn ngữ. Bot phát hiện khoảng trống, dịch các trường còn thiếu bằng prompt có nhận thức về công nghệ, và ghi kết quả trở lại Notion — giữ nguyên các thuật ngữ như *Deploy*, *Frontend*, *Backend*, và *API*.

<video autoplay loop muted playsinline width="100%">
  <source src="https://github.com/CThawngs/Portfolio/raw/main/frontend/public/Portfolio%20Translate%20Automation.mp4" type="video/mp4">
</video>

---

## Tính năng chính
- 🗂️ **CMS được hỗ trợ bởi Notion** — Toàn bộ dữ liệu dự án (tiêu đề, mô tả, hình ảnh, thẻ, liên kết, ngày tháng) được quản lý trực tiếp trong Notion. Không cần thiết lập cơ sở dữ liệu.
- 🌐 **Giao diện Song ngữ (EN / VI)** — Giao diện tiếng Anh và tiếng Việt đầy đủ với nút chuyển đổi ngôn ngữ tức thì.
- 🤖 **Bot Dịch thuật AI** — Một script Python được kích hoạt thông qua GitHub Actions. Nó phát hiện các mục `Pending`, dịch các trường còn thiếu (Tiêu đề, Mô tả, Vai trò, Bio) bằng LLM của OpenRouter, và ghi kết quả trở lại Notion — không bao giờ ghi đè nội dung hiện có.
- 🔒 **Bảo vệ Token & Chi phí nghiêm ngặt** — Bot bỏ qua bất kỳ mục nào mà cả hai trường ngôn ngữ đều đã được điền HOẶC cả hai đều trống, đảm bảo không lãng phí API call.
- 🎨 **Chế độ Tối / Sáng** — Giao diện được tạo chủ đề đầy đủ với nút chuyển đổi chủ đề liên tục, được xây dựng bằng `next-themes`.
- 🏷️ **Lọc & Sắp xếp Động** — Lọc dự án theo danh mục hoặc nhiều thẻ; sắp xếp theo mới nhất, cũ nhất hoặc tiêu đề A–Z.
- 📄 **Lưới Dự án Phân trang** — Các dự án được phân trang (6 mỗi trang) với hiệu ứng chuyển đổi card được tạo bởi Framer Motion.
- 🖼️ **Modal Chi tiết Dự án** — Nhấp vào bất kỳ card nào để mở popup chi tiết đầy đủ theo chiều dọc với hình ảnh, mô tả, thẻ và liên kết dự án trực tiếp.
- 📡 **Tái xác thực theo yêu cầu** — Webhook `/api/revalidate` được kích hoạt sau khi cập nhật Notion, xóa cache Next.js để làm mới nội dung tức thì.
- 👤 **Phần Hồ sơ Động** — Tên, vai trò, bio, ngày sinh và các liên kết mạng xã hội (Email, GitHub, LinkedIn, Instagram) đều được lấy từ cơ sở dữ liệu hồ sơ Notion riêng biệt.

## Công nghệ
| Lớp | Công nghệ |
|---|---|
| **Frontend** | Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Framer Motion |
| **CMS** | Notion API (headless) |
| **Dịch thuật** | Python · OpenRouter (tier LLM miễn phí) |
| **Tự động hóa** | GitHub Actions (`repository_dispatch` + `workflow_dispatch`) |
| **Hosting** | Vercel |

## Kiến trúc Dự án
```
Portfolio/
├── frontend/               # Next.js 16 App Router (triển khai trên Vercel)
│   ├── app/
│   │   ├── page.tsx        # Server component — lấy dữ liệu từ Notion
│   │   ├── PortfolioUI.tsx # Client component — toàn bộ UI, lọc, tạo chủ đề
│   │   ├── layout.tsx      # Root layout với Geist font & ThemeProvider
│   │   └── api/
│   │       ├── revalidate/ # Endpoint tái xác thực cache theo yêu cầu
│   │       └── trigger-bot/# Webhook để dispatch GitHub Actions
│   └── lib/
│       └── notion.js       # Các hàm hỗ trợ Notion API (truy vấn portfolio + hồ sơ)
├── main.py                 # Bot dịch thuật AI (Python)
├── config.json             # Cấu hình model OpenRouter
├── .github/workflows/      # GitHub Actions (repository_dispatch + thủ công)
└── .env                    # Secrets cục bộ (không được commit)
```

## Kết luận
Được phát triển với đam mê 💎 và **Google Antigravity** 🤖.
