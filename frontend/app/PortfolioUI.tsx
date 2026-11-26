"use client";

import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
  useSyncExternalStore,
} from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  ExternalLink,
  FolderKanban,
  Mail,
  ArrowUpRight,
  ArrowUpDown,
  Award,
  Code,
  LayoutGrid,
  GalleryHorizontalEnd,
  Tag,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
} from "lucide-react";

import CustomCursor from "./components/CustomCursor";
import AmbientBackdrop from "./components/AmbientBackdrop";
import {
  Scroll3DSection,
  Tilt3DCard,
  useReducedMotionPreference,
} from "./components/Scroll3D";
import { AdaptiveGridCover } from "./components/SafePortfolioImage";
import { preloadImagesBackground } from "./components/imagePreloader";
import {
  buildTagColorMap,
  getTagColorScheme,
  type TagColorScheme,
} from "./components/tagPalette";
import { useMagneticHandlers } from "./components/Magnetic";
import ShowcaseCarousel from "./components/ShowcaseCarousel";
import MoreInfoView from "./components/MoreInfoView";
import ProjectDetailModal from "./components/ProjectDetailModal";

const noopSubscribe = () => () => {};

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      stroke="currentColor"
      strokeWidth="1.9"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      stroke="currentColor"
      strokeWidth="1.9"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      stroke="currentColor"
      strokeWidth="1.9"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

const URL_SPLIT_RE = /(https?:\/\/[^\s]+|www\.[^\s]+)/i;
const URL_EXACT_RE = /^(https?:\/\/[^\s]+|www\.[^\s]+)$/i;
const TRAILING_PUNCT_RE = /[)\].!,;?'"]+$/;

function LinkifiedText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  if (!text) return null;
  const parts = text.split(URL_SPLIT_RE);
  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (!URL_EXACT_RE.test(part)) {
          return <React.Fragment key={i}>{part}</React.Fragment>;
        }

        const clean = part.replace(TRAILING_PUNCT_RE, "");
        const trailing = part.slice(clean.length);
        const href = clean.startsWith("www.") ? `https://${clean}` : clean;

        return (
          <React.Fragment key={i}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              data-cursor="magnetic"
              className="font-medium text-[var(--ink-primary)] underline decoration-[var(--ink-decorative)] hover:decoration-[var(--ink-primary)] underline-offset-4 transition-colors duration-150 break-all cursor-pointer"
            >
              {clean}
            </a>
            {trailing}
          </React.Fragment>
        );
      })}
    </span>
  );
}

const TYPING_SPEED = 42;
const DELETING_SPEED = 18;
const PAUSE_TIME = 2200;
const GAP_TIME = 280;

function splitPhrases(text: string): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n+|\||(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function TerminalTyping({ role, bio }: { role: string; bio: string }) {
  const items = useMemo(() => {
    const roleItems = role ? splitPhrases(role) : [];
    const bioItems = bio ? splitPhrases(bio) : [];
    return [...roleItems, ...bioItems].filter(Boolean);
  }, [role, bio]);

  const reducedMotion = useReducedMotionPreference();

  const [itemIdx, setItemIdx] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!items.length || reducedMotion) return;

    const currentItem = items[itemIdx % items.length] || "";

    if (!isDeleting) {
      if (displayText.length < currentItem.length) {
        const timeout = setTimeout(() => {
          setDisplayText(currentItem.slice(0, displayText.length + 1));
        }, TYPING_SPEED);
        return () => clearTimeout(timeout);
      }
      const timeout = setTimeout(() => {
        setIsDeleting(true);
      }, PAUSE_TIME);
      return () => clearTimeout(timeout);
    } else {
      if (displayText.length > 0) {
        const timeout = setTimeout(() => {
          setDisplayText(currentItem.slice(0, displayText.length - 1));
        }, DELETING_SPEED);
        return () => clearTimeout(timeout);
      }
      const timeout = setTimeout(() => {
        setIsDeleting(false);
        setItemIdx((prev) => (prev + 1) % items.length);
      }, GAP_TIME);
      return () => clearTimeout(timeout);
    }
  }, [displayText, isDeleting, itemIdx, items, reducedMotion]);

  if (!items.length) return null;

  return (
    <div className="w-full min-h-[3.1rem] sm:min-h-[2rem] py-[0.1em] flex items-center justify-center">
      <p className="text-center text-[14.5px] min-[380px]:text-[15.5px] sm:text-[18px] font-normal text-[var(--ink-secondary)] leading-[1.52] max-w-2xl mx-auto">
        <span>{reducedMotion ? items.join(" · ") : displayText}</span>
        {!reducedMotion && (
          <span
            aria-hidden="true"
            className="inline-block w-[1.8px] h-[1.08em] align-middle bg-[var(--ink-primary)] ml-1 animate-pulse rounded-full"
          />
        )}
      </p>
    </div>
  );
}

export interface Project {
  id: string;
  status: string;
  title_vn: string;
  title_en: string;
  desc_vn: string;
  desc_en: string;
  category: string;
  links: string;
  images: string[];
  tags: string[];
  last_edited_time?: string;
  project_date?: {
    start: string | null;
    end: string | null;
  } | null;
}

export interface ProfileData {
  name_vn: string;
  name_en: string;
  role_vn: string;
  role_en: string;
  bio_vn: string;
  bio_en: string;
  about_vn?: string;
  about_en?: string;
  skills_vn?: string;
  skills_en?: string;
  experience_vn?: string;
  experience_en?: string;
  education_vn?: string;
  education_en?: string;
  dob: string | null;
  email: string;
  github: string;
  linkedin: string;
  instagram: string;
}

interface PortfolioUIProps {
  projects: Project[];
  profileData?: ProfileData | null;
}

type SortOrder = "newest" | "oldest";
type ShowcaseLayout = "grid" | "stage";

function cleanText(str: string): string {
  if (!str) return "";
  return str
    .replace(/^\[+(.*?)\]+$/g, "$1")
    .replace(/\[(.*?)\]/g, "$1")
    .replace(/\{(.*?)\}/g, "$1")
    .trim();
}

interface SkillGroup {
  category: string;
  skills: string[];
}

function parseSkills(text: string): SkillGroup[] {
  if (!text) return [];
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const groups: SkillGroup[] = [];

  for (const line of lines) {
    if (line.includes(":")) {
      const parts = line.split(/:\s*(.+)/);
      const cat = cleanText(parts[0] || "Skills");
      const items = parts[1] || "";
      const skills = items
        .split(/[,|•·\n]+/)
        .map((s) => cleanText(s))
        .filter(Boolean);
      if (cat && skills.length > 0) {
        groups.push({ category: cat, skills });
      }
    } else {
      const items = line
        .split(/[,|•·]+/)
        .map((s) => cleanText(s))
        .filter(Boolean);
      if (items.length > 0) {
        groups.push({ category: "Skills", skills: items });
      }
    }
  }

  return groups;
}

interface ExperienceItem {
  org: string;
  role: string;
  period?: string;
  badge?: string;
  bullets: string[];
}

