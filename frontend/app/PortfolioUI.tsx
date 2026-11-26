"use client";

import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
  useSyncExternalStore,
} from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Calendar,
  Camera,
  ExternalLink,
  FolderKanban,
  Mail,
  ArrowLeft,
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
} from "lucide-react";

import CustomCursor from "./components/CustomCursor";
import { useMagneticHandlers } from "./components/Magnetic";
import ShowcaseCarousel from "./components/ShowcaseCarousel";
import MoreInfoView from "./components/MoreInfoView";
import ProjectDetailModal from "./components/ProjectDetailModal";

const noopSubscribe = () => () => {};

function subscribeReducedMotion(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getReducedMotionSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
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
const PAUSE_TIME = 2400;
const GAP_TIME = 280;

function splitPhrases(text: string): string[] {
  if (!text) return [];
  return text
    .split(/\n+|\||(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function TerminalTyping({ role, bio }: { role: string; bio: string }) {
  const items = useMemo(() => {
    const roleItems = role ? splitPhrases(role) : [];
    const bioItems = bio ? splitPhrases(bio) : [];
    return [...roleItems, ...bioItems].filter(Boolean);
  }, [role, bio]);

  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    () => false
  );

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
      } else {
        const timeout = setTimeout(() => {
          setIsDeleting(true);
        }, PAUSE_TIME);
        return () => clearTimeout(timeout);
      }
    } else {
      if (displayText.length > 0) {
        const timeout = setTimeout(() => {
          setDisplayText(currentItem.slice(0, displayText.length - 1));
        }, DELETING_SPEED);
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => {
          setIsDeleting(false);
          setItemIdx((prev) => (prev + 1) % items.length);
        }, GAP_TIME);
        return () => clearTimeout(timeout);
      }
    }
  }, [displayText, isDeleting, itemIdx, items, reducedMotion]);

  if (!items.length) return null;

  return (
    <div className="w-full min-h-[1.85rem] py-[0.12em]">
      <p className="text-[16px] sm:text-[18px] font-normal text-[var(--ink-meta)] leading-[1.55]">
        <span>{reducedMotion ? items.join(" · ") : displayText}</span>
        {!reducedMotion && (
          <span
            aria-hidden="true"
            className="inline-block w-[1.5px] h-[1.05em] align-middle bg-[var(--ink-meta)] ml-1 animate-pulse"
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
type ActiveView = "showcase" | "more-info";
type ShowcaseLayout = "stage" | "grid";
type MacroTab = "projects" | "certificates";

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
      } else if (/\b(20\d\d|19\d\d|graduat|tốt nghiệp|present|hiện tại)\b/i.test(p)) {
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
const INITIAL_VISIBLE_TAGS = 12;

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

const DEV_DEMO_PROFILE: ProfileData = {
  name_en: "Nguyen Chi Thang",
  name_vn: "Nguyễn Chí Thắng",
  role_en: "AI Application Engineer | Solo Builder & Product Architect",
  role_vn: "Kỹ Sư Ứng Dụng AI | Kiến Trúc Sư Sản Phẩm Độc Lập",
  bio_en: "Designing intelligent LLM workflows, computer vision systems, and minimalist software.",
  bio_vn: "Thiết kế hệ thống tự động hóa LLM, thị giác máy tính và phần mềm tối giản chuẩn quốc tế.",
  about_en:
    "I build end-to-end AI applications, autonomous agent workflows, and crisp user interfaces that feel effortless to use.\n\nMy work bridges Notion CMS pipelines, multimodal LLMs, and high-craft web engineering—turning complex backend orchestration into calm, tactile product experiences.",
  about_vn:
    "Mình xây dựng các ứng dụng AI toàn trình, hệ thống tác tử tự hành và giao diện người dùng tối giản, mượt mà đến từng chuyển động.\n\nCác dự án kết hợp sức mạnh của Notion CMS, mô hình ngôn ngữ lớn đa phương thức và kỹ thuật web hiện đại để biến những luồng xử lý phức tạp thành trải nghiệm tinh gọn nhất.",
  skills_en:
    "AI & Agents: LLMs, Computer Vision, OpenRouter, RAG, Prompt Engineering\nFrontend: Next.js 16, React 19, TypeScript, Tailwind CSS, Framer Motion\nBackend & Ops: Python, Node.js, Notion API, GitHub Actions, Docker",
  skills_vn:
    "AI & Tác tử: LLMs, Thị giác máy tính, OpenRouter, RAG, Prompt Engineering\nGiao diện: Next.js 16, React 19, TypeScript, Tailwind CSS, Framer Motion\nHệ thống: Python, Node.js, Notion API, GitHub Actions, Docker",
  experience_en:
    "AI Engineering Lab | AI Engineer Intern | 2026 - Present | Featured\n- Built LLM & Computer Vision optimization pipelines reducing inference latency by 38%\n- Designed automated bilingual content orchestration with zero-token idle overhead\nIndependent Studio | Solo Founder & Builder | 2024 - 2026\n- Shipped full-stack developer tools and Notion-synced web applications",
  experience_vn:
    "Phòng Nghiên Cứu AI | Thực Tập Sinh Kỹ Sư AI | 2026 - Hiện tại | Nổi bật\n- Xây dựng luồng tối ưu hóa LLM & Thị giác máy tính giúp giảm 38% độ trễ suy luận\n- Thiết kế kiến trúc đồng bộ nội dung song ngữ tự động hoàn toàn qua GitHub Actions\nIndependent Studio | Nhà Sáng Lập Độc Lập | 2024 - 2026\n- Phát triển công cụ cho lập trình viên và nền tảng web đồng bộ trực tiếp với Notion",
  education_en: "Ly Tu Trong College | Information Technology | Specialized in AI & Software Engineering | 2022 - 2027",
  education_vn: "Cao đẳng Lý Tự Trọng | Công nghệ Thông tin | Chuyên sâu AI & Kỹ thuật Phần mềm | 2022 - 2027",
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
    title_en: "Portfolio AI Automation CMS",
    title_vn: "Hệ Thống CMS Portfolio Tự Động Hóa AI",
    desc_en:
      "Serverless bridge between Notion CMS and OpenRouter LLMs with context-aware bilingual translation and instant ISR publishing. https://github.com/CThawngs/Portfolio",
    desc_vn:
      "Cầu nối serverless giữa Notion CMS và OpenRouter LLM giúp dịch thuật song ngữ tự động chuẩn ngữ cảnh kỹ thuật số. https://github.com/CThawngs/Portfolio",
    category: "AI Systems",
    links: "https://github.com/CThawngs/Portfolio",
    images: ["/Portfolio Publish One Click.gif"],
    tags: ["Next.js", "Notion API", "Python", "OpenRouter", "Tailwind CSS"],
    project_date: { start: "2026-09-01", end: null },
  },
  {
    id: "demo-2",
    status: "Published",
    title_en: "Context-Aware Translation Engine",
    title_vn: "Bộ Máy Dịch Thuật Nhận Thức Ngữ Cảnh",
    desc_en:
      "Zero-idle-token hourly pipeline preserving software engineering terminology across English and Vietnamese.",
    desc_vn:
      "Luồng dịch thuật định kỳ tiết kiệm tối đa token và giữ nguyên chuẩn xác thuật ngữ chuyên ngành phần mềm.",
    category: "AI Systems",
    links: "https://github.com/CThawngs/Portfolio",
    images: ["/Portfolio Translate Automation.gif"],
    tags: ["LLM", "GitHub Actions", "Automation", "Python"],
    project_date: { start: "2026-06-15", end: "2026-08-20" },
  },
  {
    id: "demo-3",
    status: "Published",
    title_en: "Disk Cleaner MCP & Lifecycle Controller",
    title_vn: "Công Cụ Dọn Đĩa MCP & Điều Khiển Lưu Trữ Tự Động",
    desc_en:
      "AI-powered Model Context Protocol server for safe workspace analysis, duplicate detection, and instant archival revalidation.",
    desc_vn:
      "Máy chủ Model Context Protocol tích hợp AI phân tích dung lượng ổ đĩa, phát hiện trùng lặp và làm mới bộ nhớ đệm tức thì.",
    category: "Developer Tools",
    links: "https://github.com/CThawngs",
    images: ["/Portfolio Archive.gif"],
    tags: ["TypeScript", "MCP", "Edge ISR", "REST API", "Node.js"],
    project_date: { start: "2026-03-10", end: "2026-05-01" },
  },
  {
    id: "demo-cert-1",
    status: "Published",
    title_en: "AI Riser Vietnam 2026 (Google Hackathon) — Top 200 Teams",
    title_vn: "AI Riser Vietnam 2026 (Google Hackathon) — Top 200 Đội Xuất Sắc",
    desc_en:
      "Selected among the top 200 teams nationwide in Google's AI Riser Vietnam 2026 Hackathon for building practical Generative AI agent workflows.",
    desc_vn:
      "Lọt Top 200 đội thi xuất sắc toàn quốc tại cuộc thi AI Riser Vietnam 2026 do Google tổ chức với giải pháp tác tử AI tạo sinh thực tiễn.",
    category: "Certificate",
    links: "https://google.com",
    images: [],
    tags: ["Google", "Generative AI", "Hackathon", "AI Agents"],
    project_date: { start: "2026-05-12", end: null },
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

function MagneticTabButton({
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
  const { onPointerMove, onPointerLeave } = useMagneticHandlers(6, active);

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => onClick()}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      data-cursor="magnetic"
      className={`magnetic-target relative shrink-0 inline-flex items-center gap-1.5 h-8 px-3.5 rounded-[9px] text-[13.5px] font-semibold transition-all cursor-pointer ${
        active
          ? "bg-[var(--pill-active-bg)] text-[var(--ink-primary)] shadow-2xs cursor-default"
          : "bg-transparent text-[var(--ink-meta)] hover:text-[var(--ink-primary)]"
      }`}
    >
      <span>{children}</span>
      {typeof count === "number" && (
        <span
          className={`px-1.5 py-0.2 rounded-full text-[11px] tabular-nums ${
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

function buildPageNumbers(current: number, total: number): (number | "ellipsis")[] {
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

export default function PortfolioUI({
  projects: incomingProjects = [],
  profileData: incomingProfile = null,
}: PortfolioUIProps) {
  const [lang, setLang] = useState<"EN" | "VN">("EN");
  const [activeView, setActiveView] = useState<ActiveView>("showcase");
  const [macroTab, setMacroTab] = useState<MacroTab>("projects");
  const [selectedProjectCategory, setSelectedProjectCategory] = useState<string | null>(null);
  const [selectedCertCategory, setSelectedCertCategory] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState<ShowcaseLayout>("stage");
  const [showAllTags, setShowAllTags] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [selectedProjectTag, setSelectedProjectTag] = useState<string | null>(null);
  const [selectedCertTag, setSelectedCertTag] = useState<string | null>(null);
  const [projectSort, setProjectSort] = useState<SortOrder>("newest");
  const [certSort, setCertSort] = useState<SortOrder>("newest");
  const [projectPage, setProjectPage] = useState<number>(1);
  const [certPage, setCertPage] = useState<number>(1);

  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const demoMode = useSyncExternalStore(
    noopSubscribe,
    () =>
      process.env.NODE_ENV === "development" &&
      new URLSearchParams(window.location.search).get("__demo") === "1",
    () => false
  );

  const [vnTime, setVnTime] = useState<string>("");
  const pageWrapperRef = useRef<HTMLDivElement | null>(null);
  const gridTopRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const syncFromLocation = () => {
      setActiveView(window.location.hash === "#more-info" ? "more-info" : "showcase");
    };

    const rafId = requestAnimationFrame(syncFromLocation);
    window.addEventListener("hashchange", syncFromLocation);
    window.addEventListener("popstate", syncFromLocation);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("hashchange", syncFromLocation);
      window.removeEventListener("popstate", syncFromLocation);
    };
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang === "VN" ? "vi" : "en";
    }
  }, [lang]);

  useEffect(() => {
    const updateClock = () => {
      try {
        const now = new Date();
        const timeStr = now.toLocaleString("en-US", {
          timeZone: "Asia/Ho_Chi_Minh",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        setVnTime(`${timeStr} • ${lang === "VN" ? "Việt Nam" : "Vietnam"}`);
      } catch {
        setVnTime("");
      }
    };

    const rafId = requestAnimationFrame(updateClock);
    const timer = setInterval(updateClock, 1000);
    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(timer);
    };
  }, [lang]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const motionOk = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
    if (!finePointer || !motionOk) return;

    let overscrollY = 0;
    let snapRaf: number | null = null;
    let dragState: { startY: number; startScrollY: number; dragging: boolean } | null = null;

    const applyOverscroll = (val: number) => {
      overscrollY = val;
      const el = pageWrapperRef.current;
      if (el) {
        el.style.transform = Math.abs(val) > 0.4 ? `translate3d(0, ${val.toFixed(1)}px, 0)` : "";
      }
    };

    const rubberBand = (over: number, dim: number) =>
      Math.sign(over) * dim * (1 - 1 / ((Math.abs(over) * 0.18) / dim + 1));

    const springBack = () => {
      if (snapRaf) cancelAnimationFrame(snapRaf);
      let pos = overscrollY;
      let vel = 0;
      const stiffness = 170;
      const damping = 2 * Math.sqrt(stiffness);
      const dt = 1 / 60;

      const step = () => {
        const accel = -stiffness * pos - damping * vel;
        vel += accel * dt;
        pos += vel * dt;
        if (Math.abs(pos) < 0.5 && Math.abs(vel) < 4) {
          applyOverscroll(0);
          snapRaf = null;
          return;
        }
        applyOverscroll(pos);
        snapRaf = requestAnimationFrame(step);
      };
      snapRaf = requestAnimationFrame(step);
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const t = e.target as HTMLElement | null;
      if (
        !t ||
        t.closest(
          "a, button, input, textarea, select, [role='dialog'], [aria-roledescription='carousel']"
        )
      ) {
        return;
      }
      if (snapRaf) {
        cancelAnimationFrame(snapRaf);
        snapRaf = null;
      }
      dragState = {
        startY: e.clientY,
        startScrollY: window.scrollY,
        dragging: false,
      };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!dragState) return;
      const dy = e.clientY - dragState.startY;
      if (!dragState.dragging && Math.abs(dy) > 10) {
        dragState.dragging = true;
        document.body.classList.add("is-dragging");
      }
      if (dragState.dragging) {
        const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        const targetY = dragState.startScrollY - dy;
        if (targetY < 0) {
          window.scrollTo(0, 0);
          applyOverscroll(rubberBand(-targetY, window.innerHeight));
        } else if (targetY > maxScroll) {
          window.scrollTo(0, maxScroll);
          applyOverscroll(-rubberBand(targetY - maxScroll, window.innerHeight));
        } else {
          if (overscrollY !== 0) applyOverscroll(0);
          window.scrollTo(0, targetY);
        }
      }
    };

    const onMouseUp = () => {
      if (!dragState) return;
      if (dragState.dragging) {
        document.body.classList.remove("is-dragging");
        if (overscrollY !== 0) springBack();
      }
      dragState = null;
    };

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      if (snapRaf) cancelAnimationFrame(snapRaf);
      document.body.classList.remove("is-dragging");
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const projects = demoMode && incomingProjects.length === 0 ? DEV_DEMO_PROJECTS : incomingProjects;
  const profileData = demoMode && !incomingProfile ? DEV_DEMO_PROFILE : incomingProfile;

  const switchView = useCallback((next: ActiveView) => {
    setActiveView(next);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      const nextUrl =
        next === "more-info"
          ? `${window.location.pathname}${window.location.search}#more-info`
          : `${window.location.pathname}${window.location.search}`;
      window.history.pushState({ view: next }, "", nextUrl);
    }
  }, []);

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
      if (lowerCat.includes("certificate") || lowerCat.includes("chứng chỉ")) {
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
      projectCategories: Array.from(pCatCounts.entries()).map(([name, count]) => ({
        name,
        count,
      })),
      certCategories: Array.from(cCatCounts.entries()).map(([name, count]) => ({
        name,
        count,
      })),
    };
  }, [projects]);

  const aboutParagraphs = useMemo(() => {
    if (!profileData) return [];
    const raw =
      lang === "VN"
        ? profileData.about_vn || profileData.about_en
        : profileData.about_en || profileData.about_vn;
    const paras = parseParagraphs(raw || "");
    if (paras.length > 0) return paras;
    const fallbackBio =
      lang === "VN"
        ? profileData.bio_vn || profileData.bio_en
        : profileData.bio_en || profileData.bio_vn;
    return fallbackBio ? [cleanText(fallbackBio)] : [];
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

  const profileRole = useMemo(() => {
    const raw =
      (lang === "VN" ? profileData?.role_vn : profileData?.role_en) ||
      profileData?.role_en ||
      profileData?.role_vn ||
      "";
    return splitPhrases(raw)[0] || "";
  }, [profileData, lang]);

  const socialLinks = useMemo(() => {
    if (!profileData) return [];
    const links = [];
    if (profileData.email) {
      links.push({
        type: "email",
        label: profileData.email,
        href: `mailto:${profileData.email}`,
        icon: Mail,
      });
    }
    if (profileData.github) {
      links.push({
        type: "github",
        label: "GitHub",
        href: profileData.github,
        icon: GithubIcon,
      });
    }
    if (profileData.linkedin) {
      links.push({
        type: "linkedin",
        label: "LinkedIn",
        href: profileData.linkedin,
        icon: Briefcase,
      });
    }
    if (profileData.instagram) {
      links.push({
        type: "instagram",
        label: "Instagram",
        href: profileData.instagram,
        icon: Camera,
      });
    }
    return links;
  }, [profileData]);

  const showcaseTabs = useMemo(() => {
    const tabs: { id: MacroTab; label: string; count: number }[] = [
      {
        id: "projects",
        label: lang === "EN" ? "Projects" : "Dự án",
        count: rawProjects.length,
      },
    ];
    if (rawCertificates.length > 0) {
      tabs.push({
        id: "certificates",
        label: lang === "EN" ? "Certificates" : "Chứng chỉ",
        count: rawCertificates.length,
      });
    }
    return tabs;
  }, [rawProjects.length, rawCertificates.length, lang]);

  const effectiveMacroTab: MacroTab =
    macroTab === "certificates" && rawCertificates.length > 0 ? "certificates" : "projects";
  const isCertTab = effectiveMacroTab === "certificates";

  const activeProjectCategory = useMemo(
    () =>
      selectedProjectCategory &&
      projectCategories.some((c) => c.name === selectedProjectCategory)
        ? selectedProjectCategory
        : null,
    [selectedProjectCategory, projectCategories]
  );

  const activeCertCategory = useMemo(
    () =>
      selectedCertCategory &&
      certCategories.some((c) => c.name === selectedCertCategory)
        ? selectedCertCategory
        : null,
    [selectedCertCategory, certCategories]
  );

  const activeProjectPool = useMemo(() => {
    let base = rawProjects;
    if (activeProjectCategory) {
      base = base.filter((p) => p.category === activeProjectCategory);
    }
    if (selectedProjectTag) {
      base = base.filter((p) => p.tags && p.tags.includes(selectedProjectTag));
    }
    return [...base].sort((a, b) => {
      const tA = getTimeValue(a);
      const tB = getTimeValue(b);
      return projectSort === "newest" ? tB - tA : tA - tB;
    });
  }, [rawProjects, activeProjectCategory, selectedProjectTag, projectSort]);

  const activeCertPool = useMemo(() => {
    let base = rawCertificates;
    if (activeCertCategory) {
      base = base.filter((c) => c.category === activeCertCategory);
    }
    if (selectedCertTag) {
      base = base.filter((c) => c.tags && c.tags.includes(selectedCertTag));
    }
    return [...base].sort((a, b) => {
      const tA = getTimeValue(a);
      const tB = getTimeValue(b);
      return certSort === "newest" ? tB - tA : tA - tB;
    });
  }, [rawCertificates, activeCertCategory, selectedCertTag, certSort]);

  const currentItems = isCertTab ? activeCertPool : activeProjectPool;
  const currentCategories = isCertTab ? certCategories : projectCategories;
  const currentSelectedCategory = isCertTab ? activeCertCategory : activeProjectCategory;
  const currentTags = isCertTab ? certTags : projectTags;
  const currentSelectedTag = isCertTab ? selectedCertTag : selectedProjectTag;
  const currentSort = isCertTab ? certSort : projectSort;
  const rawPage = isCertTab ? certPage : projectPage;
  const totalPages = Math.max(1, Math.ceil(currentItems.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(rawPage, totalPages);

  const paginatedGridItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return currentItems.slice(start, start + ITEMS_PER_PAGE);
  }, [currentItems, currentPage]);

  const visibleTags = useMemo(() => {
    if (showAllTags || currentTags.length <= INITIAL_VISIBLE_TAGS) {
      return currentTags;
    }
    const base = currentTags.slice(0, INITIAL_VISIBLE_TAGS);
    if (currentSelectedTag && !base.includes(currentSelectedTag)) {
      return [...base, currentSelectedTag];
    }
    return base;
  }, [currentTags, showAllTags, currentSelectedTag]);

  const changePage = useCallback(
    (nextPage: number) => {
      if (isCertTab) {
        setCertPage(nextPage);
      } else {
        setProjectPage(nextPage);
      }
      if (gridTopRef.current) {
        const y = gridTopRef.current.getBoundingClientRect().top + window.scrollY - 20;
        window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
      }
    },
    [isCertTab]
  );

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

  const navLeftMagnetic = useMagneticHandlers(6);
  const navRightMagnetic = useMagneticHandlers(6);
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

  const hasCenterTabs = activeView === "showcase" && showcaseTabs.length > 0;
  const showCategoryPills = isCertTab
    ? currentCategories.length > 1
    : currentCategories.length >= 1;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] selection:bg-[#FFD433] selection:text-black">
      <CustomCursor />

      <div ref={pageWrapperRef} className="flex-1 flex flex-col will-change-transform">
        {/* Symmetric Top Header with Unified Margin Rails */}
        <header className="relative z-40 w-full pt-4 sm:pt-5 pb-2">
          <div className="apple-shell">
            <div
              className={
                hasCenterTabs
                  ? "flex items-center justify-between gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-4"
                  : "flex items-center justify-between gap-3"
              }
            >
              {/* Left Zone: Brand or Back to Showcase */}
              <div className="flex items-center min-w-0 lg:justify-self-start">
                {activeView === "more-info" ? (
                  <button
                    type="button"
                    onClick={() => switchView("showcase")}
                    onPointerMove={navLeftMagnetic.onPointerMove}
                    onPointerLeave={navLeftMagnetic.onPointerLeave}
                    data-cursor="magnetic"
                    className="magnetic-target inline-flex h-9 sm:h-10 items-center gap-1.5 px-3.5 rounded-[12px] bg-[var(--pill-bg)] apple-hairline text-[13.5px] sm:text-[14px] font-semibold text-[var(--ink-primary)] hover:opacity-80 hover:scale-[1.03] transition-all cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>{lang === "EN" ? "Portfolio" : "Trang chủ"}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMacroTab("projects");
                      setSelectedProjectCategory(null);
                      setSelectedProjectTag(null);
                      setProjectPage(1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    onPointerMove={navLeftMagnetic.onPointerMove}
                    onPointerLeave={navLeftMagnetic.onPointerLeave}
                    data-cursor="magnetic"
                    className="magnetic-target inline-flex h-10 items-center gap-2.5 text-left min-w-0 cursor-pointer group"
                  >
                    <span className="text-[15px] sm:text-[16px] font-semibold tracking-[-0.01em] text-[var(--ink-primary)] group-hover:opacity-70 transition-opacity truncate">
                      {profileName}
                    </span>
                    {profileRole && (
                      <span className="hidden 2xl:inline text-[13.5px] font-normal text-[var(--ink-meta)] truncate max-w-[230px]">
                        {profileRole}
                      </span>
                    )}
                  </button>
                )}
              </div>

              {/* Center Zone (Desktop >= 1024px): True Optical Center Segmented Bar */}
              {hasCenterTabs && (
                <nav
                  role="tablist"
                  aria-label={lang === "EN" ? "Portfolio sections" : "Phân mục hồ sơ"}
                  className="hidden lg:inline-flex lg:justify-self-center items-center gap-1 p-1 h-10 rounded-[12px] bg-[var(--pill-bg)] apple-hairline max-w-full overflow-x-auto hide-scrollbar"
                >
                  {showcaseTabs.map((tab) => (
                    <MagneticTabButton
                      key={tab.id}
                      active={effectiveMacroTab === tab.id}
                      count={tab.count}
                      onClick={() => setMacroTab(tab.id)}
                    >
                      {tab.label}
                    </MagneticTabButton>
                  ))}
                </nav>
              )}

              {/* Right Zone: Uniform 40px Utility Controls */}
              <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0 lg:justify-self-end">
                {activeView === "more-info" && mounted && vnTime && (
                  <span className="hidden md:inline text-[13.5px] font-normal tabular-nums text-[var(--ink-muted)] mr-1.5">
                    {vnTime}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setLang((prev) => (prev === "EN" ? "VN" : "EN"))}
                  data-cursor="magnetic"
                  className="inline-flex h-9 sm:h-10 min-w-[42px] sm:min-w-[46px] items-center justify-center px-2.5 sm:px-3 rounded-[11px] sm:rounded-[12px] bg-[var(--pill-bg)] apple-hairline text-[12px] font-bold tracking-wider text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:scale-[1.04] transition-all cursor-pointer"
                  aria-label={lang === "EN" ? "Switch to Vietnamese" : "Chuyển sang tiếng Anh"}
                >
                  {lang}
                </button>

                <button
                  type="button"
                  onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                  data-cursor="magnetic"
                  className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-[11px] sm:rounded-[12px] bg-[var(--pill-bg)] apple-hairline text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:scale-[1.04] transition-all cursor-pointer"
                  aria-label={lang === "EN" ? "Toggle color theme" : "Đổi giao diện sáng/tối"}
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

                {activeView === "showcase" && (
                  <button
                    type="button"
                    onClick={() => switchView("more-info")}
                    onPointerMove={navRightMagnetic.onPointerMove}
                    onPointerLeave={navRightMagnetic.onPointerLeave}
                    data-cursor="magnetic"
                    className="magnetic-target inline-flex h-9 sm:h-10 items-center gap-1.5 px-3 sm:px-3.5 rounded-[11px] sm:rounded-[12px] bg-[var(--pill-bg)] apple-hairline text-[13px] sm:text-[13.5px] font-semibold text-[var(--ink-primary)] hover:opacity-80 hover:scale-[1.03] transition-all cursor-pointer"
                  >
                    <span>{lang === "EN" ? "More Info" : "Thông tin"}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-80" />
                  </button>
                )}
              </div>
            </div>

            {/* Mobile & Tablet (< 1024px) Segmented Section Row (safe horizontal scroll without left clipping) */}
            {hasCenterTabs && (
              <div className="lg:hidden mt-3 w-full overflow-x-auto hide-scrollbar">
                <nav
                  role="tablist"
                  aria-label={lang === "EN" ? "Portfolio sections" : "Phân mục hồ sơ"}
                  className="mx-auto flex w-max items-center gap-1 p-1 h-10 rounded-[12px] bg-[var(--pill-bg)] apple-hairline"
                >
                  {showcaseTabs.map((tab) => (
                    <MagneticTabButton
                      key={tab.id}
                      active={effectiveMacroTab === tab.id}
                      count={tab.count}
                      onClick={() => setMacroTab(tab.id)}
                    >
                      {tab.label}
                    </MagneticTabButton>
                  ))}
                </nav>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {activeView === "showcase" ? (
              <motion.div
                key={`showcase-${effectiveMacroTab}-${layoutMode}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="w-full"
              >
                {/* Full Classification, Layout & Sort Toolbar */}
                {projects.length > 0 && (
                  <div className="apple-shell mt-1.5 sm:mt-2 space-y-2.5">
                    {/* Row 1: Count Summary + Stage/Grid Toggle + Newest/Oldest Sort */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                      <p className="text-xs sm:text-[13px] font-medium tabular-nums text-[var(--ink-meta)]">
                        {layoutMode === "grid"
                          ? lang === "EN"
                            ? `Showing ${paginatedGridItems.length} of ${currentItems.length} ${
                                isCertTab ? "credentials" : "projects"
                              }`
                            : `Hiển thị ${paginatedGridItems.length} / ${currentItems.length} ${
                                isCertTab ? "chứng chỉ" : "dự án"
                              }`
                          : lang === "EN"
                          ? `${currentItems.length} ${
                              isCertTab ? "credentials" : "projects"
                            }`
                          : `${currentItems.length} ${
                              isCertTab ? "chứng chỉ" : "dự án"
                            }`}
                      </p>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Stage / Grid Switch */}
                        <div className="inline-flex h-9 sm:h-10 items-center p-1 rounded-[12px] bg-[var(--pill-bg)] apple-hairline">
                          <button
                            type="button"
                            onClick={() => setLayoutMode("stage")}
                            data-cursor="magnetic"
                            className={`inline-flex h-7 sm:h-8 items-center gap-1.5 px-2.5 sm:px-3 rounded-[8px] text-xs font-semibold transition-all cursor-pointer ${
                              layoutMode === "stage"
                                ? "bg-[var(--pill-active-bg)] text-[var(--ink-primary)] shadow-2xs"
                                : "text-[var(--ink-meta)] hover:text-[var(--ink-primary)]"
                            }`}
                          >
                            <GalleryHorizontalEnd className="h-3.5 w-3.5" />
                            <span>{lang === "EN" ? "Stage" : "Sân khấu"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setLayoutMode("grid")}
                            data-cursor="magnetic"
                            className={`inline-flex h-7 sm:h-8 items-center gap-1.5 px-2.5 sm:px-3 rounded-[8px] text-xs font-semibold transition-all cursor-pointer ${
                              layoutMode === "grid"
                                ? "bg-[var(--pill-active-bg)] text-[var(--ink-primary)] shadow-2xs"
                                : "text-[var(--ink-meta)] hover:text-[var(--ink-primary)]"
                            }`}
                          >
                            <LayoutGrid className="h-3.5 w-3.5" />
                            <span>{lang === "EN" ? "Grid" : "Lưới"}</span>
                          </button>
                        </div>

                        {/* Sort Newest / Oldest Switch (Directly Visible) */}
                        <div className="inline-flex h-9 sm:h-10 items-center gap-0.5 p-1 rounded-[12px] bg-[var(--pill-bg)] apple-hairline">
                          <span className="hidden sm:inline-flex items-center gap-1 px-2 text-xs font-medium text-[var(--ink-meta)]">
                            <ArrowUpDown className="h-3.5 w-3.5" />
                            <span>{lang === "EN" ? "Sort" : "Xếp"}</span>
                          </span>
                          {(["newest", "oldest"] as const).map((ord) => (
                            <button
                              key={ord}
                              type="button"
                              onClick={() => {
                                if (isCertTab) {
                                  setCertSort(ord);
                                  setCertPage(1);
                                } else {
                                  setProjectSort(ord);
                                  setProjectPage(1);
                                }
                              }}
                              className={`h-7 sm:h-8 px-2.5 sm:px-3 rounded-[8px] text-xs font-semibold transition-all cursor-pointer ${
                                currentSort === ord
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

                    {/* Row 2: Notion Category Classification Pills (unconditional for >= 1 project categories) */}
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
                              if (isCertTab) {
                                setSelectedCertCategory(null);
                                setCertPage(1);
                              } else {
                                setSelectedProjectCategory(null);
                                setProjectPage(1);
                              }
                            }}
                            className={`inline-flex h-7 items-center gap-1 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              !currentSelectedCategory
                                ? "bg-[var(--ink-primary)] text-[var(--background)]"
                                : "bg-[var(--pill-bg)] apple-hairline text-[var(--ink-meta)] hover:text-[var(--ink-primary)]"
                            }`}
                          >
                            <span>{lang === "EN" ? "All" : "Tất cả"}</span>
                            <span className="opacity-75 tabular-nums text-[11px]">
                              ({isCertTab ? rawCertificates.length : rawProjects.length})
                            </span>
                          </button>

                          {currentCategories.map((cat) => {
                            const active = currentSelectedCategory === cat.name;
                            return (
                              <button
                                key={cat.name}
                                type="button"
                                onClick={() => {
                                  if (isCertTab) {
                                    setSelectedCertCategory(active ? null : cat.name);
                                    setCertPage(1);
                                  } else {
                                    setSelectedProjectCategory(active ? null : cat.name);
                                    setProjectPage(1);
                                  }
                                }}
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

                    {/* Row 3: Tech Stack / Credential Tag Filter Pills (Directly Visible) */}
                    {currentTags.length > 0 && (
                      <div className="w-full overflow-x-auto hide-scrollbar">
                        <div className="flex w-max sm:w-auto sm:flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 pr-1 text-[11.5px] font-semibold text-[var(--ink-meta)]">
                            <Tag className="h-3.5 w-3.5 opacity-75" />
                            <span>{lang === "EN" ? "Tags:" : "Thẻ:"}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (isCertTab) {
                                setSelectedCertTag(null);
                                setCertPage(1);
                              } else {
                                setSelectedProjectTag(null);
                                setProjectPage(1);
                              }
                            }}
                            className={`h-7 px-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                              !currentSelectedTag
                                ? "bg-[var(--ink-primary)] text-[var(--background)]"
                                : "bg-[var(--pill-bg)] apple-hairline text-[var(--ink-meta)] hover:text-[var(--ink-primary)]"
                            }`}
                          >
                            {lang === "EN" ? "All" : "Tất cả"}
                          </button>

                          {visibleTags.map((tag) => {
                            const active = currentSelectedTag === tag;
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                  if (isCertTab) {
                                    setSelectedCertTag(active ? null : tag);
                                    setCertPage(1);
                                  } else {
                                    setSelectedProjectTag(active ? null : tag);
                                    setProjectPage(1);
                                  }
                                }}
                                className={`h-7 px-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                  active
                                    ? "bg-[var(--ink-primary)] text-[var(--background)]"
                                    : "bg-[var(--pill-bg)] apple-hairline text-[var(--ink-meta)] hover:text-[var(--ink-primary)]"
                                }`}
                              >
                                {tag}
                              </button>
                            );
                          })}

                          {currentTags.length > INITIAL_VISIBLE_TAGS && (
                            <button
                              type="button"
                              onClick={() => setShowAllTags((prev) => !prev)}
                              className="h-7 px-2.5 rounded-full text-xs font-semibold bg-[var(--pill-bg)] apple-hairline text-[var(--ink-primary)] hover:opacity-80 transition-opacity cursor-pointer"
                            >
                              {showAllTags
                                ? lang === "EN"
                                  ? "Show less"
                                  : "Thu gọn"
                                : lang === "EN"
                                ? `+${currentTags.length - INITIAL_VISIBLE_TAGS} more`
                                : `+${currentTags.length - INITIAL_VISIBLE_TAGS} thẻ`}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {projects.length === 0 ? (
                  <div className="apple-shell py-20 text-center">
                    <div className="mx-auto max-w-xl">
                      <p className="apple-h2 text-2xl font-normal text-[var(--ink-primary)] mb-2">
                        {profileName}
                      </p>
                      <p className="text-sm text-[var(--ink-meta)] mb-6">
                        {lang === "EN"
                          ? "Published Notion portfolio entries will appear on this stage automatically."
                          : "Các dự án đã xuất bản trên Notion sẽ tự động xuất hiện trên sân khấu này."}
                      </p>
                      <button
                        type="button"
                        onClick={() => switchView("more-info")}
                        data-cursor="magnetic"
                        className="inline-flex min-h-[44px] items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--pill-bg)] apple-hairline text-sm font-medium text-[var(--ink-primary)] hover:scale-[1.03] transition-transform cursor-pointer"
                      >
                        <span>{lang === "EN" ? "Explore More Info" : "Xem hồ sơ chi tiết"}</span>
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : layoutMode === "stage" ? (
                  <ShowcaseCarousel
                    key={`${effectiveMacroTab}-${currentSelectedCategory ?? "all"}-${
                      currentSelectedTag ?? "all"
                    }-${currentSort}`}
                    items={currentItems}
                    lang={lang}
                    isCertificateReel={isCertTab}
                    onSelectProject={setSelectedProject}
                    formatYearOrDate={formatYearOrDate}
                    formatDateRange={formatDateRangeString}
                    renderLinkifiedText={renderLinkified}
                  />
                ) : (
                  <section ref={gridTopRef} className="apple-shell py-6 sm:py-8">
                    {paginatedGridItems.length === 0 ? (
                      <div className="mx-auto max-w-2xl px-6 py-16 text-center rounded-[26px] apple-hairline bg-[var(--surface-elevated)] text-[var(--ink-meta)] text-sm">
                        {lang === "EN"
                          ? "No items match the selected filter."
                          : "Không có mục nào khớp bộ lọc đang chọn."}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                          const hasImage = Boolean(item.images && item.images[0]);
                          const dateStr =
                            formatDateRangeString(item.project_date) || formatYearOrDate(item);
                          const badgeCategory =
                            item.category && item.category !== "Uncategorized"
                              ? item.category
                              : isCertTab
                              ? lang === "EN"
                                ? "Certificate"
                                : "Chứng chỉ"
                              : "";

                          return (
                            <motion.article
                              key={item.id}
                              onClick={() => setSelectedProject(item)}
                              data-cursor="magnetic"
                              initial={{ opacity: 0, y: 16 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.35, delay: idx * 0.04 }}
                              className="group flex h-full flex-col rounded-[24px] apple-hairline bg-[var(--background)] hover:bg-[var(--surface-elevated)] hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer"
                              style={{ boxShadow: "var(--card-shadow)" }}
                            >
                              <div className="relative w-full aspect-[16/10] overflow-hidden bg-[var(--surface-elevated)] border-b border-[var(--card-border)]">
                                {hasImage ? (
                                  <Image
                                    src={item.images[0]}
                                    alt={title}
                                    fill
                                    unoptimized={
                                      /(\.gif|\.svg)(\?|$)/i.test(item.images[0]) ||
                                      item.images[0].startsWith("data:")
                                    }
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    className={`${
                                      isCertTab ? "object-contain p-3" : "object-cover object-top"
                                    } transition-transform duration-500 group-hover:scale-[1.03]`}
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-[var(--pill-bg)]">
                                    {isCertTab ? (
                                      <Award className="h-10 w-10 text-[var(--ink-meta)] opacity-50" />
                                    ) : (
                                      <Code className="h-10 w-10 text-[var(--ink-meta)] opacity-50" />
                                    )}
                                  </div>
                                )}

                                {badgeCategory && (
                                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full apple-glass text-[11px] font-semibold text-[var(--ink-primary)]">
                                    {badgeCategory}
                                  </span>
                                )}

                                {item.images && item.images.length > 1 && (
                                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full apple-glass text-[11px] font-semibold tabular-nums text-[var(--ink-primary)]">
                                    1 / {item.images.length}
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-1 flex-col p-5 sm:p-6">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  {dateStr ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold tabular-nums text-[var(--ink-meta)]">
                                      <Calendar className="h-3.5 w-3.5 opacity-75" />
                                      <span>{dateStr}</span>
                                    </span>
                                  ) : (
                                    <span />
                                  )}

                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--ink-primary)] group-hover:translate-x-0.5 transition-transform">
                                    <span>
                                      {isCertTab
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

                                <h3 className="text-[17.5px] sm:text-[18.5px] leading-[1.35] font-semibold text-[var(--ink-primary)] break-words">
                                  {title}
                                </h3>

                                {desc && (
                                  <div className="mt-2.5 text-[13.5px] sm:text-[14px] leading-[1.65] text-[var(--ink-secondary)] whitespace-pre-line flex-1">
                                    <LinkifiedText text={desc} />
                                  </div>
                                )}

                                {((item.tags && item.tags.length > 0) || item.links) && (
                                  <div className="mt-auto pt-4 border-t border-[var(--card-border)] space-y-2.5">
                                    {item.tags && item.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5">
                                        {item.tags.map((t) => (
                                          <span
                                            key={t}
                                            className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[var(--pill-bg)] text-[var(--ink-secondary)]"
                                          >
                                            {t}
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    {item.links && (
                                      <div className="pt-0.5">
                                        <a
                                          href={item.links}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--pill-bg)] text-xs font-semibold text-[var(--ink-primary)] hover:opacity-80 transition-opacity"
                                        >
                                          <span>
                                            {lang === "EN" ? "Open Live Link" : "Xem Trực Tiếp"}
                                          </span>
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </motion.article>
                          );
                        })}
                      </div>
                    )}

                    {totalPages > 1 && (
                      <div className="mt-8 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                        <button
                          type="button"
                          onClick={() => changePage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pill-bg)] apple-hairline text-[var(--ink-primary)] disabled:opacity-35 cursor-pointer disabled:cursor-default"
                          aria-label={lang === "EN" ? "Previous page" : "Trang trước"}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>

                        {buildPageNumbers(currentPage, totalPages).map((entry, i) =>
                          entry === "ellipsis" ? (
                            <span
                              key={`ellipsis-${i}`}
                              className="px-1.5 text-xs font-semibold text-[var(--ink-meta)]"
                            >
                              …
                            </span>
                          ) : (
                            <button
                              key={entry}
                              type="button"
                              onClick={() => changePage(entry)}
                              className={`h-10 min-w-[40px] px-3 rounded-full text-xs font-semibold tabular-nums transition-all cursor-pointer ${
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
                          onClick={() => changePage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pill-bg)] apple-hairline text-[var(--ink-primary)] disabled:opacity-35 cursor-pointer disabled:cursor-default"
                          aria-label={lang === "EN" ? "Next page" : "Trang tiếp"}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </section>
                )}
              </motion.div>
            ) : (
              <MoreInfoView
                key="more-info-view"
                lang={lang}
                profileName={profileName}
                profileData={profileData}
                aboutParagraphs={aboutParagraphs}
                parsedExperiences={parsedExperiences}
                parsedSkills={parsedSkills}
                parsedEducations={parsedEducations}
                certificates={rawCertificates}
                projectTags={projectTags}
                socialLinks={socialLinks}
                formatDate={formatDate}
                formatDateRange={formatDateRangeString}
                formatYearOrDate={formatYearOrDate}
                onSelectProject={setSelectedProject}
                onOpenCertificatesShowcase={() => {
                  setMacroTab("certificates");
                  switchView("showcase");
                }}
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
            )}
          </AnimatePresence>
        </main>

        {/* Grounded Symmetric 3-Column Footer on Shared Margin Rails */}
        <footer className="w-full mt-auto pt-2 pb-4 text-[12px]">
          <div className="apple-shell">
            <div className="pt-4 border-t border-[var(--card-border)] flex flex-col md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
              <nav
                aria-label="Social links"
                className="flex flex-wrap items-center justify-center md:justify-start gap-4"
              >
                {socialLinks
                  .filter((s) => s.type !== "email")
                  .map((s) => (
                    <FooterMagneticLink key={s.type} href={s.href}>
                      {s.label}
                    </FooterMagneticLink>
                  ))}
                {profileData?.email && (
                  <a
                    href={`mailto:${profileData.email}`}
                    className="md:hidden font-semibold text-[var(--ink-meta)] hover:text-[var(--ink-primary)] transition-colors"
                  >
                    E-mail
                  </a>
                )}
              </nav>

              <p className="text-center font-semibold text-[var(--ink-muted)] md:justify-self-center">
                &copy; {new Date().getFullYear()} {profileData?.name_en || "Nguyen Chi Thang"} Portfolio
              </p>

              <div className="hidden md:flex items-center justify-end md:justify-self-end">
                {profileData?.email && (
                  <a
                    href={`mailto:${profileData.email}`}
                    onPointerMove={footerEmailMagnetic.onPointerMove}
                    onPointerLeave={footerEmailMagnetic.onPointerLeave}
                    data-cursor="magnetic"
                    className="magnetic-target py-1 font-semibold text-[var(--ink-meta)] hover:text-[var(--ink-primary)] transition-colors cursor-pointer"
                  >
                    E-mail
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
        onClose={() => setSelectedProject(null)}
        formatDateRange={formatDateRangeString}
        renderLinkifiedText={renderLinkified}
      />
    </div>
  );
}

function FooterMagneticLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const { onPointerMove, onPointerLeave } = useMagneticHandlers(4);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      data-cursor="magnetic"
      className="magnetic-target py-1 font-semibold text-[var(--ink-meta)] hover:text-[var(--ink-primary)] transition-colors cursor-pointer"
    >
      {children}
    </a>
  );
}
