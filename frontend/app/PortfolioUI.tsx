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
  Camera,
  Mail,
  ArrowLeft,
  ArrowUpRight,
  ArrowUpDown,
  Award,
  Code,
  LayoutGrid,
  GalleryHorizontalEnd,
  SlidersHorizontal,
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
  education_en: "University of Information Technology | B.S. in Information Technology | GPA: 3.7/4.0 | 2023 - 2027",
  education_vn: "Đại học Công nghệ Thông tin | Cử nhân Công nghệ Thông tin | GPA: 3.7/4.0 | 2023 - 2027",
  dob: null,
  email: "contact@chithang.dev",
  github: "https://github.com/CThawngs",
  linkedin: "https://linkedin.com",
  instagram: "https://instagram.com",
};

const DEV_DEMO_PROJECTS: Project[] = [
  {
    id: "demo-1",
    status: "Published",
    title_en: "Portfolio AI Automation CMS",
    title_vn: "Hệ Thống CMS Portfolio Tự Động Hóa AI",
    desc_en: "Serverless bridge between Notion CMS and OpenRouter LLMs with context-aware bilingual translation and instant ISR publishing. https://github.com/CThawngs/Portfolio",
    desc_vn: "Cầu nối serverless giữa Notion CMS và OpenRouter LLM giúp dịch thuật song ngữ tự động chuẩn ngữ cảnh kỹ thuật số. https://github.com/CThawngs/Portfolio",
    category: "AI Systems",
    links: "https://github.com/CThawngs/Portfolio",
    images: ["/Portfolio Publish One Click.gif"],
    tags: ["Next.js", "Notion API", "Python", "OpenRouter"],
    project_date: { start: "2026-09-01", end: null },
  },
  {
    id: "demo-2",
    status: "Published",
    title_en: "Context-Aware Translation Engine",
    title_vn: "Bộ Máy Dịch Thuật Nhận Thức Ngữ Cảnh",
    desc_en: "Zero-idle-token hourly pipeline preserving software engineering terminology across English and Vietnamese.",
    desc_vn: "Luồng dịch thuật định kỳ tiết kiệm tối đa token và giữ nguyên chuẩn xác thuật ngữ chuyên ngành phần mềm.",
    category: "AI Systems",
    links: "https://github.com/CThawngs/Portfolio",
    images: ["/Portfolio Translate Automation.gif"],
    tags: ["LLM", "GitHub Actions", "Automation"],
    project_date: { start: "2026-06-15", end: "2026-08-20" },
  },
  {
    id: "demo-3",
    status: "Published",
    title_en: "Lifecycle Archive Controller",
    title_vn: "Bộ Điều Khiển Lưu Trữ Tự Động",
    desc_en: "Real-time Notion status synchronization with clean archival workflows and instant edge revalidation.",
    desc_vn: "Đồng bộ trạng thái Notion theo thời gian thực cùng cơ chế lưu trữ và làm mới bộ nhớ đệm tức thì.",
    category: "Developer Tools",
    links: "",
    images: ["/Portfolio Archive.gif"],
    tags: ["TypeScript", "Edge ISR", "REST API"],
    project_date: { start: "2026-03-10", end: null },
  },
  {
    id: "demo-cert-1",
    status: "Published",
    title_en: "DeepLearning.AI Generative AI Specialization",
    title_vn: "Chứng Chỉ Chuyên Sâu AI Tạo Sinh DeepLearning.AI",
    desc_en: "Comprehensive credential covering transformer architectures, fine-tuning, RLHF, and production LLM deployment.",
    desc_vn: "Chứng chỉ chuyên sâu về kiến trúc Transformer, tinh chỉnh mô hình, RLHF và triển khai LLM thực tế.",
    category: "Certificate",
    links: "https://www.deeplearning.ai",
    images: [],
    tags: ["Generative AI", "LLMs", "PyTorch"],
    project_date: { start: "2026-05-12", end: null },
  },
];

function MagneticTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const { onPointerMove, onPointerLeave } = useMagneticHandlers(10, active);

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => onClick()}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      data-cursor="magnetic"
      className={`magnetic-target relative shrink-0 min-h-[40px] px-4 py-2 rounded-[12px] text-[15px] font-bold transition-all cursor-pointer ${
        active
          ? "bg-[var(--pill-active-bg)] text-[var(--ink-primary)] cursor-default"
          : "bg-transparent text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_6px_18px_rgba(0,0,0,0.45)] hover:scale-[1.04]"
      }`}
    >
      {children}
    </button>
  );
}