function parseExperiences(text: string): ExperienceItem[] {
  if (!text) return [];

  const rawLines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const items: ExperienceItem[] = [];
  let currentItem: ExperienceItem | null = null;

  for (const line of rawLines) {
    const isBullet = /^[-*•·+–—]\s*/.test(line);

    if (!isBullet) {
      const parts = line.split(/\s*\|\s*/).map((p) => cleanText(p));

      let org = "";
      let role = "";
      let period = "";
      let badge = "";

      if (parts.length >= 4) {
        org = parts[0];
        role = parts[1];
        period = parts[2];
        badge = parts[3];
      } else if (parts.length === 3) {
        org = parts[0];
        role = parts[1];
        period = parts[2];
      } else if (parts.length === 2) {
        org = parts[0];
        if (/\b(20\d\d|19\d\d|present|hiện tại)\b/i.test(parts[1])) {
          period = parts[1];
        } else {
          role = parts[1];
        }
      } else {
        org = parts[0];
      }

      if (currentItem) {
        items.push(currentItem);
      }

      currentItem = {
        org: cleanText(org),
        role: cleanText(role),
        period: cleanText(period),
        badge: cleanText(badge),
        bullets: [],
      };
    } else {
      const cleaned = cleanText(line.replace(/^[-*•·+–—]\s*/, ""));
      if (cleaned) {
        if (!currentItem) {
          currentItem = {
            org: "Experience",
            role: "",
            bullets: [],
          };
        }
        currentItem.bullets.push(cleaned);
      }
    }
  }

  if (currentItem) {
    items.push(currentItem);
  }

  return items;
}

interface EducationItem {
  school: string;
  major?: string;
  gpa?: string;
  period?: string;
  notes?: string;
}

function parseEducation(text: string): EducationItem[] {
  if (!text) return [];
  const blocks = text
    .split(/\n\s*\n+|\|\|+|- - -+|---+/)
    .map((b) => b.trim())
    .filter(Boolean);

  const items: EducationItem[] = [];

  for (const block of blocks) {
    let parts: string[] = [];
    if (block.includes("\n")) {
      parts = block
        .split(/\n+/)
        .map((l) => cleanText(l))
        .filter(Boolean);
    } else {
      parts = block
        .split(/\s*\|\s*/)
        .map((l) => cleanText(l))
        .filter(Boolean);
    }

    if (!parts.length) continue;

    const school = cleanText(parts[0] || "");
    let major = "";
    let gpa = "";
    let period = "";
    const extraNotes: string[] = [];

    for (let i = 1; i < parts.length; i++) {
      const p = cleanText(parts[i]);
      if (/gpa/i.test(p)) {
        gpa = p;
      } else if (
        /\b(20\d\d|19\d\d|graduat|tốt nghiệp|present|hiện tại)\b/i.test(p)
      ) {
        period = p;
      } else if (!major) {
        major = p;
      } else {
        extraNotes.push(p);
      }
    }

    items.push({
      school,
      major,
      gpa,
      period,
      notes: extraNotes.join(" • "),
    });
  }

  return items;
}

function parseParagraphs(text: string): string[] {
  if (!text) return [];
  return text
    .split(/\n\s*\n+|\|\|+/)
    .map((p) => cleanText(p))
    .filter(Boolean);
}

const ITEMS_PER_PAGE = 6;
const INITIAL_VISIBLE_TAGS = 14;

const getTimeValue = (item: Project): number => {
  if (item.project_date?.start) {
    const time = new Date(item.project_date.start).getTime();
    if (!isNaN(time)) return time;
  }
  if (item.last_edited_time) {
    const time = new Date(item.last_edited_time).getTime();
    if (!isNaN(time)) return time;
  }
  return 0;
};

