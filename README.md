<h6 align="center">English</h6>

# Overview
**Chi Thang Portfolio** is a personal portfolio web application that showcases projects, skills, and professional background. Content is managed entirely through a **Notion CMS** and served dynamically to the live website. An AI-powered automation bot runs in the background, translating content between English and Vietnamese so every project is always available in both languages — with zero manual effort. Built as a passion project and powered by **Google's Antigravity** AI assistant.

## Purpose
### Target:
- Present a Software Engineer's projects, experience, and profile in a clean, modern, and bilingual interface.
- Eliminate repetitive translation work by automating English ↔ Vietnamese content sync via an AI bot.
- Demonstrate a modern full-stack CMS-driven portfolio built entirely with AI-assisted "vibe coding" using **Antigravity**.

### Benefits:
- **Zero-friction CMS:** Add or update a project in Notion and it appears live on the website automatically — no code changes required.
- **Bilingual by default:** The AI translation bot detects language gaps and fills them using a tech-aware prompt, preserving industry terms like *Deploy*, *Frontend*, *Backend*, and *API*.
- **Technology:** A modern full-stack implementation using **Next.js 16 (App Router) + TypeScript** for the frontend, **Tailwind CSS v4** for styling, **Framer Motion** for animations, **Notion API** as the headless CMS, **OpenRouter** for free LLM-powered translation, and **GitHub Actions** for scheduled automation — deployed on **Vercel**.

## Demo Website Here: [Chi Thang Portfolio](https://nguyen-chi-thang-portfolio.vercel.app/)

## Key Features
- 🗂️ **Notion-Powered CMS** — All project data (title, description, images, tags, links, dates) is managed directly in Notion. No database setup required.
- 🌐 **Bilingual UI (EN / VI)** — Full English and Vietnamese interface with an instant language-toggle button.
- 🤖 **AI Translation Bot** — A Python script runs on a GitHub Actions hourly cron job. It detects `Pending` items, translates missing fields (Title, Description, Role, Bio) using OpenRouter LLMs, and writes the result back to Notion — never overwriting existing content.
- 🔒 **Strict Token & Cost Protection** — The bot skips any item where both language fields are filled OR both are empty, ensuring zero wasted API calls.
- 🎨 **Dark / Light Mode** — Fully themed interface with a persistent theme toggle, built with `next-themes`.
- 🏷️ **Dynamic Filtering & Sorting** — Filter projects by category or multi-select tags; sort by newest, oldest, or A–Z title.
- 📄 **Paginated Project Grid** — Projects are paginated (6 per page) with animated card transitions powered by Framer Motion.
- 🖼️ **Project Detail Modal** — Click any card to open a full-detail vertical popup with image, description, tags, and a direct project link.
- 📡 **On-demand Revalidation** — A `/api/revalidate` webhook is triggered after Notion updates, flushing the Next.js cache for instant content refresh.
- 👤 **Dynamic Profile Section** — Name, role, bio, date of birth, and social links (Email, GitHub, LinkedIn, Instagram) are all sourced from a dedicated Notion profile database.

## Project Architecture
```
Portfolio/
├── frontend/               # Next.js 16 App Router (deployed on Vercel)
│   ├── app/
│   │   ├── page.tsx        # Server component — fetches data from Notion
│   │   ├── PortfolioUI.tsx # Client component — full UI, filtering, theming
│   │   ├── layout.tsx      # Root layout with Geist font & ThemeProvider
│   │   └── api/revalidate/ # On-demand cache revalidation endpoint
│   └── lib/
│       └── notion.js       # Notion API helpers (portfolio + profile queries)
├── main.py                 # AI translation bot (Python)
├── config.json             # OpenRouter model config
├── .github/workflows/      # GitHub Actions (hourly cron + revalidation trigger)
└── .env                    # Local secrets (not committed)
```

## Conclusion
Developed with passion 💎 and **Google Antigravity** 🤖.

<br><br>

&nbsp;
<h6 align="center">Tiếng Việt</h6>

# Tổng quan
**Chi Thang Portfolio** là một ứng dụng web portfolio cá nhân trình bày các dự án, kỹ năng và nền tảng chuyên môn. Toàn bộ nội dung được quản lý thông qua **Notion CMS** và phục vụ động đến website trực tiếp. Một bot tự động hóa được hỗ trợ bởi AI chạy ngầm, dịch nội dung giữa tiếng Anh và tiếng Việt để mọi dự án luôn hiển thị đầy đủ bằng cả hai ngôn ngữ — mà không cần bất kỳ thao tác thủ công nào. Được xây dựng như một dự án đam mê và được hỗ trợ bởi trợ lý AI **Antigravity** của Google.