export default function PortfolioUI({
  projects: incomingProjects = [],
  profileData: incomingProfile = null,
}: PortfolioUIProps) {
  const [lang, setLang] = useState<"EN" | "VN">("EN");
  const [activeView, setActiveView] = useState<ActiveView>("showcase");
  const [activeTab, setActiveTab] = useState<string>("all-projects");
  const [layoutMode, setLayoutMode] = useState<ShowcaseLayout>("stage");
  const [showFilters, setShowFilters] = useState(false);
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

  const { rawProjects, rawCertificates, projectTags, certTags, projectCategories } = useMemo(() => {
    const feat: Project[] = [];
    const cert: Project[] = [];
    const pTagSet = new Set<string>();
    const cTagSet = new Set<string>();
    const catSet = new Set<string>();

    projects.forEach((item) => {
      const cat = (item.category || "").toLowerCase();
      if (cat.includes("certificate") || cat.includes("chứng chỉ")) {
        cert.push(item);
        if (Array.isArray(item.tags)) item.tags.forEach((t) => cTagSet.add(t));
      } else {
        feat.push(item);
        if (Array.isArray(item.tags)) item.tags.forEach((t) => pTagSet.add(t));
        if (item.category && item.category !== "Uncategorized") {
          catSet.add(item.category);
        }
      }
    });

    return {
      rawProjects: feat,
      rawCertificates: cert,
      projectTags: Array.from(pTagSet),
      certTags: Array.from(cTagSet),
      projectCategories: Array.from(catSet),
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
    const tabs: { id: string; label: string }[] = [
      { id: "all-projects", label: lang === "EN" ? "Projects" : "Dự án" },
    ];
    if (projectCategories.length >= 2 && projectCategories.length <= 4) {
      projectCategories.forEach((cat) => {
        tabs.push({ id: `cat:${cat}`, label: cat });
      });
    }
    if (rawCertificates.length > 0) {
      tabs.push({
        id: "certificates",
        label: lang === "EN" ? "Certificates" : "Chứng chỉ",
      });
    }
    return tabs;
  }, [projectCategories, rawCertificates.length, lang]);

  const effectiveTab = useMemo(
    () => (showcaseTabs.some((t) => t.id === activeTab) ? activeTab : "all-projects"),
    [showcaseTabs, activeTab]
  );

  const isCertTab = effectiveTab === "certificates";

  const activeProjectPool = useMemo(() => {
    let base = rawProjects;
    if (effectiveTab.startsWith("cat:")) {
      const cat = effectiveTab.slice(4);
      base = base.filter((p) => p.category === cat);
    }
    if (selectedProjectTag) {
      base = base.filter((p) => p.tags && p.tags.includes(selectedProjectTag));
    }
    return [...base].sort((a, b) => {
      const tA = getTimeValue(a);
      const tB = getTimeValue(b);
      return projectSort === "newest" ? tB - tA : tA - tB;
    });
  }, [rawProjects, effectiveTab, selectedProjectTag, projectSort]);

  const activeCertPool = useMemo(() => {
    let base = rawCertificates;
    if (selectedCertTag) {
      base = base.filter((c) => c.tags && c.tags.includes(selectedCertTag));
    }
    return [...base].sort((a, b) => {
      const tA = getTimeValue(a);
      const tB = getTimeValue(b);
      return certSort === "newest" ? tB - tA : tA - tB;
    });
  }, [rawCertificates, selectedCertTag, certSort]);

  const currentItems = isCertTab ? activeCertPool : activeProjectPool;
  const currentTags = isCertTab ? certTags : projectTags;
  const currentSelectedTag = isCertTab ? selectedCertTag : selectedProjectTag;
  const currentSort = isCertTab ? certSort : projectSort;
  const currentPage = isCertTab ? certPage : projectPage;
  const totalPages = Math.max(1, Math.ceil(currentItems.length / ITEMS_PER_PAGE));

  const paginatedGridItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return currentItems.slice(start, start + ITEMS_PER_PAGE);
  }, [currentItems, currentPage]);

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

  const navLeftMagnetic = useMagneticHandlers(8);
  const navRightMagnetic = useMagneticHandlers(8);
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

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] selection:bg-[#FFD433] selection:text-black">
      <CustomCursor />

      <div ref={pageWrapperRef} className="flex-1 flex flex-col will-change-transform">
        <header className="relative z-40 w-full px-5 sm:px-10 lg:px-14 pt-6 sm:pt-8 pb-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center min-w-0">
              {activeView === "more-info" ? (
                <button
                  type="button"
                  onClick={() => switchView("showcase")}
                  onPointerMove={navLeftMagnetic.onPointerMove}
                  onPointerLeave={navLeftMagnetic.onPointerLeave}
                  data-cursor="magnetic"
                  className="magnetic-target inline-flex min-h-[44px] items-center gap-2 text-[16px] font-normal text-[var(--ink-primary)] hover:opacity-65 hover:scale-[1.06] transition-all cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>{lang === "EN" ? "Portfolio" : "Trang chủ"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("all-projects");
                    setSelectedProjectTag(null);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  onPointerMove={navLeftMagnetic.onPointerMove}
                  onPointerLeave={navLeftMagnetic.onPointerLeave}
                  data-cursor="magnetic"
                  className="magnetic-target inline-flex min-h-[44px] items-baseline gap-2.5 text-left cursor-pointer group"
                >
                  <span className="text-[16px] font-medium text-[var(--ink-primary)] group-hover:opacity-70 transition-opacity truncate">
                    {profileName}
                  </span>
                  {profileRole && (
                    <span className="hidden xl:inline text-[14px] font-normal text-[var(--ink-meta)] truncate max-w-[260px]">
                      {profileRole}
                    </span>
                  )}
                </button>
              )}
            </div>

            {activeView === "showcase" && showcaseTabs.length > 1 && (
              <nav
                role="tablist"
                aria-label={lang === "EN" ? "Portfolio categories" : "Danh mục"}
                className="hidden md:flex items-center gap-1.5 max-w-[46vw] overflow-x-auto hide-scrollbar py-1 px-1"
              >
                {showcaseTabs.map((tab) => (
                  <MagneticTabButton
                    key={tab.id}
                    active={effectiveTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </MagneticTabButton>
                ))}
              </nav>
            )}

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {activeView === "more-info" && mounted && vnTime && (
                <span className="hidden md:inline text-[14px] font-normal tabular-nums text-[var(--ink-muted)] mr-1">
                  {vnTime}
                </span>
              )}

              <button
                type="button"
                onClick={() => setLang((prev) => (prev === "EN" ? "VN" : "EN"))}
                data-cursor="magnetic"
                className="inline-flex h-10 min-w-[48px] items-center justify-center px-3 rounded-[12px] bg-[var(--pill-bg)] text-[12px] font-bold tracking-wider text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:scale-[1.05] transition-all cursor-pointer"
                aria-label={lang === "EN" ? "Switch to Vietnamese" : "Chuyển sang tiếng Anh"}
              >
                {lang}
              </button>

              <button
                type="button"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                data-cursor="magnetic"
                className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] bg-[var(--pill-bg)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:scale-[1.05] transition-all cursor-pointer"
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
                  className="magnetic-target inline-flex min-h-[44px] items-center gap-1.5 pl-2 pr-1 text-[15px] sm:text-[16px] font-medium text-[var(--ink-primary)] hover:opacity-60 hover:scale-[1.06] transition-all cursor-pointer"
                >
                  <span>{lang === "EN" ? "More Info" : "Thông tin"}</span>
                  <ArrowUpRight className="h-4 w-4 opacity-75" />
                </button>
              )}
            </div>
          </div>

          {activeView === "showcase" && showcaseTabs.length > 1 && (
            <nav
              role="tablist"
              aria-label={lang === "EN" ? "Portfolio categories" : "Danh mục"}
              className="md:hidden mt-3 flex items-center justify-center gap-1.5 overflow-x-auto hide-scrollbar py-1"
            >
              {showcaseTabs.map((tab) => (
                <MagneticTabButton
                  key={tab.id}
                  active={effectiveTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </MagneticTabButton>
              ))}
            </nav>
          )}
        </header>

        <main className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {activeView === "showcase" ? (
              <motion.div
                key={`showcase-${effectiveTab}-${layoutMode}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="w-full"
              >
                {(currentItems.length > 1 || currentTags.length > 0) && (
                  <div className="mx-auto max-w-6xl px-5 sm:px-10 mt-2 flex flex-wrap items-center justify-center gap-2">
                    <div className="inline-flex items-center p-1 rounded-[12px] bg-[var(--pill-bg)]">
                      <button
                        type="button"
                        onClick={() => setLayoutMode("stage")}
                        data-cursor="magnetic"
                        className={`inline-flex min-h-[34px] items-center gap-1.5 px-3 rounded-[9px] text-xs font-semibold transition-all cursor-pointer ${
                          layoutMode === "stage"
                            ? "bg-[var(--background)] text-[var(--ink-primary)] shadow-2xs"
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
                        className={`inline-flex min-h-[34px] items-center gap-1.5 px-3 rounded-[9px] text-xs font-semibold transition-all cursor-pointer ${
                          layoutMode === "grid"
                            ? "bg-[var(--background)] text-[var(--ink-primary)] shadow-2xs"
                            : "text-[var(--ink-meta)] hover:text-[var(--ink-primary)]"
                        }`}
                      >
                        <LayoutGrid className="h-3.5 w-3.5" />
                        <span>{lang === "EN" ? "Grid" : "Lưới"}</span>
                      </button>
                    </div>

                    {(currentTags.length > 0 || currentItems.length > 1) && (
                      <button
                        type="button"
                        onClick={() => setShowFilters((prev) => !prev)}
                        data-cursor="magnetic"
                        aria-expanded={showFilters}
                        className={`inline-flex min-h-[40px] items-center gap-1.5 px-3.5 rounded-[12px] text-xs font-semibold transition-all cursor-pointer ${
                          showFilters || currentSelectedTag
                            ? "bg-[var(--ink-primary)] text-[var(--background)]"
                            : "bg-[var(--pill-bg)] text-[var(--ink-meta)] hover:text-[var(--ink-primary)]"
                        }`}
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        <span>
                          {currentSelectedTag
                            ? `#${currentSelectedTag}`
                            : lang === "EN"
                            ? "Filter & Sort"
                            : "Lọc & Sắp xếp"}
                        </span>
                      </button>
                    )}
                  </div>
                )}

                <AnimatePresence initial={false}>
                  {showFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="mx-auto max-w-4xl px-5 sm:px-10 pt-4 pb-2 flex flex-col items-center gap-3">
                        <div className="inline-flex items-center gap-1.5 p-1 rounded-[12px] bg-[var(--pill-bg)]">
                          <span className="inline-flex items-center gap-1 px-2.5 text-xs font-medium text-[var(--ink-meta)]">
                            <ArrowUpDown className="h-3.5 w-3.5" />
                            <span>{lang === "EN" ? "Sort" : "Sắp xếp"}</span>
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
                              className={`min-h-[32px] px-3 rounded-[9px] text-xs font-semibold transition-all cursor-pointer ${
                                currentSort === ord
                                  ? "bg-[var(--background)] text-[var(--ink-primary)] shadow-2xs"
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

                        {currentTags.length > 0 && (
                          <div className="flex flex-wrap items-center justify-center gap-1.5">
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
                              className={`min-h-[34px] px-3 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                !currentSelectedTag
                                  ? "bg-[var(--ink-primary)] text-[var(--background)]"
                                  : "bg-[var(--pill-bg)] text-[var(--ink-meta)] hover:text-[var(--ink-primary)]"
                              }`}
                            >
                              {lang === "EN" ? "All" : "Tất cả"}
                            </button>
                            {currentTags.map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                  if (isCertTab) {
                                    setSelectedCertTag(selectedCertTag === tag ? null : tag);
                                    setCertPage(1);
                                  } else {
                                    setSelectedProjectTag(selectedProjectTag === tag ? null : tag);
                                    setProjectPage(1);
                                  }
                                }}
                                className={`min-h-[34px] px-3 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                  currentSelectedTag === tag
                                    ? "bg-[var(--ink-primary)] text-[var(--background)]"
                                    : "bg-[var(--pill-bg)] text-[var(--ink-meta)] hover:text-[var(--ink-primary)]"
                                }`}
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {projects.length === 0 ? (
                  <div className="mx-auto max-w-xl px-6 py-24 text-center">
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
                      className="inline-flex min-h-[44px] items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--pill-bg)] text-sm font-medium text-[var(--ink-primary)] hover:scale-[1.03] transition-transform cursor-pointer"
                    >
                      <span>{lang === "EN" ? "Explore More Info" : "Xem hồ sơ chi tiết"}</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  </div>
                ) : layoutMode === "stage" ? (
                  <ShowcaseCarousel
                    key={`${effectiveTab}-${currentSelectedTag ?? "all"}-${currentSort}`}
                    items={currentItems}
                    lang={lang}
                    isCertificateReel={isCertTab}
                    onSelectProject={setSelectedProject}
                    formatYearOrDate={formatYearOrDate}
                    renderLinkifiedText={renderLinkified}
                  />
                ) : (
                  <section className="mx-auto max-w-6xl px-5 sm:px-10 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

                        return (
                          <motion.article
                            key={item.id}
                            onClick={() => setSelectedProject(item)}
                            data-cursor="magnetic"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: idx * 0.04 }}
                            className="group flex flex-col rounded-[26px] apple-hairline bg-[var(--background)] hover:bg-[var(--surface-elevated)] hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer"
                            style={{ boxShadow: "var(--card-shadow)" }}
                          >
                            <div className="relative w-full aspect-[16/10] overflow-hidden bg-[var(--surface-elevated)]">
                              {hasImage ? (
                                <Image
                                  src={item.images[0]}
                                  alt={title}
                                  fill
                                  unoptimized={/(\.gif|\.svg)(\?|$)/i.test(item.images[0]) || item.images[0].startsWith("data:")} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
                            </div>

                            <div className="flex flex-1 flex-col p-6">
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-xs font-semibold tabular-nums text-[var(--ink-meta)]">
                                  {formatDateRangeString(item.project_date) ||
                                    formatYearOrDate(item)}
                                </span>
                                <ArrowUpRight className="h-4 w-4 text-[var(--ink-meta)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                              </div>

                              <h3 className="text-lg font-semibold text-[var(--ink-primary)] line-clamp-1">
                                {title}
                              </h3>

                              {desc && (
                                <div className="mt-2 text-[13.5px] leading-[1.6] text-[var(--ink-secondary)] line-clamp-3 flex-1">
                                  <LinkifiedText text={desc} />
                                </div>
                              )}

                              {item.tags && item.tags.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-[var(--card-border)] flex flex-wrap gap-1.5">
                                  {item.tags.slice(0, 4).map((t) => (
                                    <span
                                      key={t}
                                      className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[var(--pill-bg)] text-[var(--ink-meta)]"
                                    >
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.article>
                        );
                      })}
                    </div>

                    {totalPages > 1 && (
                      <div className="mt-8 flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            isCertTab
                              ? setCertPage((p) => Math.max(1, p - 1))
                              : setProjectPage((p) => Math.max(1, p - 1))
                          }
                          disabled={currentPage === 1}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pill-bg)] text-[var(--ink-primary)] disabled:opacity-30 cursor-pointer"
                          aria-label="Previous page"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="px-3 text-xs font-semibold tabular-nums text-[var(--ink-meta)]">
                          {currentPage} / {totalPages}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            isCertTab
                              ? setCertPage((p) => Math.min(totalPages, p + 1))
                              : setProjectPage((p) => Math.min(totalPages, p + 1))
                          }
                          disabled={currentPage === totalPages}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pill-bg)] text-[var(--ink-primary)] disabled:opacity-30 cursor-pointer"
                          aria-label="Next page"
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
                formatYearOrDate={formatYearOrDate}
                onSelectProject={setSelectedProject}
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

        <footer className="w-full px-5 sm:px-10 lg:px-14 py-6 mt-auto text-[12px]">
          <div className="flex flex-col md:grid md:grid-cols-3 items-center gap-3">
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

            <p className="text-center font-semibold text-[var(--ink-muted)]">
              © {new Date().getFullYear()} {profileData?.name_en || "Nguyen Chi Thang"} Portfolio
            </p>

            <div className="hidden md:flex items-center justify-end">
              {profileData?.email && (
                <a
                  href={`mailto:${profileData.email}`}
                  onPointerMove={footerEmailMagnetic.onPointerMove}
                  onPointerLeave={footerEmailMagnetic.onPointerLeave}
                  data-cursor="magnetic"
                  className="magnetic-target px-1.5 py-1 font-semibold text-[var(--ink-meta)] hover:text-[var(--ink-primary)] transition-colors cursor-pointer"
                >
                  E-mail
                </a>
              )}
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
      className="magnetic-target px-1 py-1 font-semibold text-[var(--ink-meta)] hover:text-[var(--ink-primary)] transition-colors cursor-pointer"
    >
      {children}
    </a>
  );
}
