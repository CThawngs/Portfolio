"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code,
  Briefcase,
  Camera,
  Mail,
  ExternalLink,
  GraduationCap,
  Sparkles,
  Layers,
  Cpu,
  Award,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  X,
  ArrowUpRight,
  User,
  Wrench,
  CheckCircle2,
} from "lucide-react";

// ── Custom SVG GitHub Icon ───────────────────────────────────────────────────
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

// ── LinkifiedText ─────────────────────────────────────────────────────────────
const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
const TRAILING_PUNCT_RE = /[)\].,;!?'"]+$/;

function LinkifiedText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  if (!text) return null;
  const parts = text.split(URL_REGEX);
  return (
    <span className={className}>
      {parts.map((part, i) => {
        URL_REGEX.lastIndex = 0;
        if (!URL_REGEX.test(part)) {
          URL_REGEX.lastIndex = 0;
          return <React.Fragment key={i}>{part}</React.Fragment>;
        }
        URL_REGEX.lastIndex = 0;

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
              className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 underline underline-offset-4 cursor-pointer transition-colors duration-150 break-all"
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

// ── TerminalTyping (Single-Line Typewriter from Notion Profile) ───────────────
const TYPING_SPEED = 45;
const DELETING_SPEED = 20;
const PAUSE_TIME = 2200;
const GAP_TIME = 300;

function splitPhrases(text: string): string[] {
  if (!text) return [];
  return text
    .split(/\n+|\||(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

interface TerminalTypingProps {
  role: string;
  bio: string;
}

function TerminalTyping({ role, bio }: TerminalTypingProps) {
  const items = useMemo(() => {
    const roleItems = role ? splitPhrases(role) : [];
    const bioItems = bio ? splitPhrases(bio) : [];
    return [...roleItems, ...bioItems].filter(Boolean);
  }, [role, bio]);

  const [itemIdx, setItemIdx] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setItemIdx(0);
    setDisplayText("");
    setIsDeleting(false);
  }, [items]);

  useEffect(() => {
    if (!items.length) return;

    const currentItem = items[itemIdx] || "";

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
  }, [displayText, isDeleting, itemIdx, items]);

  if (!items.length) return null;

  return (
    <div className="w-full flex items-center justify-center min-h-[2rem] my-1">
      <p className="text-base sm:text-lg md:text-xl font-medium text-slate-700 dark:text-slate-300 text-center tracking-normal max-w-3xl leading-relaxed">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 dark:from-emerald-400 dark:via-teal-300 dark:to-sky-400 font-semibold">
          {displayText}
        </span>
        <span className="inline-block w-[2.5px] h-[1.15em] align-middle bg-emerald-600 dark:bg-emerald-400 ml-1.5 animate-pulse rounded-full" />
      </p>
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
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

// ── Smart Dynamic Parsers for Notion Profile Config ───────────────────────────

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
      const cat = parts[0] ? parts[0].trim() : "Skills";
      const items = parts[1] || "";
      const skills = items
        .split(/[,|•·\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (cat && skills.length > 0) {
        groups.push({ category: cat, skills });
      }
    } else {
      const items = line
        .split(/[,|•·]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (items.length > 0) {
        groups.push({ category: "Skills", skills: items });
      }
    }
  }

  return groups;
}

function getCategoryIcon(catName: string) {
  const lower = catName.toLowerCase();
  if (lower.includes("lang") || lower.includes("ngôn ngữ") || lower.includes("code")) return Code;
  if (lower.includes("front") || lower.includes("web") || lower.includes("giao diện")) return Layers;
  if (lower.includes("back") || lower.includes("cloud") || lower.includes("hệ thống") || lower.includes("database")) return Cpu;
  if (lower.includes("ai") || lower.includes("auto") || lower.includes("tự động")) return Sparkles;
  if (lower.includes("tool") || lower.includes("design") || lower.includes("thiết kế") || lower.includes("công cụ")) return Wrench;
  return Sparkles;
}

interface ExperienceItem {
  role: string;
  org?: string;
  period?: string;
  badge?: string;
  bullets: string[];
}

function parseExperiences(text: string): ExperienceItem[] {
  if (!text) return [];
  const blocks = text
    .split(/\n\s*\n+|\|\|+|---+/)
    .map((b) => b.trim())
    .filter(Boolean);

  const items: ExperienceItem[] = [];

  for (const block of blocks) {
    const lines = block.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    const headerLine = lines[0];
    const bulletLines = lines.slice(1);

    const headerParts = headerLine.split(/\s*\|\s*/);
    let rolePart = headerParts[0] || "";
    const period = headerParts[1] || "";
    const badge = headerParts[2] || "";

    let org = "";
    if (rolePart.includes("@")) {
      const [r, o] = rolePart.split(/\s*@\s*/);
      rolePart = r;
      org = o;
    } else if (rolePart.includes("(") && rolePart.includes(")")) {
      const match = rolePart.match(/^(.*?)\s*\((.*?)\)$/);
      if (match) {
        rolePart = match[1];
        org = match[2];
      }
    }

    const bullets: string[] = [];
    for (const bLine of bulletLines) {
      const cleaned = bLine.replace(/^[-*•·–—]\s*/, "").trim();
      if (cleaned) bullets.push(cleaned);
    }

    if (bullets.length === 0 && headerParts.length > 2 && !badge) {
      bullets.push(headerParts.slice(2).join(" | "));
    }

    items.push({
      role: rolePart.trim(),
      org: org.trim(),
      period: period.trim(),
      badge: badge.trim(),
      bullets,
    });
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
    .split(/\n\s*\n+|\|\|+|---+/)
    .map((b) => b.trim())
    .filter(Boolean);

  const items: EducationItem[] = [];

  for (const block of blocks) {
    let parts: string[] = [];
    if (block.includes("\n")) {
      parts = block.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    } else {
      parts = block.split(/\s*\|\s*/).map((l) => l.trim()).filter(Boolean);
    }

    if (!parts.length) continue;

    const school = parts[0] || "";
    let major = "";
    let gpa = "";
    let period = "";
    const extraNotes: string[] = [];

    for (let i = 1; i < parts.length; i++) {
      const p = parts[i];
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
    .map((p) => p.trim())
    .filter(Boolean);
}

// ── Tag Styling Helper ────────────────────────────────────────────────────────
const tagThemes = [
  "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
  "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25",
  "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/25",
  "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/25",
  "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25",
  "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/25",
];

const getTagStyle = (tagName: string): string => {
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash += tagName.charCodeAt(i);
  }
  return tagThemes[hash % tagThemes.length];
};

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

export default function PortfolioUI({
  projects = [],
  profileData = null,
}: PortfolioUIProps) {
  const [lang, setLang] = useState<"EN" | "VN">("EN");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Dedicated Tag Filters for Projects & Certificates
  const [selectedProjectTag, setSelectedProjectTag] = useState<string | null>(null);
  const [selectedCertTag, setSelectedCertTag] = useState<string | null>(null);

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Sorting States
  const [projectSort, setProjectSort] = useState<SortOrder>("newest");
  const [certSort, setCertSort] = useState<SortOrder>("newest");

  // Pagination States
  const [projectPage, setProjectPage] = useState<number>(1);
  const [certPage, setCertPage] = useState<number>(1);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Separate Projects vs Certificates dynamically from Notion DB
  const { rawProjects, rawCertificates, projectTags, certTags } = useMemo(() => {
    const feat: Project[] = [];
    const cert: Project[] = [];
    const pTagSet = new Set<string>();
    const cTagSet = new Set<string>();

    projects.forEach((item) => {
      const cat = (item.category || "").toLowerCase();
      if (cat.includes("certificate") || cat.includes("chứng chỉ")) {
        cert.push(item);
        if (Array.isArray(item.tags)) {
          item.tags.forEach((t) => cTagSet.add(t));
        }
      } else {
        feat.push(item);
        if (Array.isArray(item.tags)) {
          item.tags.forEach((t) => pTagSet.add(t));
        }
      }
    });

    return {
      rawProjects: feat,
      rawCertificates: cert,
      projectTags: Array.from(pTagSet),
      certTags: Array.from(cTagSet),
    };
  }, [projects]);

  // Parse Notion Profile Config Dynamic Sections
  const aboutParagraphs = useMemo(() => {
    if (!profileData) return [];
    const raw = lang === "VN" ? profileData.about_vn : profileData.about_en;
    return parseParagraphs(raw || "");
  }, [profileData, lang]);

  const parsedSkills = useMemo(() => {
    if (!profileData) return [];
    const raw = lang === "VN" ? profileData.skills_vn : profileData.skills_en;
    return parseSkills(raw || "");
  }, [profileData, lang]);

  const parsedExperiences = useMemo(() => {
    if (!profileData) return [];
    const raw = lang === "VN" ? profileData.experience_vn : profileData.experience_en;
    return parseExperiences(raw || "");
  }, [profileData, lang]);

  const parsedEducations = useMemo(() => {
    if (!profileData) return [];
    const raw = lang === "VN" ? profileData.education_vn : profileData.education_en;
    return parseEducation(raw || "");
  }, [profileData, lang]);

  const profileName = useMemo(() => {
    return (
      (lang === "VN" ? profileData?.name_vn : profileData?.name_en) ||
      profileData?.name_vn ||
      profileData?.name_en ||
      "Nguyen Chi Thang"
    );
  }, [profileData, lang]);

  const brandInitials = useMemo(() => {
    const raw = profileData?.name_en || profileData?.name_vn || "Chi Thang";
    const parts = raw.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return (parts[0]?.slice(0, 2) || "CT").toUpperCase();
  }, [profileData]);

  // Active section tracking for navbar scroll spy & smooth scrolling
  const [activeSection, setActiveSection] = useState<string>("hero");

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -75; // sticky header height offset
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      setActiveSection(id);
    }
  };

  useEffect(() => {
    const sectionIds = ["hero", "about", "skills", "experience", "education", "projects", "certificates"];
    
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const id = sectionIds[i];
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [aboutParagraphs, parsedSkills, parsedExperiences, parsedEducations, rawCertificates]);

  // Filtered & Sorted Projects
  const filteredProjects = useMemo(() => {
    if (!selectedProjectTag) return rawProjects;
    return rawProjects.filter((p) => p.tags && p.tags.includes(selectedProjectTag));
  }, [rawProjects, selectedProjectTag]);

  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => {
      const timeA = getTimeValue(a);
      const timeB = getTimeValue(b);
      return projectSort === "newest" ? timeB - timeA : timeA - timeB;
    });
  }, [filteredProjects, projectSort]);

  // Filtered & Sorted Certificates
  const filteredCertificates = useMemo(() => {
    if (!selectedCertTag) return rawCertificates;
    return rawCertificates.filter((c) => c.tags && c.tags.includes(selectedCertTag));
  }, [rawCertificates, selectedCertTag]);

  const sortedCertificates = useMemo(() => {
    return [...filteredCertificates].sort((a, b) => {
      const timeA = getTimeValue(a);
      const timeB = getTimeValue(b);
      return certSort === "newest" ? timeB - timeA : timeA - timeB;
    });
  }, [filteredCertificates, certSort]);

  // Paginated Slices (6 items max per page)
  const totalProjectPages = Math.max(1, Math.ceil(sortedProjects.length / ITEMS_PER_PAGE));
  const paginatedProjects = useMemo(() => {
    const start = (projectPage - 1) * ITEMS_PER_PAGE;
    return sortedProjects.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedProjects, projectPage]);

  const totalCertPages = Math.max(1, Math.ceil(sortedCertificates.length / ITEMS_PER_PAGE));
  const paginatedCertificates = useMemo(() => {
    const start = (certPage - 1) * ITEMS_PER_PAGE;
    return sortedCertificates.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedCertificates, certPage]);

  const handleProjectTagClick = (tag: string | null) => {
    setSelectedProjectTag(tag);
    setProjectPage(1);
  };

  const handleCertTagClick = (tag: string | null) => {
    setSelectedCertTag(tag);
    setCertPage(1);
  };

  const handleProjectSortChange = (order: SortOrder) => {
    setProjectSort(order);
    setProjectPage(1);
  };

  const handleCertSortChange = (order: SortOrder) => {
    setCertSort(order);
    setCertPage(1);
  };

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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const parts = dateString.split("-");
    if (parts.length !== 3) return dateString;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const renderDateRange = (dateRange: Project["project_date"]) => {
    if (!dateRange || !dateRange.start) return null;
    const startFormatted = formatDate(dateRange.start);
    const endFormatted = dateRange.end ? formatDate(dateRange.end) : null;
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
        <Calendar className="h-3.5 w-3.5 opacity-75" />
        <span>{endFormatted ? `${startFormatted} – ${endFormatted}` : startFormatted}</span>
      </span>
    );
  };

  // Helper Pagination Controls
  const renderPagination = (
    currentPage: number,
    totalPages: number,
    onPageChange: (page: number) => void
  ) => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="flex h-9 items-center gap-1 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>{lang === "EN" ? "Prev" : "Trước"}</span>
        </button>

        <div className="flex items-center gap-1.5">
          {pageNumbers.map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`h-9 w-9 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                page === currentPage
                  ? "bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20"
                  : "border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400"
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="flex h-9 items-center gap-1 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
        >
          <span>{lang === "EN" ? "Next" : "Sau"}</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#090D14] text-slate-900 dark:text-slate-100 antialiased selection:bg-emerald-500 selection:text-white transition-colors duration-500 font-sans overflow-x-hidden">
      
      {/* ── SOFT MINT & SKY AMBIENT GLOWS ─────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-[130px] transform-gpu" />
        <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] bg-sky-500/10 dark:bg-sky-500/15 rounded-full blur-[140px] transform-gpu" />
        <div className="absolute bottom-10 left-1/4 w-[28rem] h-[28rem] bg-teal-500/10 dark:bg-teal-500/10 rounded-full blur-[130px] transform-gpu" />
      </div>

      {/* ── FIXED GLASS HEADER ──────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full backdrop-blur-xl bg-white/80 dark:bg-[#090D14]/80 border-b border-slate-200/80 dark:border-slate-800/80 transition-all duration-300 shadow-xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Brand Name (Only user's name, no logo icon) */}
          <a
            href="#hero"
            onClick={(e) => scrollToSection(e, "hero")}
            className="group flex items-center transition-transform duration-300 hover:scale-105 cursor-pointer select-none"
          >
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {profileName}
            </span>
          </a>

          {/* Quick Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md text-xs font-semibold tracking-wider">
            {aboutParagraphs.length > 0 && (
              <a
                href="#about"
                onClick={(e) => scrollToSection(e, "about")}
                className={`relative px-3.5 py-1.5 rounded-xl transition-all duration-300 cursor-pointer ${
                  activeSection === "about"
                    ? "text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-sm shadow-emerald-500/25"
                    : "text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/50"
                }`}
              >
                {lang === "EN" ? "About" : "Giới thiệu"}
              </a>
            )}
            {(parsedSkills.length > 0 || projectTags.length > 0) && (
              <a
                href="#skills"
                onClick={(e) => scrollToSection(e, "skills")}
                className={`relative px-3.5 py-1.5 rounded-xl transition-all duration-300 cursor-pointer ${
                  activeSection === "skills"
                    ? "text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-sm shadow-emerald-500/25"
                    : "text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/50"
                }`}
              >
                {lang === "EN" ? "Skills" : "Kỹ năng"}
              </a>
            )}
            {parsedExperiences.length > 0 && (
              <a
                href="#experience"
                onClick={(e) => scrollToSection(e, "experience")}
                className={`relative px-3.5 py-1.5 rounded-xl transition-all duration-300 cursor-pointer ${
                  activeSection === "experience"
                    ? "text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-sm shadow-emerald-500/25"
                    : "text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/50"
                }`}
              >
                {lang === "EN" ? "Experience" : "Kinh nghiệm"}
              </a>
            )}
            {parsedEducations.length > 0 && (
              <a
                href="#education"
                onClick={(e) => scrollToSection(e, "education")}
                className={`relative px-3.5 py-1.5 rounded-xl transition-all duration-300 cursor-pointer ${
                  activeSection === "education"
                    ? "text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-sm shadow-emerald-500/25"
                    : "text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/50"
                }`}
              >
                {lang === "EN" ? "Education" : "Học vấn"}
              </a>
            )}
            <a
              href="#projects"
              onClick={(e) => scrollToSection(e, "projects")}
              className={`relative px-3.5 py-1.5 rounded-xl transition-all duration-300 cursor-pointer ${
                activeSection === "projects"
                  ? "text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-sm shadow-emerald-500/25"
                  : "text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/50"
              }`}
            >
              {lang === "EN" ? "Projects" : "Dự án"}
            </a>
            {rawCertificates.length > 0 && (
              <a
                href="#certificates"
                onClick={(e) => scrollToSection(e, "certificates")}
                className={`relative px-3.5 py-1.5 rounded-xl transition-all duration-300 cursor-pointer ${
                  activeSection === "certificates"
                    ? "text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-sm shadow-emerald-500/25"
                    : "text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/50"
                }`}
              >
                {lang === "EN" ? "Certificates" : "Chứng chỉ"}
              </a>
            )}
          </nav>

          {/* Controls: Theme & Language */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-emerald-500/50 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all duration-200 shadow-sm cursor-pointer"
              aria-label="Toggle theme"
            >
              {mounted ? (
                theme === "dark" ? (
                  <svg className="h-4 w-4 fill-amber-400" viewBox="0 0 20 20">
                    <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 fill-emerald-600" viewBox="0 0 24 24">
                    <path d="M12.3 22h-.1c-5.5 0-10-4.5-10-10C2.2 6.8 6.5 2.5 11.9 2.2c.5 0 .9.3 1.1.8s-.1.9-.5 1.2C11 5.4 10 7.2 10 9.2c0 3.8 3.1 6.9 6.9 6.9 2 0 3.8-1 5-2.5.3-.4.8-.5 1.2-.3s.7.7.5 1.2c-.8 3.8-3.9 6.6-7.8 7.4-.5.1-1 .1-1.5.1z" />
                  </svg>
                )
              ) : (
                <div className="h-4 w-4 rounded-full bg-slate-300 dark:bg-slate-700 animate-pulse" />
              )}
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === "EN" ? "VN" : "EN")}
              className="relative inline-flex h-9 w-22 cursor-pointer items-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 p-1 transition-all duration-300 shadow-sm"
              aria-label="Toggle language"
            >
              <span
                className={`${
                  lang === "VN" ? "translate-x-10" : "translate-x-0"
                } absolute left-1 top-1 h-7 w-10 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md transition-transform duration-300`}
              />
              <span className="relative z-10 flex w-full justify-between px-1 text-[11px] font-bold uppercase tracking-wider select-none pointer-events-none">
                <span className={`w-10 text-center transition-colors duration-300 ${lang === "EN" ? "text-white" : "text-slate-500"}`}>
                  EN
                </span>
                <span className={`w-10 text-center transition-colors duration-300 ${lang === "VN" ? "text-white" : "text-slate-500"}`}>
                  VN
                </span>
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE HORIZONTAL QUICK NAVIGATION STRIP ─────────────────────── */}
      <div className="md:hidden fixed top-16 left-0 right-0 z-40 w-full backdrop-blur-xl bg-white/85 dark:bg-[#090D14]/90 border-b border-slate-200/80 dark:border-slate-800/80 py-2.5 px-4 overflow-x-auto hide-scrollbar shadow-xs">
        <div className="flex items-center gap-1.5 w-max mx-auto">
          {aboutParagraphs.length > 0 && (
            <a
              href="#about"
              onClick={(e) => scrollToSection(e, "about")}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
                activeSection === "about"
                  ? "text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {lang === "EN" ? "About" : "Giới thiệu"}
            </a>
          )}
          {(parsedSkills.length > 0 || projectTags.length > 0) && (
            <a
              href="#skills"
              onClick={(e) => scrollToSection(e, "skills")}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
                activeSection === "skills"
                  ? "text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {lang === "EN" ? "Skills" : "Kỹ năng"}
            </a>
          )}
          {parsedExperiences.length > 0 && (
            <a
              href="#experience"
              onClick={(e) => scrollToSection(e, "experience")}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
                activeSection === "experience"
                  ? "text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {lang === "EN" ? "Experience" : "Kinh nghiệm"}
            </a>
          )}
          {parsedEducations.length > 0 && (
            <a
              href="#education"
              onClick={(e) => scrollToSection(e, "education")}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
                activeSection === "education"
                  ? "text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {lang === "EN" ? "Education" : "Học vấn"}
            </a>
          )}
          <a
            href="#projects"
            onClick={(e) => scrollToSection(e, "projects")}
            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
              activeSection === "projects"
                ? "text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-sm"
                : "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {lang === "EN" ? "Projects" : "Dự án"}
          </a>
          {rawCertificates.length > 0 && (
            <a
              href="#certificates"
              onClick={(e) => scrollToSection(e, "certificates")}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
                activeSection === "certificates"
                  ? "text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {lang === "EN" ? "Certificates" : "Chứng chỉ"}
            </a>
          )}
        </div>
      </div>

      {/* ── 1. HERO SECTION (100% DYNAMIC FROM NOTION PROFILE DB) ────────── */}
      <section id="hero" className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 pt-28 sm:pt-28 md:pt-24 pb-8 text-center">
        {profileData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            {/* Name from Notion Profile */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-teal-900 dark:from-white dark:via-slate-100 dark:to-emerald-200">
                {lang === "VN" ? profileData.name_vn : profileData.name_en}
              </span>
            </h1>

            {/* Single-Line Typewriter Animation (Dynamic from Notion Role & Bio) */}
            <TerminalTyping
              role={lang === "VN" ? profileData.role_vn : profileData.role_en}
              bio={lang === "VN" ? profileData.bio_vn : profileData.bio_en}
            />

            {/* Date of Birth (from Notion Profile if configured) */}
            {profileData.dob && (
              <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5 mt-2">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {lang === "VN"
                    ? `Ngày sinh: ${formatDate(profileData.dob)}`
                    : `Born: ${formatDate(profileData.dob)}`}
                </span>
              </p>
            )}

            {/* Social & Contact Buttons (from Notion Profile) */}
            {socialLinks.length > 0 && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {socialLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <a
                      key={link.type}
                      href={link.href}
                      target={link.type === "email" ? undefined : "_blank"}
                      rel={link.type === "email" ? undefined : "noopener noreferrer"}
                      className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold shadow-sm hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                    >
                      <Icon className="h-4 w-4 text-slate-500 group-hover:text-emerald-500 transition-colors" />
                      <span>{link.label}</span>
                    </a>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </section>

      {/* ── 2. ABOUT ME SECTION (DYNAMIC FROM NOTION PROFILE DB) ─────────── */}
      {aboutParagraphs.length > 0 && (
        <section id="about" className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.45 }}
            className="rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-slate-900/5 dark:shadow-none relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <User className="h-5 w-5" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {lang === "EN" ? "About Me" : "Về Tôi"}
              </h2>
            </div>

            <div className="space-y-3 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
              {aboutParagraphs.map((para, idx) => (
                <p key={idx}>
                  <LinkifiedText text={para} />
                </p>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* ── 3. TECHNICAL SKILLS SECTION (DYNAMIC FROM NOTION PROFILE DB) ─── */}
      {(parsedSkills.length > 0 || projectTags.length > 0) && (
        <section id="skills" className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {lang === "EN" ? "Technical Skills" : "Kỹ Năng Công Nghệ"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {lang === "EN" ? "Categorized technology stack & specialized tools" : "Ngăn xếp công nghệ và công cụ chuyên môn"}
              </p>
            </div>
          </div>

          {parsedSkills.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {parsedSkills.map((group, idx) => {
                const Icon = getCategoryIcon(group.category);
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.06 }}
                    className="group relative rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-5 shadow-sm hover:shadow-xl hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                  >
                    <div className="flex items-center gap-2.5 mb-3.5">
                      <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="text-sm font-bold tracking-wide uppercase text-slate-800 dark:text-slate-200">
                        {group.category}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {group.skills.map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs group-hover:border-emerald-400/40 transition-colors"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            // Fallback: Dynamic Tag Cloud from Notion Projects
            <div className="flex flex-wrap gap-2 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white/80 dark:bg-slate-900/60">
              {projectTags.map((tag) => (
                <span
                  key={tag}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${getTagStyle(tag)}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── 4. EXPERIENCE SECTION (DYNAMIC FROM NOTION PROFILE DB) ───────── */}
      {parsedExperiences.length > 0 && (
        <section id="experience" className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {lang === "EN" ? "Experience & Highlights" : "Kinh Nghiệm & Hoạt Động"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {lang === "EN" ? "Key industry engagements and project activities" : "Các vai trò thực tế và hoạt động nổi bật"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {parsedExperiences.map((exp, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.08 }}
                className="relative rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-6 sm:p-7 shadow-lg shadow-slate-900/5 hover:border-emerald-500/40 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                        {exp.role}
                      </h3>
                      {exp.badge && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                          {exp.badge}
                        </span>
                      )}
                    </div>
                    {exp.org && (
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
                        {exp.org}
                      </p>
                    )}
                  </div>
                  {exp.period && (
                    <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 shrink-0">
                      {exp.period}
                    </span>
                  )}
                </div>

                {exp.bullets.length > 0 && (
                  <ul className="space-y-1.5 mt-3">
                    {exp.bullets.map((bullet, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span><LinkifiedText text={bullet} /></span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── 5. EDUCATION SECTION (DYNAMIC FROM NOTION PROFILE DB) ────────── */}
      {parsedEducations.length > 0 && (
        <section id="education" className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {lang === "EN" ? "Education" : "Học Vấn"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {lang === "EN" ? "Academic background & foundational studies" : "Nền tảng học thuật và đào tạo chính quy"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {parsedEducations.map((edu, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.08 }}
                className="rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-6 sm:p-7 shadow-lg shadow-slate-900/5 hover:border-emerald-500/40 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                      {edu.school}
                    </h3>
                    {edu.major && (
                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {edu.major}
                      </p>
                    )}
                    {edu.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {edu.notes}
                      </p>
                    )}
                  </div>
                  <div className="text-left sm:text-right">
                    {edu.gpa && (
                      <span className="inline-block px-3 py-1 rounded-xl text-xs font-black bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        {edu.gpa}
                      </span>
                    )}
                    {edu.period && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-mono">
                        {edu.period}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── 6. PROJECTS SECTION (100% DYNAMIC FROM NOTION PORTFOLIO DB) ──── */}
      <section id="projects" className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Code className="h-5 w-5" />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                {lang === "EN" ? "Projects" : "Dự Án"}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              {lang === "EN"
                ? `Showing ${paginatedProjects.length} of ${sortedProjects.length} items (${ITEMS_PER_PAGE} per page)`
                : `Hiển thị ${paginatedProjects.length} trên tổng số ${sortedProjects.length} mục (tối đa ${ITEMS_PER_PAGE} mục/trang)`}
            </p>
          </div>

          {/* Sort Controls for Projects */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span>{lang === "EN" ? "Sort:" : "Sắp xếp:"}</span>
            </span>
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200 dark:border-slate-700/80 shadow-2xs">
              <button
                onClick={() => handleProjectSortChange("newest")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  projectSort === "newest"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {lang === "EN" ? "Newest" : "Mới nhất"}
              </button>
              <button
                onClick={() => handleProjectSortChange("oldest")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  projectSort === "oldest"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {lang === "EN" ? "Oldest" : "Cũ nhất"}
              </button>
            </div>
          </div>
        </div>

        {/* Dedicated Projects Tag Filter Bar */}
        {projectTags.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => handleProjectTagClick(null)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedProjectTag === null
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-700/60"
              }`}
            >
              {lang === "EN" ? "All" : "Tất cả"}
            </button>
            {projectTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleProjectTagClick(selectedProjectTag === tag ? null : tag)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                  selectedProjectTag === tag
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : `${getTagStyle(tag)} hover:opacity-80`
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Project Grid */}
        {sortedProjects.length === 0 ? (
          <div className="text-center py-16 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-500">
            {lang === "EN" ? "No projects found matching the criteria." : "Không tìm thấy dự án nào phù hợp."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedProjects.map((project, index) => {
              const title =
                (lang === "EN" ? project.title_en : project.title_vn) ||
                project.title_en ||
                project.title_vn ||
                "Untitled Project";

              const desc =
                (lang === "EN" ? project.desc_en || project.desc_vn : project.desc_vn || project.desc_en) || "";

              const hasImage = project.images && project.images[0];

              return (
                <motion.div
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="group relative flex flex-col rounded-3xl border border-slate-200/90 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg shadow-slate-900/5 hover:shadow-2xl hover:border-emerald-500/50 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  {/* Image Cover */}
                  <div className="relative w-full aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {hasImage ? (
                      <Image
                        src={project.images[0]}
                        alt={title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                        priority={index < 3}
                        quality={85}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-sky-500/10">
                        <Code className="h-10 w-10 text-emerald-500/40" />
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      {renderDateRange(project.project_date)}
                      {project.links && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                          <span>{lang === "EN" ? "View Details" : "Xem Chi Tiết"}</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                      {title}
                    </h3>

                    <div className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed flex-1">
                      <LinkifiedText text={desc} />
                    </div>

                    {/* Tags */}
                    {project.tags && project.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                        {project.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getTagStyle(tag)}`}
                          >
                            {tag}
                          </span>
                        ))}
                        {project.tags.length > 4 && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] text-slate-400">
                            +{project.tags.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {renderPagination(projectPage, totalProjectPages, setProjectPage)}
      </section>

      {/* ── 7. CERTIFICATES SECTION (DYNAMIC CARD GALLERY FROM NOTION CMS) ─ */}
      {rawCertificates.length > 0 && (
        <section id="certificates" className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <Award className="h-5 w-5" />
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                  {lang === "EN" ? "Certificates & Accreditations" : "Chứng Chỉ & Thành Tựu"}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
                {lang === "EN"
                  ? `Showing ${paginatedCertificates.length} of ${sortedCertificates.length} credentials (${ITEMS_PER_PAGE} per page)`
                  : `Hiển thị ${paginatedCertificates.length} trên tổng số ${sortedCertificates.length} chứng chỉ (tối đa ${ITEMS_PER_PAGE} mục/trang)`}
              </p>
            </div>

            {/* Sort Controls for Certificates */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <ArrowUpDown className="h-3.5 w-3.5" />
                <span>{lang === "EN" ? "Sort:" : "Sắp xếp:"}</span>
              </span>
              <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200 dark:border-slate-700/80 shadow-2xs">
                <button
                  onClick={() => handleCertSortChange("newest")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    certSort === "newest"
                      ? "bg-teal-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {lang === "EN" ? "Newest" : "Mới nhất"}
                </button>
                <button
                  onClick={() => handleCertSortChange("oldest")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    certSort === "oldest"
                      ? "bg-teal-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {lang === "EN" ? "Oldest" : "Cũ nhất"}
                </button>
              </div>
            </div>
          </div>

          {/* Dedicated Certificates Tag Filter Bar */}
          {certTags.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => handleCertTagClick(null)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedCertTag === null
                    ? "bg-teal-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-700/60"
                }`}
              >
                {lang === "EN" ? "All" : "Tất cả"}
              </button>
              {certTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleCertTagClick(selectedCertTag === tag ? null : tag)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    selectedCertTag === tag
                      ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                      : `${getTagStyle(tag)} hover:opacity-80`
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Certificate Cards Gallery */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedCertificates.map((cert, index) => {
              const title =
                (lang === "EN" ? cert.title_en : cert.title_vn) ||
                cert.title_en ||
                cert.title_vn ||
                "Certificate";

              const desc =
                (lang === "EN" ? cert.desc_en || cert.desc_vn : cert.desc_vn || cert.desc_en) || "";

              const hasImage = cert.images && cert.images[0];

              return (
                <motion.div
                  key={cert.id}
                  onClick={() => setSelectedProject(cert)}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="group relative flex flex-col rounded-3xl border border-slate-200/90 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg shadow-slate-900/5 hover:shadow-2xl hover:border-teal-500/50 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  {/* Certificate Image Cover Preview */}
                  <div className="relative w-full aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {hasImage ? (
                      <Image
                        src={cert.images[0]}
                        alt={title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        priority={index < 3}
                        quality={85}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-500/10 via-emerald-500/10 to-sky-500/10">
                        <Award className="h-12 w-12 text-teal-500/40" />
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      {renderDateRange(cert.project_date)}
                      <span className="flex items-center gap-1 text-[11px] font-bold text-teal-600 dark:text-teal-400 group-hover:translate-x-0.5 transition-transform">
                        <span>{lang === "EN" ? "View Certificate" : "Xem Chứng Chỉ"}</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-1">
                      {title}
                    </h3>

                    <div className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed flex-1">
                      <LinkifiedText text={desc} />
                    </div>

                    {/* Tags */}
                    {cert.tags && cert.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                        {cert.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getTagStyle(tag)}`}
                          >
                            {tag}
                          </span>
                        ))}
                        {cert.tags.length > 4 && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] text-slate-400">
                            +{cert.tags.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {renderPagination(certPage, totalCertPages, setCertPage)}
        </section>
      )}

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-slate-200/80 dark:border-slate-800/80 mt-16 py-8 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>
          © {new Date().getFullYear()} {profileData?.name_en || "Nguyen Chi Thang"} • Built with Next.js 16, Notion CMS & Google Gemini AI.
        </p>
      </footer>

      {/* ── DETAIL MODAL ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedProject && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto"
            onClick={() => setSelectedProject(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Modal Header Image */}
              {selectedProject.images && selectedProject.images[0] && (
                <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden mb-6 bg-slate-100 dark:bg-slate-800">
                  <Image
                    src={selectedProject.images[0]}
                    alt={selectedProject.title_en || selectedProject.title_vn}
                    fill
                    priority
                    quality={90}
                    className="object-cover"
                  />
                </div>
              )}

              {/* Title & Metadata */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {selectedProject.category && (
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wide bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                    {selectedProject.category}
                  </span>
                )}
                {renderDateRange(selectedProject.project_date)}
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-4">
                {(lang === "EN" ? selectedProject.title_en : selectedProject.title_vn) ||
                  selectedProject.title_en ||
                  selectedProject.title_vn}
              </h2>

              {/* Description & Links */}
              <div className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed space-y-4 mb-6">
                <LinkifiedText
                  text={
                    (lang === "EN"
                      ? selectedProject.desc_en || selectedProject.desc_vn
                      : selectedProject.desc_vn || selectedProject.desc_en) || ""
                  }
                  className="block whitespace-pre-wrap"
                />
              </div>

              {/* Tags */}
              {selectedProject.tags && selectedProject.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {selectedProject.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border ${getTagStyle(tag)}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              {selectedProject.links && (
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={selectedProject.links}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 cursor-pointer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>{lang === "EN" ? "Open Live Link" : "Xem Trực Tiếp"}</span>
                  </a>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