const DEMO_CERT_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 560" fill="none">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="800" y2="560" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#FFFFFF"/>
          <stop offset="1" stop-color="#EBF3FF"/>
        </linearGradient>
      </defs>
      <rect width="800" height="560" rx="28" fill="url(#bg)"/>
      <rect x="24" y="24" width="752" height="512" rx="20" stroke="#CFE0FC" stroke-width="2"/>
      <text x="64" y="78" fill="#1A73E8" font-family="Arial, sans-serif" font-size="22" font-weight="700">Google</text>
      <text x="736" y="78" text-anchor="end" fill="#1F2937" font-family="Arial, sans-serif" font-size="20" font-weight="700">Gemini Academy</text>
      <text x="400" y="165" text-anchor="middle" fill="#111827" font-family="Arial, sans-serif" font-size="34" font-weight="700">Certificate of Completion</text>
      <text x="400" y="250" text-anchor="middle" fill="#1A73E8" font-family="Arial, sans-serif" font-size="44" font-weight="700">Nguyen Chi Thang</text>
      <text x="400" y="315" text-anchor="middle" fill="#4B5563" font-family="Arial, sans-serif" font-size="20">Has successfully completed the program</text>
      <text x="400" y="375" text-anchor="middle" fill="#111827" font-family="Arial, sans-serif" font-size="28" font-weight="700">Gemini for SMBs — AI Acceleration</text>
      <text x="400" y="475" text-anchor="middle" fill="#6B7280" font-family="Arial, sans-serif" font-size="15">Issued &amp; Verified by Google in collaboration with NIC &amp; STEAM for Vietnam</text>
    </svg>`
  );

const DEV_DEMO_PROFILE: ProfileData = {
  name_en: "Nguyen Chi Thang",
  name_vn: "Nguyễn Chí Thắng",
  role_en:
    "Hi, I am looking for an AI Application Engineer position,\nand a Full Stack AI Developer position,\nas well as an AI Software Engineer position.",
  role_vn:
    "Xin chào, tôi đang tìm kiếm vị trí Kỹ sư Ứng dụng AI,\nvà vị trí Lập trình viên AI Full-stack,\ncũng như vị trí Kỹ sư Phần mềm AI.",
  bio_en: "Passionate about tinkering with AI :>",
  bio_vn: "Đam mê vọc vạch về AI :>",
  about_en: "",
  about_vn: "",
  skills_en:
    "AI & Agents: LLMs, Computer Vision, OpenRouter, RAG, Prompt Engineering\nFrontend: Next.js 16, React 19, TypeScript, Tailwind CSS, Framer Motion\nBackend & Ops: Python, Node.js, Notion API, GitHub Actions, Docker",
  skills_vn:
    "AI & Tác tử: LLMs, Thị giác máy tính, OpenRouter, RAG, Prompt Engineering\nGiao diện: Next.js 16, React 19, TypeScript, Tailwind CSS, Framer Motion\nHệ thống: Python, Node.js, Notion API, GitHub Actions, Docker",
  experience_en:
    "AI Engineering Lab | AI Engineer Intern | 2026 - Present | Featured\n- Built LLM & Computer Vision optimization pipelines reducing inference latency by 38%\n- Designed automated bilingual content orchestration with zero-token idle overhead\nIndependent Studio | Solo Founder & Builder | 2024 - 2026\n- Shipped full-stack developer tools and Notion-synced web applications",
  experience_vn:
    "Phòng Nghiên Cứu AI | Thực Tập Sinh Kỹ Sư AI | 2026 - Hiện tại | Nổi bật\n- Xây dựng luồng tối ưu hóa LLM & Thị giác máy tính giúp giảm 38% độ trễ suy luận\n- Thiết kế kiến trúc đồng bộ nội dung song ngữ tự động hoàn toàn qua GitHub Actions\nIndependent Studio | Nhà Sáng Lập Độc Lập | 2024 - 2026\n- Phát triển công cụ cho lập trình viên và nền tảng web đồng bộ trực tiếp với Notion",
  education_en:
    "Ly Tu Trong College | Information Technology | Specialized in AI & Software Engineering | 2022 - 2027",
  education_vn:
    "Cao đẳng Lý Tự Trọng | Công nghệ Thông tin | Chuyên sâu AI & Kỹ thuật Phần mềm | 2022 - 2027",
  dob: "2007-04-28",
  email: "nguyenchithang2804@gmail.com",
  github: "https://github.com/CThawngs",
  linkedin: "https://www.linkedin.com/in/cthawngs/",
  instagram: "https://www.instagram.com/cthawngs2804/",
};

const DEV_DEMO_PROJECTS: Project[] = [
  {
    id: "demo-1",
    status: "Published",
    title_en: "Disk Cleaner MCP",
    title_vn: "Công Cụ Dọn Đĩa Thông Minh Disk Cleaner MCP",
    desc_en:
      "A Rust-based MCP (Model Context Protocol) server that gives AI agents — Hermes, Claude, Cursor, OpenClaw, Codex — the ability to scan, analyze, organize, and safely clean junk files on Windows, macOS, and Linux. https://github.com/CThawngs",
    desc_vn:
      "Máy chủ MCP viết bằng Rust giúp các tác tử AI quét, phân tích, sắp xếp và dọn dẹp tệp rác an toàn trên Windows, macOS và Linux. https://github.com/CThawngs",
    category: "Project",
    links: "https://github.com/CThawngs",
    images: ["/Portfolio Publish One Click.gif"],
    tags: ["Artificial Intelligence", "Website", "Coding", "Git", "GitHub"],
    project_date: { start: "2026-07-01", end: "2026-09-25" },
  },
  {
    id: "demo-2",
    status: "Published",
    title_en: "Portfolio AI Automation CMS",
    title_vn: "Hệ Thống CMS Portfolio Tự Động Hóa AI",
    desc_en:
      "Serverless bridge between Notion CMS and OpenRouter LLMs with context-aware bilingual translation and instant ISR publishing. https://github.com/CThawngs/Portfolio",
    desc_vn:
      "Cầu nối serverless giữa Notion CMS và OpenRouter LLM giúp dịch thuật song ngữ tự động chuẩn ngữ cảnh kỹ thuật số. https://github.com/CThawngs/Portfolio",
    category: "Project",
    links: "https://github.com/CThawngs/Portfolio",
    images: ["/Portfolio Translate Automation.gif"],
    tags: ["Next.js", "Notion API", "Python", "OpenRouter", "Tailwind CSS"],
    project_date: { start: "2026-06-15", end: "2026-08-20" },
  },
  {
    id: "demo-3",
    status: "Published",
    title_en: "Zero AI Note & Lifecycle Controller",
    title_vn: "Zero AI Note & Bộ Điều Phối Nội Dung Tức Thì",
    desc_en:
      "High-craft workspace automation and instant edge cache revalidation for real-time publishing.",
    desc_vn:
      "Tự động hóa không gian làm việc và làm mới bộ nhớ đệm biên tức thì cho xuất bản thời gian thực.",
    category: "Project",
    links: "https://github.com/CThawngs",
    images: ["/Portfolio Archive.gif"],
    tags: ["TypeScript", "MCP", "Edge ISR", "REST API"],
    project_date: { start: "2026-03-10", end: "2026-05-01" },
  },
  {
    id: "demo-cert-1",
    status: "Published",
    title_en: "Gemini for SMBs",
    title_vn: "Chứng Chỉ Gemini for SMBs — Google & NIC",
    desc_en:
      "This is the certificate received upon completing the “Gemini for SMBs” course organized by Google in collaboration with NIC & STEAM for Vietnam.",
    desc_vn:
      "Chứng nhận hoàn thành khóa học “Gemini for SMBs — Vươn mình bứt phá cùng AI” do Google phối hợp cùng NIC & STEAM for Vietnam tổ chức.",
    category: "Certificate",
    links: "https://google.com",
    images: [DEMO_CERT_SVG],
    tags: ["Google", "NIC", "Generative AI"],
    project_date: { start: "2026-11-25", end: null },
  },
  {
    id: "demo-cert-2",
    status: "Published",
    title_en: "Google People Management Essentials",
    title_vn: "Chứng Chỉ Quản Trị Đội Ngũ Cốt Lõi Google",
    desc_en:
      "Credential covering high-performing team leadership, goal setting, and structured individual growth coaching.",
    desc_vn:
      "Chứng chỉ về dẫn dắt đội ngũ hiệu suất cao, thiết lập mục tiêu OKRs và huấn luyện phát triển cá nhân bài bản.",
    category: "Certificate",
    links: "https://coursera.org",
    images: [],
    tags: ["Google", "Leadership", "Management"],
    project_date: { start: "2026-02-18", end: null },
  },
];

function NavPillButton({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count?: number;
  children: React.ReactNode;
}) {
  const { onPointerEnter, onPointerMove, onPointerLeave } = useMagneticHandlers(
    5,
    active
  );

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      data-cursor="magnetic"
      className={`magnetic-target relative shrink-0 inline-flex items-center justify-center gap-1.5 h-8 px-2.5 lg:px-3.5 rounded-[9px] text-[12.5px] lg:text-[13px] font-semibold transition-all cursor-pointer ${
        active
          ? "bg-[var(--pill-active-bg)] text-[var(--ink-primary)] shadow-2xs"
          : "bg-transparent text-[var(--ink-meta)] hover:text-[var(--ink-primary)]"
      }`}
    >
      <span>{children}</span>
      {typeof count === "number" && (
        <span
          className={`px-1.5 py-0.2 rounded-full text-[10.5px] tabular-nums ${
            active
              ? "bg-[var(--pill-bg)] text-[var(--ink-primary)]"
              : "text-[var(--ink-muted)]"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function buildPageNumbers(
  current: number,
  total: number
): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | "ellipsis")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("ellipsis");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push("ellipsis");
  pages.push(total);
  return pages;
}

interface ShowcaseSectionBlockProps {
  sectionId: string;
  headingEn: string;
  headingVn: string;
  isCertificateSection?: boolean;
  lang: "EN" | "VN";
  rawItems: Project[];
  categories: { name: string; count: number }[];
  tags: string[];
  tagColorMap: Map<string, TagColorScheme>;
  layoutMode: ShowcaseLayout;
  onLayoutModeChange: (mode: ShowcaseLayout) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (ord: SortOrder) => void;
  selectedCategory: string | null;
  onSelectCategory: (cat: string | null) => void;
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  page: number;
  onPageChange: (page: number) => void;
  onSelectProject: (item: Project) => void;
  formatDateRangeString: (dr: Project["project_date"]) => string | null;
  formatYearOrDate: (item: Project) => string;
  renderLinkified: (text: string, className?: string) => React.ReactNode;
}