## Mục đích
### Mục tiêu:
- Trình bày các dự án, kinh nghiệm và hồ sơ cá nhân của một Software Engineer trong một giao diện hiện đại, sạch sẽ và song ngữ.
- Loại bỏ công việc dịch thuật lặp đi lặp lại bằng cách tự động hóa đồng bộ nội dung Anh ↔ Việt thông qua bot AI.
- Minh chứng cho một portfolio full-stack hiện đại được điều khiển bởi CMS, được xây dựng hoàn toàn bằng phương pháp "vibe coding" với sự trợ giúp của **Antigravity**.

### Lợi ích:
- **CMS không ma sát:** Thêm hoặc cập nhật dự án trong Notion và nó sẽ xuất hiện trực tiếp trên website tự động — không cần thay đổi code.
- **Song ngữ mặc định:** Bot dịch AI phát hiện các khoảng trống ngôn ngữ và điền vào chúng bằng prompt có nhận thức về công nghệ, giữ nguyên các thuật ngữ ngành như *Deploy*, *Frontend*, *Backend*, và *API*.
- **Công nghệ:** Triển khai full-stack hiện đại sử dụng **Next.js 16 (App Router) + TypeScript** cho frontend, **Tailwind CSS v4** cho styling, **Framer Motion** cho animation, **Notion API** làm headless CMS, **OpenRouter** cho dịch thuật bằng LLM miễn phí, và **GitHub Actions** cho tự động hóa theo lịch — được triển khai trên **Vercel**.

## Thử nghiệm Website tại đây: [Chi Thang Portfolio](https://nguyen-chi-thang-portfolio.vercel.app/)

## Tính năng chính
- 🗂️ **CMS được hỗ trợ bởi Notion** — Toàn bộ dữ liệu dự án (tiêu đề, mô tả, hình ảnh, thẻ, liên kết, ngày tháng) được quản lý trực tiếp trong Notion. Không cần thiết lập cơ sở dữ liệu.
- 🌐 **Giao diện Song ngữ (EN / VI)** — Giao diện tiếng Anh và tiếng Việt đầy đủ với nút chuyển đổi ngôn ngữ tức thì.
- 🤖 **Bot Dịch thuật AI** — Một script Python chạy theo cron job hàng giờ trên GitHub Actions. Nó phát hiện các mục `Pending`, dịch các trường còn thiếu (Tiêu đề, Mô tả, Vai trò, Bio) bằng LLM của OpenRouter, và ghi kết quả trở lại Notion — không bao giờ ghi đè nội dung hiện có.
- 🔒 **Bảo vệ Token & Chi phí nghiêm ngặt** — Bot bỏ qua bất kỳ mục nào mà cả hai trường ngôn ngữ đều đã được điền HOẶC cả hai đều trống, đảm bảo không lãng phí API call.
- 🎨 **Chế độ Tối / Sáng** — Giao diện được tạo chủ đề đầy đủ với nút chuyển đổi chủ đề liên tục, được xây dựng bằng `next-themes`.
- 🏷️ **Lọc & Sắp xếp Động** — Lọc dự án theo danh mục hoặc nhiều thẻ; sắp xếp theo mới nhất, cũ nhất hoặc tiêu đề A–Z.
- 📄 **Lưới Dự án Phân trang** — Các dự án được phân trang (6 mỗi trang) với hiệu ứng chuyển đổi card được tạo bởi Framer Motion.
- 🖼️ **Modal Chi tiết Dự án** — Nhấp vào bất kỳ card nào để mở popup chi tiết đầy đủ theo chiều dọc với hình ảnh, mô tả, thẻ và liên kết dự án trực tiếp.
- 📡 **Tái xác thực theo yêu cầu** — Webhook `/api/revalidate` được kích hoạt sau khi cập nhật Notion, xóa cache Next.js để làm mới nội dung tức thì.
- 👤 **Phần Hồ sơ Động** — Tên, vai trò, bio, ngày sinh và các liên kết mạng xã hội (Email, GitHub, LinkedIn, Instagram) đều được lấy từ cơ sở dữ liệu hồ sơ Notion riêng biệt.

## Kiến trúc Dự án
```
Portfolio/
├── frontend/               # Next.js 16 App Router (triển khai trên Vercel)
│   ├── app/
│   │   ├── page.tsx        # Server component — lấy dữ liệu từ Notion
│   │   ├── PortfolioUI.tsx # Client component — toàn bộ UI, lọc, tạo chủ đề
│   │   ├── layout.tsx      # Root layout với Geist font & ThemeProvider
│   │   └── api/revalidate/ # Endpoint tái xác thực cache theo yêu cầu
│   └── lib/
│       └── notion.js       # Các hàm hỗ trợ Notion API (truy vấn portfolio + hồ sơ)
├── main.py                 # Bot dịch thuật AI (Python)
├── config.json             # Cấu hình model OpenRouter
├── .github/workflows/      # GitHub Actions (cron hàng giờ + kích hoạt tái xác thực)
└── .env                    # Secrets cục bộ (không được commit)
```

## Kết luận
Được phát triển với đam mê 💎 và **Google Antigravity** 🤖.