function ShowcaseSectionBlock({
  sectionId,
  headingEn,
  headingVn,
  isCertificateSection = false,
  lang,
  rawItems,
  categories,
  tags,
  tagColorMap,
  layoutMode,
  onLayoutModeChange,
  sortOrder,
  onSortOrderChange,
  selectedCategory,
  onSelectCategory,
  selectedTag,
  onSelectTag,
  page,
  onPageChange,
  onSelectProject,
  formatDateRangeString,
  formatYearOrDate,
  renderLinkified,
}: ShowcaseSectionBlockProps) {
  const [showAllTags, setShowAllTags] = useState(false);
  const sectionTopRef = useRef<HTMLDivElement | null>(null);

  const activeCategory = useMemo(
    () =>
      selectedCategory && categories.some((c) => c.name === selectedCategory)
        ? selectedCategory
        : null,
    [selectedCategory, categories]
  );

  const filteredItems = useMemo(() => {
    let base = rawItems;
    if (activeCategory) {
      base = base.filter((item) => item.category === activeCategory);
    }
    if (selectedTag) {
      base = base.filter((item) => item.tags && item.tags.includes(selectedTag));
    }
    return [...base].sort((a, b) => {
      const tA = getTimeValue(a);
      const tB = getTimeValue(b);
      return sortOrder === "newest" ? tB - tA : tA - tB;
    });
  }, [rawItems, activeCategory, selectedTag, sortOrder]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / ITEMS_PER_PAGE)
  );
  const currentPage = Math.min(page, totalPages);

  const paginatedGridItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  // Politely warm ONLY the immediate next page (6 compact w=640 WebP thumbnails ~200KB) during idle time
  useEffect(() => {
    if (!filteredItems.length || layoutMode !== "grid") return;
    const nextStart = currentPage * ITEMS_PER_PAGE;
    const nextEnd = Math.min(filteredItems.length, nextStart + ITEMS_PER_PAGE);
    if (nextStart >= nextEnd) return;
    const nextUrls: string[] = [];
    for (let i = nextStart; i < nextEnd; i++) {
      const cover = filteredItems[i]?.images?.[0];
      if (cover) nextUrls.push(cover);
    }
    if (nextUrls.length > 0) {
      preloadImagesBackground(nextUrls, 640);
    }
  }, [filteredItems, currentPage, layoutMode]);

  const visibleTags = useMemo(() => {
    if (showAllTags || tags.length <= INITIAL_VISIBLE_TAGS) {
      return tags;
    }
    const base = tags.slice(0, INITIAL_VISIBLE_TAGS);
    if (selectedTag && !base.includes(selectedTag)) {
      return [...base, selectedTag];
    }
    return base;
  }, [tags, showAllTags, selectedTag]);

  const handlePageChange = (nextPage: number) => {
    onPageChange(nextPage);
    if (sectionTopRef.current) {
      const y =
        sectionTopRef.current.getBoundingClientRect().top + window.scrollY - 76;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    }
  };

  const showCategoryPills = categories.length > 1;

  return (
    <Scroll3DSection id={sectionId} className="apple-shell py-4 sm:py-6">
      <div ref={sectionTopRef} className="space-y-4 sm:space-y-5">
        {/* Section Header + Evenly Balanced Responsive Switches */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-[var(--card-border)]">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="apple-h2 text-[22px] sm:text-[30px] font-semibold text-[var(--ink-primary)]">
                {lang === "EN" ? headingEn : headingVn}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums bg-[var(--pill-bg)] apple-hairline text-[var(--ink-meta)]">
                {rawItems.length}
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-[13px] font-medium tabular-nums text-[var(--ink-meta)]">
              {layoutMode === "grid"
                ? lang === "EN"
                  ? `Showing ${paginatedGridItems.length} of ${filteredItems.length} ${
                      isCertificateSection ? "credentials" : "projects"
                    }`
                  : `Hiển thị ${paginatedGridItems.length} / ${filteredItems.length} ${
                      isCertificateSection ? "chứng chỉ" : "dự án"
                    }`
                : lang === "EN"
                ? `Interactive Stage · ${filteredItems.length} ${
                    isCertificateSection ? "credentials" : "projects"
                  }`
                : `Sân khấu 3 cột · ${filteredItems.length} ${
                    isCertificateSection ? "chứng chỉ" : "dự án"
                  }`}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="flex h-9 sm:h-10 items-center p-1 rounded-[11px] sm:rounded-[12px] bg-[var(--pill-bg)] apple-hairline">
              <button
                type="button"
                onClick={() => onLayoutModeChange("grid")}
                data-cursor="magnetic"
                aria-pressed={layoutMode === "grid"}
                className={`flex-1 sm:flex-initial inline-flex h-7 sm:h-8 items-center justify-center gap-1.5 px-2 sm:px-3 rounded-[8px] text-[11.5px] sm:text-xs font-semibold transition-all cursor-pointer ${
                  layoutMode === "grid"
                    ? "bg-[var(--pill-active-bg)] text-[var(--ink-primary)] shadow-2xs"
                    : "text-[var(--ink-meta)] hover:text-[var(--ink-primary)]"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {lang === "EN" ? "Grid" : "Lưới"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onLayoutModeChange("stage")}
                data-cursor="magnetic"
                aria-pressed={layoutMode === "stage"}
                className={`flex-1 sm:flex-initial inline-flex h-7 sm:h-8 items-center justify-center gap-1.5 px-2 sm:px-3 rounded-[8px] text-[11.5px] sm:text-xs font-semibold transition-all cursor-pointer ${
                  layoutMode === "stage"
                    ? "bg-[var(--pill-active-bg)] text-[var(--ink-primary)] shadow-2xs"
                    : "text-[var(--ink-meta)] hover:text-[var(--ink-primary)]"
                }`}
              >
                <GalleryHorizontalEnd className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {lang === "EN" ? "Stage" : "Sân khấu"}
                </span>
              </button>
            </div>

            <div className="flex h-9 sm:h-10 items-center gap-0.5 p-1 rounded-[11px] sm:rounded-[12px] bg-[var(--pill-bg)] apple-hairline">
              <span className="hidden md:inline-flex items-center gap-1 px-2 text-xs font-medium text-[var(--ink-meta)]">
                <ArrowUpDown className="h-3.5 w-3.5" />
                <span>{lang === "EN" ? "Sort" : "Xếp"}</span>
              </span>
              {(["newest", "oldest"] as const).map((ord) => (
                <button
                  key={ord}
                  type="button"
                  onClick={() => {
                    onSortOrderChange(ord);
                    onPageChange(1);
                  }}
                  data-cursor="magnetic"
                  className={`flex-1 sm:flex-initial h-7 sm:h-8 px-2 sm:px-3 rounded-[8px] text-[11.5px] sm:text-xs font-semibold transition-all cursor-pointer truncate ${
                    sortOrder === ord
                      ? "bg-[var(--pill-active-bg)] text-[var(--ink-primary)] shadow-2xs"
                      : "text-[var(--ink-meta)] hover:text-[var(--ink-primary)]"
                  }`}
                >
                  {ord === "newest"
                    ? lang === "EN"
                      ? "Newest"
                      : "Mới nhất"
                    : lang === "EN"
                    ? "Oldest"
                    : "Cũ nhất"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {showCategoryPills && (
          <div className="w-full overflow-x-auto hide-scrollbar">
            <div className="flex w-max sm:w-auto sm:flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 pr-1 text-[11.5px] font-semibold text-[var(--ink-meta)]">
                <FolderKanban className="h-3.5 w-3.5 opacity-75" />
                <span>{lang === "EN" ? "Category:" : "Danh mục:"}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  onSelectCategory(null);
                  onPageChange(1);
                }}
                data-cursor="magnetic"
                className={`inline-flex h-7 items-center gap-1 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  !activeCategory
                    ? "bg-[var(--ink-primary)] text-[var(--background)]"
                    : "bg-[var(--pill-bg)] apple-hairline text-[var(--ink-meta)] hover:text-[var(--ink-primary)]"
                }`}
              >
                <span>{lang === "EN" ? "All" : "Tất cả"}</span>
                <span className="opacity-75 tabular-nums text-[11px]">
                  ({rawItems.length})
                </span>
              </button>

              {categories.map((cat) => {
                const active = activeCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => {
                      onSelectCategory(active ? null : cat.name);
                      onPageChange(1);
                    }}
                    data-cursor="magnetic"
                    className={`inline-flex h-7 items-center gap-1 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      active
                        ? "bg-[var(--ink-primary)] text-[var(--background)]"
                        : "bg-[var(--pill-bg)] apple-hairline text-[var(--ink-meta)] hover:text-[var(--ink-primary)]"
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="opacity-75 tabular-nums text-[11px]">
                      ({cat.count})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tags.length > 0 && (
          <div className="w-full overflow-x-auto hide-scrollbar">
            <div className="flex w-max sm:w-auto sm:flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 pr-1 text-[11.5px] font-semibold text-[var(--ink-meta)]">
                <Tag className="h-3.5 w-3.5 opacity-75" />
                <span>{lang === "EN" ? "Tags:" : "Thẻ:"}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  onSelectTag(null);
                  onPageChange(1);
                }}
                data-cursor="magnetic"
                className={`h-7 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  !selectedTag
                    ? "bg-[var(--ink-primary)] text-[var(--background)] shadow-xs"
                    : "bg-[var(--pill-bg)] apple-hairline text-[var(--ink-meta)] hover:text-[var(--ink-primary)]"
                }`}
              >
                {lang === "EN" ? "All" : "Tất cả"}
              </button>

              {visibleTags.map((tag) => {
                const active = selectedTag === tag;
                const scheme = getTagColorScheme(tag, tagColorMap);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      onSelectTag(active ? null : tag);
                      onPageChange(1);
                    }}
                    data-cursor="magnetic"
                    className={`h-7 px-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      active
                        ? scheme.activePill
                        : `${scheme.pill} hover:opacity-85`
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}

              {tags.length > INITIAL_VISIBLE_TAGS && (
                <button
                  type="button"
                  onClick={() => setShowAllTags((prev) => !prev)}
                  data-cursor="magnetic"
                  className="h-7 px-2.5 rounded-lg text-xs font-semibold bg-[var(--pill-bg)] apple-hairline text-[var(--ink-primary)] hover:opacity-80 transition-opacity cursor-pointer"
                >
                  {showAllTags
                    ? lang === "EN"
                      ? "Show less"
                      : "Thu gọn"
                    : lang === "EN"
                    ? `+${tags.length - INITIAL_VISIBLE_TAGS} more`
                    : `+${tags.length - INITIAL_VISIBLE_TAGS} thẻ`}
                </button>
              )}
            </div>
          </div>
        )}

        {layoutMode === "stage" ? (
          <ShowcaseCarousel
            key={`${sectionId}-${activeCategory ?? "all"}-${
              selectedTag ?? "all"
            }-${sortOrder}`}
            items={filteredItems}
            lang={lang}
            isCertificateReel={isCertificateSection}
            tagColorMap={tagColorMap}
            onSelectProject={onSelectProject}
            formatYearOrDate={formatYearOrDate}
            formatDateRange={formatDateRangeString}
            renderLinkifiedText={renderLinkified}
          />
        ) : (
          <div className="pt-1 sm:pt-2">
            {paginatedGridItems.length === 0 ? (
              <div className="mx-auto max-w-2xl px-6 py-14 text-center rounded-[24px] apple-surface-card text-[var(--ink-meta)] text-sm">
                {lang === "EN"
                  ? "No items match the selected filter."
                  : "Không có mục nào khớp bộ lọc đang chọn."}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {paginatedGridItems.map((item, idx) => {
                  const title =
                    (lang === "EN" ? item.title_en : item.title_vn) ||
                    item.title_en ||
                    item.title_vn ||
                    "Untitled";
                  const desc =
                    (lang === "EN"
                      ? item.desc_en || item.desc_vn
                      : item.desc_vn || item.desc_en) || "";
                  const primarySrc =
                    item.images && item.images[0] ? item.images[0] : "";
                  const dateStr =
                    formatDateRangeString(item.project_date) ||
                    formatYearOrDate(item);

                  const cardFallback = (
                    <div className="relative flex h-full w-full flex-col items-center justify-center p-4 text-center bg-[var(--surface-elevated)] overflow-hidden">
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 apple-studio-dots opacity-45"
                      />
                      <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--pill-bg)] apple-hairline text-[var(--ink-primary)] mb-2">
                        {isCertificateSection ? (
                          <Award className="h-5 w-5 opacity-80" />
                        ) : (
                          <Code className="h-5 w-5 opacity-80" />
                        )}
                      </div>
                      <span className="relative z-10 text-xs font-medium text-[var(--ink-meta)] line-clamp-2 max-w-[24ch]">
                        {title}
                      </span>
                    </div>
                  );

                  return (
                    <Tilt3DCard
                      key={item.id}
                      index={idx}
                      maxTilt={3.2}
                      cursorZone="view"
                      onClick={() => onSelectProject(item)}
                      className="group flex flex-col rounded-[20px] sm:rounded-[24px] apple-surface-card overflow-hidden cursor-pointer"
                    >
                      <div className="relative w-full aspect-[16/10] overflow-hidden bg-[var(--surface-elevated)] border-b border-[var(--card-border)]">
                        <AdaptiveGridCover
                          src={primarySrc}
                          alt={title}
                          isCertificate={isCertificateSection}
                          priority={
                            !isCertificateSection &&
                            currentPage === 1 &&
                            idx < 3
                          }
                          fallback={cardFallback}
                        />
                      </div>

                      <div className="flex flex-1 flex-col p-4 sm:p-6">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          {dateStr ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold tabular-nums text-[var(--ink-meta)]">
                              <Calendar className="h-3.5 w-3.5 opacity-75 shrink-0" />
                              <span>{dateStr}</span>
                            </span>
                          ) : (
                            <span />
                          )}

                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--ink-primary)] group-hover:translate-x-0.5 transition-transform shrink-0">
                            <span>
                              {isCertificateSection
                                ? lang === "EN"
                                  ? "View Certificate"
                                  : "Xem Chứng Chỉ"
                                : lang === "EN"
                                ? "View Details"
                                : "Xem Chi Tiết"}
                            </span>
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </span>
                        </div>

                        <h3 className="text-[16px] sm:text-[18px] leading-[1.35] font-semibold text-[var(--ink-primary)] break-words">
                          {title}
                        </h3>

                        {desc && (
                          <div className="mt-2 text-[13.5px] sm:text-[14px] leading-[1.64] text-[var(--ink-secondary)] line-clamp-4 whitespace-pre-line flex-1 break-words">
                            <LinkifiedText text={desc} />
                          </div>
                        )}

                        {((item.tags && item.tags.length > 0) || item.links) && (
                          <div className="mt-auto pt-3.5 border-t border-[var(--card-border)] space-y-2.5">
                            {item.tags && item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {item.tags.map((t) => {
                                  const scheme = getTagColorScheme(
                                    t,
                                    tagColorMap
                                  );
                                  return (
                                    <span
                                      key={t}
                                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${scheme.pill}`}
                                    >
                                      {t}
                                    </span>
                                  );
                                })}
                              </div>
                            )}

                            {item.links && (
                              <div className="pt-0.5">
                                <a
                                  href={item.links}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  data-cursor="magnetic"
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--pill-bg)] apple-hairline text-xs font-semibold text-[var(--ink-primary)] hover:opacity-80 transition-opacity"
                                >
                                  <span>
                                    {lang === "EN"
                                      ? "Open Live"
                                      : "Xem Trực Tiếp"}
                                  </span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Tilt3DCard>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  data-cursor="magnetic"
                  className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[var(--pill-bg)] apple-hairline text-[var(--ink-primary)] disabled:opacity-35 cursor-pointer disabled:cursor-default"
                  aria-label={lang === "EN" ? "Previous page" : "Trang trước"}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {buildPageNumbers(currentPage, totalPages).map((entry, i) =>
                  entry === "ellipsis" ? (
                    <span
                      key={`ellipsis-${i}`}
                      className="px-1 text-xs font-semibold text-[var(--ink-meta)]"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={entry}
                      type="button"
                      onClick={() => handlePageChange(entry)}
                      data-cursor="magnetic"
                      className={`h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] px-2.5 sm:px-3 rounded-full text-xs font-semibold tabular-nums transition-all cursor-pointer ${
                        currentPage === entry
                          ? "bg-[var(--ink-primary)] text-[var(--background)]"
                          : "bg-[var(--pill-bg)] apple-hairline text-[var(--ink-meta)] hover:text-[var(--ink-primary)]"
                      }`}
                    >
                      {entry}
                    </button>
                  )
                )}

                <button
                  type="button"
                  onClick={() =>
                    handlePageChange(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  data-cursor="magnetic"
                  className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[var(--pill-bg)] apple-hairline text-[var(--ink-primary)] disabled:opacity-35 cursor-pointer disabled:cursor-default"
                  aria-label={lang === "EN" ? "Next page" : "Trang tiếp"}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Scroll3DSection>
  );
}

export default function PortfolioUI({
  projects: incomingProjects = [],
  profileData: incomingProfile = null,
}: PortfolioUIProps) {
  const [lang, setLang] = useState<"EN" | "VN">("EN");
  const [showcaseLayoutMode, setShowcaseLayoutMode] =
    useState<ShowcaseLayout>("grid");

  const [selectedProjectCategory, setSelectedProjectCategory] = useState<
    string | null
  >(null);
  const [selectedCertCategory, setSelectedCertCategory] = useState<
    string | null
  >(null);
  const [selectedProjectTag, setSelectedProjectTag] = useState<string | null>(
    null
  );
  const [selectedCertTag, setSelectedCertTag] = useState<string | null>(null);
  const [projectSort, setProjectSort] = useState<SortOrder>("newest");
  const [certSort, setCertSort] = useState<SortOrder>("newest");
  const [projectPage, setProjectPage] = useState<number>(1);
  const [certPage, setCertPage] = useState<number>(1);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeSection, setActiveSection] = useState<string>("about");
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const mobileNavRef = useRef<HTMLDivElement | null>(null);
  const isScrolledRef = useRef(false);
  const activeSectionRef = useRef("about");

  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const demoMode = useSyncExternalStore(
    noopSubscribe,
    () =>
      process.env.NODE_ENV === "development" &&
      new URLSearchParams(window.location.search).get("__demo") === "1",
    () => false
  );

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang === "VN" ? "vi" : "en";
    }
  }, [lang]);

  useEffect(() => {
    if (!mobileNavOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      if (
        mobileNavRef.current &&
        e.target instanceof Node &&
        !mobileNavRef.current.contains(e.target)
      ) {
        setMobileNavOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileNavOpen]);

  const projects =
    demoMode && incomingProjects.length === 0
      ? DEV_DEMO_PROJECTS
      : incomingProjects;
  const profileData =
    demoMode && !incomingProfile ? DEV_DEMO_PROFILE : incomingProfile;

  const {
    rawProjects,
    rawCertificates,
    projectTags,
    certTags,
    projectCategories,
    certCategories,
  } = useMemo(() => {
    const feat: Project[] = [];
    const cert: Project[] = [];
    const pTagSet = new Set<string>();
    const cTagSet = new Set<string>();
    const pCatCounts = new Map<string, number>();
    const cCatCounts = new Map<string, number>();

    projects.forEach((item) => {
      const rawCat = (item.category || "").trim();
      const lowerCat = rawCat.toLowerCase();
      if (
        lowerCat.includes("certificate") ||
        lowerCat.includes("chứng chỉ")
      ) {
        cert.push(item);
        if (Array.isArray(item.tags)) item.tags.forEach((t) => cTagSet.add(t));
        if (rawCat && rawCat !== "Uncategorized") {
          cCatCounts.set(rawCat, (cCatCounts.get(rawCat) || 0) + 1);
        }
      } else {
        feat.push(item);
        if (Array.isArray(item.tags)) item.tags.forEach((t) => pTagSet.add(t));
        if (rawCat && rawCat !== "Uncategorized") {
          pCatCounts.set(rawCat, (pCatCounts.get(rawCat) || 0) + 1);
        }
      }
    });

    return {
      rawProjects: feat,
      rawCertificates: cert,
      projectTags: Array.from(pTagSet),
      certTags: Array.from(cTagSet),
      projectCategories: Array.from(pCatCounts.entries()).map(
        ([name, count]) => ({
          name,
          count,
        })
      ),
      certCategories: Array.from(cCatCounts.entries()).map(([name, count]) => ({
        name,
        count,
      })),
    };
  }, [projects]);

  const tagColorMap = useMemo(
    () => buildTagColorMap([...projectTags, ...certTags]),
    [projectTags, certTags]
  );

  const aboutParagraphs = useMemo(() => {
    if (!profileData) return [];
    const raw =
      lang === "VN"
        ? profileData.about_vn || profileData.about_en
        : profileData.about_en || profileData.about_vn;
    return parseParagraphs(raw || "");
  }, [profileData, lang]);

  const parsedSkills = useMemo(() => {
    if (!profileData) return [];
    const raw =
      lang === "VN"
        ? profileData.skills_vn || profileData.skills_en
        : profileData.skills_en || profileData.skills_vn;
    return parseSkills(raw || "");
  }, [profileData, lang]);

  const parsedExperiences = useMemo(() => {
    if (!profileData) return [];
    const raw =
      lang === "VN"
        ? profileData.experience_vn || profileData.experience_en
        : profileData.experience_en || profileData.experience_vn;
    return parseExperiences(raw || "");
  }, [profileData, lang]);

  const parsedEducations = useMemo(() => {
    if (!profileData) return [];
    const raw =
      lang === "VN"
        ? profileData.education_vn || profileData.education_en
        : profileData.education_en || profileData.education_vn;
    return parseEducation(raw || "");
  }, [profileData, lang]);

  const profileName = useMemo(() => {
    return (
      (lang === "VN" ? profileData?.name_vn : profileData?.name_en) ||
      profileData?.name_en ||
      profileData?.name_vn ||
      "Nguyen Chi Thang"
    );
  }, [profileData, lang]);

  const socialLinks = useMemo(() => {
    if (!profileData) return [];
    const links = [];
    if (profileData.github) {
      links.push({
        type: "github",
        label: "GitHub",
        href: profileData.github,
        icon: GithubIcon,
      });
    }
    if (profileData.email) {
      links.push({
        type: "email",
        label: `Email (${profileData.email})`,
        href: `mailto:${profileData.email}`,
        icon: Mail,
      });
    }
    if (profileData.linkedin) {
      links.push({
        type: "linkedin",
        label: "LinkedIn",
        href: profileData.linkedin,
        icon: LinkedinIcon,
      });
    }
    if (profileData.instagram) {
      links.push({
        type: "instagram",
        label: "Instagram",
        href: profileData.instagram,
        icon: InstagramIcon,
      });
    }
    return links;
  }, [profileData]);

  const navSections = useMemo(() => {
    const list: { id: string; label: string; count?: number }[] = [
      { id: "about", label: lang === "EN" ? "About" : "Giới thiệu" },
    ];
    if (parsedExperiences.length > 0) {
      list.push({
        id: "experience",
        label: lang === "EN" ? "Experience" : "Kinh nghiệm",
      });
    }
    if (parsedSkills.length > 0 || projectTags.length > 0) {
      list.push({
        id: "skills",
        label: lang === "EN" ? "Skills" : "Kỹ năng",
      });
    }
    if (parsedEducations.length > 0) {
      list.push({
        id: "education",
        label: lang === "EN" ? "Education" : "Học vấn",
      });
    }
    list.push({
      id: "projects",
      label: lang === "EN" ? "Projects" : "Dự án",
      count: rawProjects.length,
    });
    if (rawCertificates.length > 0) {
      list.push({
        id: "certificates",
        label: lang === "EN" ? "Certificates" : "Chứng chỉ",
        count: rawCertificates.length,
      });
    }
    return list;
  }, [
    lang,
    parsedExperiences.length,
    parsedSkills.length,
    projectTags.length,
    parsedEducations.length,
    rawProjects.length,
    rawCertificates.length,
  ]);

  // Zero-Reflow Scroll-Spy: Caches section offsetTop positions and only updates React state on boundary crossings
  useEffect(() => {
    if (typeof window === "undefined") return;
    let rafId: number | null = null;
    let cachedOffsets: { id: string; top: number }[] = [];

    const measureOffsets = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      cachedOffsets = navSections.map((sec) => {
        const el = document.getElementById(sec.id);
        return {
          id: sec.id,
          top: el ? el.getBoundingClientRect().top + scrollY : 0,
        };
      });
    };

    const evaluateScroll = () => {
      rafId = null;
      const y = window.scrollY || window.pageYOffset || 0;
      const nextScrolled = y > 12;
      if (nextScrolled !== isScrolledRef.current) {
        isScrolledRef.current = nextScrolled;
        setIsScrolled(nextScrolled);
      }

      if (!cachedOffsets.length) measureOffsets();

      const triggerY = y + 150;
      let current = cachedOffsets[0]?.id || "about";
      for (let i = 0; i < cachedOffsets.length; i++) {
        if (cachedOffsets[i].top <= triggerY) {
          current = cachedOffsets[i].id;
        }
      }

      if (current !== activeSectionRef.current) {
        activeSectionRef.current = current;
        setActiveSection(current);
      }
    };

    const onScroll = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(evaluateScroll);
      }
    };

    const onResize = () => {
      measureOffsets();
      onScroll();
    };

    measureOffsets();
    evaluateScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [
    navSections,
    showcaseLayoutMode,
    selectedProjectCategory,
    selectedProjectTag,
    projectPage,
  ]);

  const jumpToSection = useCallback((sectionId: string) => {
    activeSectionRef.current = sectionId;
    setActiveSection(sectionId);
    setMobileNavOpen(false);
    if (sectionId === "about") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = document.getElementById(sectionId);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 68;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    }
  }, []);

  const formatDate = useCallback((dateString: string | null) => {
    if (!dateString) return "";
    const parts = dateString.split("-");
    if (parts.length !== 3) return dateString;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }, []);

  const formatDateRangeString = useCallback(
    (dateRange: Project["project_date"]): string | null => {
      if (!dateRange || !dateRange.start) return null;
      const s = formatDate(dateRange.start);
      const e = dateRange.end ? formatDate(dateRange.end) : null;
      return e ? `${s} – ${e}` : s;
    },
    [formatDate]
  );

  const formatYearOrDate = useCallback((item: Project): string => {
    if (item.project_date?.start) {
      return item.project_date.start.slice(0, 4);
    }
    if (item.last_edited_time) {
      const d = new Date(item.last_edited_time);
      if (!isNaN(d.getFullYear())) return String(d.getFullYear());
    }
    return "";
  }, []);

  const renderLinkified = useCallback(
    (text: string, className?: string) => (
      <LinkifiedText text={text} className={className} />
    ),
    []
  );

  const footerEmailMagnetic = useMagneticHandlers(4);

  const activeTypingRole = profileData
    ? (lang === "VN" ? profileData.role_vn : profileData.role_en) ||
      profileData.role_en ||
      profileData.role_vn ||
      ""
    : "";
  const activeTypingBio = profileData
    ? (lang === "VN" ? profileData.bio_vn : profileData.bio_en) ||
      profileData.bio_en ||
      profileData.bio_vn ||
      ""
    : "";

  const activeNavEntry =
    navSections.find((s) => s.id === activeSection) || navSections[0];

  return (
    <div className="relative min-h-screen flex flex-col text-[var(--foreground)]">
      <AmbientBackdrop />
      <CustomCursor />

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Borderless Symmetrical Sticky Header */}
        <header
          className={`sticky top-0 z-40 w-full border-0 shadow-none transition-[background-color,padding] duration-200 ${
            isScrolled
              ? "py-2 md:py-2.5 apple-header-scrim"
              : "pt-2.5 sm:pt-4 pb-2 bg-transparent"
          }`}
        >
          <div className="apple-shell">
            <div
              ref={mobileNavRef}
              className="relative mx-auto flex w-full max-w-[1040px] items-center justify-between md:justify-center gap-2 md:gap-3"
            >
              {/* MOBILE & COMPACT VIEWPORTS (< 768px) */}
              <div className="md:hidden flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => setMobileNavOpen((prev) => !prev)}
                  aria-expanded={mobileNavOpen}
                  aria-haspopup="menu"
                  aria-label={
                    lang === "EN" ? "Navigation menu" : "Menu điều hướng"
                  }
                  className="flex h-9 w-full items-center justify-between gap-2 px-3 rounded-[11px] bg-[var(--pill-bg)] apple-hairline text-[12.5px] font-semibold text-[var(--ink-primary)] cursor-pointer"
                >
                  <span className="inline-flex items-center gap-2 min-w-0 truncate">
                    <Menu className="h-3.5 w-3.5 shrink-0 text-[var(--ink-meta)]" />
                    <span className="truncate">{activeNavEntry?.label}</span>
                    {typeof activeNavEntry?.count === "number" && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] tabular-nums bg-[var(--pill-active-bg)] text-[var(--ink-meta)] shrink-0">
                        {activeNavEntry.count}
                      </span>
                    )}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 text-[var(--ink-meta)] transition-transform duration-200 ${
                      mobileNavOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {mobileNavOpen && (
                    <motion.nav
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                      aria-label={
                        lang === "EN"
                          ? "Portfolio mobile navigation"
                          : "Điều hướng trên điện thoại"
                      }
                      className="absolute left-0 right-0 top-[calc(100%+0.45rem)] z-50 grid grid-cols-2 gap-1.5 p-2 rounded-[16px] apple-glass"
                    >
                      {navSections.map((sec) => {
                        const active = activeSection === sec.id;
                        return (
                          <button
                            key={sec.id}
                            type="button"
                            onClick={() => jumpToSection(sec.id)}
                            className={`flex items-center justify-between gap-1.5 h-9 px-3 rounded-[10px] text-[12.5px] font-semibold transition-colors cursor-pointer ${
                              active
                                ? "bg-[var(--pill-active-bg)] text-[var(--ink-primary)] shadow-2xs"
                                : "text-[var(--ink-secondary)] hover:bg-[var(--row-hover-bg)] hover:text-[var(--ink-primary)]"
                            }`}
                          >
                            <span className="truncate">{sec.label}</span>
                            {typeof sec.count === "number" && (
                              <span className="px-1.5 py-0.2 rounded-full text-[10px] tabular-nums bg-[var(--pill-bg)] text-[var(--ink-meta)] shrink-0">
                                {sec.count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </motion.nav>
                  )}
                </AnimatePresence>
              </div>

              {/* DESKTOP & TABLET (>= 768px) */}
              <nav
                aria-label={
                  lang === "EN" ? "Portfolio navigation" : "Điều hướng trang"
                }
                className="hidden md:flex items-center justify-center gap-0.5 p-1 h-10 rounded-[12px] bg-[var(--pill-bg)] apple-hairline max-w-full overflow-x-auto hide-scrollbar"
              >
                {navSections.map((sec) => (
                  <NavPillButton
                    key={sec.id}
                    active={activeSection === sec.id}
                    count={sec.count}
                    onClick={() => jumpToSection(sec.id)}
                  >
                    {sec.label}
                  </NavPillButton>
                ))}
              </nav>

              {/* Dual Language Toggle (EN | VN) */}
              <div
                role="group"
                aria-label={
                  lang === "EN" ? "Select language" : "Chọn ngôn ngữ"
                }
                className="inline-flex h-9 md:h-10 items-center gap-0.5 p-1 rounded-[11px] md:rounded-[12px] bg-[var(--pill-bg)] apple-hairline shrink-0"
              >
                {(["EN", "VN"] as const).map((code) => {
                  const active = lang === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setLang(code)}
                      aria-pressed={active}
                      data-cursor="magnetic"
                      className={`h-7 md:h-8 min-w-[30px] md:min-w-[34px] px-2 md:px-2.5 rounded-[8px] text-[11px] md:text-[11.5px] font-bold tracking-wider transition-all cursor-pointer ${
                        active
                          ? "bg-[var(--pill-active-bg)] text-[var(--ink-primary)] shadow-2xs"
                          : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                      }`}
                    >
                      {code}
                    </button>
                  );
                })}
              </div>

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={() =>
                  setTheme(resolvedTheme === "dark" ? "light" : "dark")
                }
                data-cursor="magnetic"
                className="inline-flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-[11px] md:rounded-[12px] bg-[var(--pill-bg)] apple-hairline text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:scale-[1.04] transition-all shrink-0 cursor-pointer"
                aria-label={
                  lang === "EN"
                    ? "Toggle color theme"
                    : "Đổi giao diện sáng/tối"
                }
              >
                {mounted ? (
                  resolvedTheme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )
                ) : (
                  <span className="h-4 w-4 rounded-full bg-[var(--ink-decorative)] opacity-30" />
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col pb-10">
          <MoreInfoView
            lang={lang}
            profileName={profileName}
            profileData={profileData}
            aboutParagraphs={aboutParagraphs}
            parsedExperiences={parsedExperiences}
            parsedSkills={parsedSkills}
            parsedEducations={parsedEducations}
            projectTags={projectTags}
            tagColorMap={tagColorMap}
            socialLinks={socialLinks}
            formatDate={formatDate}
            renderLinkifiedText={renderLinkified}
            renderTypingSubtitle={() =>
              profileData ? (
                <TerminalTyping
                  key={`${lang}-${activeTypingRole}-${activeTypingBio}`}
                  role={activeTypingRole}
                  bio={activeTypingBio}
                />
              ) : null
            }
          />

          <ShowcaseSectionBlock
            sectionId="projects"
            headingEn="Projects"
            headingVn="Dự án nổi bật"
            lang={lang}
            rawItems={rawProjects}
            categories={projectCategories}
            tags={projectTags}
            tagColorMap={tagColorMap}
            layoutMode={showcaseLayoutMode}
            onLayoutModeChange={setShowcaseLayoutMode}
            sortOrder={projectSort}
            onSortOrderChange={setProjectSort}
            selectedCategory={selectedProjectCategory}
            onSelectCategory={setSelectedProjectCategory}
            selectedTag={selectedProjectTag}
            onSelectTag={setSelectedProjectTag}
            page={projectPage}
            onPageChange={setProjectPage}
            onSelectProject={setSelectedProject}
            formatDateRangeString={formatDateRangeString}
            formatYearOrDate={formatYearOrDate}
            renderLinkified={renderLinkified}
          />

          {rawCertificates.length > 0 && (
            <ShowcaseSectionBlock
              sectionId="certificates"
              headingEn="Certificates & Accreditations"
              headingVn="Chứng chỉ & Thành tựu"
              isCertificateSection
              lang={lang}
              rawItems={rawCertificates}
              categories={certCategories}
              tags={certTags}
              tagColorMap={tagColorMap}
              layoutMode={showcaseLayoutMode}
              onLayoutModeChange={setShowcaseLayoutMode}
              sortOrder={certSort}
              onSortOrderChange={setCertSort}
              selectedCategory={selectedCertCategory}
              onSelectCategory={setSelectedCertCategory}
              selectedTag={selectedCertTag}
              onSelectTag={setSelectedCertTag}
              page={certPage}
              onPageChange={setCertPage}
              onSelectProject={setSelectedProject}
              formatDateRangeString={formatDateRangeString}
              formatYearOrDate={formatYearOrDate}
              renderLinkified={renderLinkified}
            />
          )}
        </main>

        <footer className="w-full mt-auto pt-4 pb-6 text-[12px]">
          <div className="apple-shell">
            <div className="mx-auto max-w-[1040px] pt-4 border-t border-[var(--card-border)] flex flex-col md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
              <nav
                aria-label="Social links"
                className="flex flex-wrap items-center justify-center md:justify-start gap-3"
              >
                {socialLinks.map((s) => {
                  const Icon = s.icon;
                  const isMail =
                    s.type === "email" || s.href.startsWith("mailto:");
                  return (
                    <a
                      key={s.type}
                      href={s.href}
                      target={isMail ? undefined : "_blank"}
                      rel={isMail ? undefined : "noopener noreferrer"}
                      aria-label={s.label}
                      title={s.label}
                      data-cursor="magnetic"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--ink-meta)] hover:text-[var(--ink-primary)] hover:bg-[var(--pill-bg)] transition-colors"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </nav>

              <p className="text-[var(--ink-muted)] text-center">
                © {new Date().getFullYear()} {profileName} Portfolio
              </p>

              <div className="flex items-center justify-center md:justify-end">
                {profileData?.email && (
                  <a
                    href={`mailto:${profileData.email}`}
                    onPointerEnter={footerEmailMagnetic.onPointerEnter}
                    onPointerMove={footerEmailMagnetic.onPointerMove}
                    onPointerLeave={footerEmailMagnetic.onPointerLeave}
                    data-cursor="magnetic"
                    className="magnetic-target text-[var(--ink-meta)] hover:text-[var(--ink-primary)] transition-colors break-all text-center"
                  >
                    {profileData.email}
                  </a>
                )}
              </div>
            </div>
          </div>
        </footer>
      </div>

      <ProjectDetailModal
        project={selectedProject}
        lang={lang}
        tagColorMap={tagColorMap}
        onClose={() => setSelectedProject(null)}
        formatDateRange={formatDateRangeString}
        renderLinkifiedText={renderLinkified}
      />
    </div>
  );
}
