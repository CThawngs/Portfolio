"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code,
  Briefcase,
  Camera,
  Mail,
  ExternalLink,
  Github,
  GraduationCap,
  Sparkles,
  Layers,
  Cpu,
  Award,
  Calendar,
  ChevronRight,
  X,
  Globe,
  Terminal,
  CheckCircle2,
  ArrowUpRight,
  User,
  Wrench,
  BookOpen,
} from "lucide-react";

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
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 underline underline-offset-4 cursor-pointer transition-colors duration-150 break-all"
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

// ── TerminalTyping (Single-Line Typewriter) ────────────────────────────────────
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
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-300 dark:to-pink-400 font-semibold">
          {displayText}
        </span>
        <span className="inline-block w-[2.5px] h-[1.15em] align-middle bg-indigo-600 dark:bg-indigo-400 ml-1.5 animate-pulse rounded-full" />
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

// ── Tag Styling Helper ────────────────────────────────────────────────────────
const tagThemes = [
  "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
];

const getTagStyle = (tagName: string): string => {
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash += tagName.charCodeAt(i);
  }
  return tagThemes[hash % tagThemes.length];
};

export default function PortfolioUI({
  projects = [],
  profileData = null,
}: PortfolioUIProps) {
  const [lang, setLang] = useState<"EN" | "VN">("EN");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Separate Projects vs Certificates
  const { featuredProjects, certificates } = useMemo(() => {
    const feat: Project[] = [];
    const cert: Project[] = [];

    projects.forEach((item) => {
      const cat = (item.category || "").toLowerCase();
      if (cat.includes("certificate") || cat.includes("chứng chỉ")) {
        cert.push(item);
      } else {
        feat.push(item);
      }
    });

    return { featuredProjects: feat, certificates: cert };
  }, [projects]);

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
        icon: Github,
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

  // Structured Skills Matrix (Categorized)
  const skillsData = [
    {
      category: lang === "EN" ? "Languages" : "Ngôn ngữ",
      icon: Code,
      gradient: "from-blue-500/20 via-indigo-500/20 to-violet-500/20",
      skills: ["TypeScript", "JavaScript", "Python", "C# (.NET)", "C", "SQL", "PHP"],
    },
    {
      category: lang === "EN" ? "Frontend & Web" : "Giao diện & Web",
      icon: Layers,
      gradient: "from-cyan-500/20 via-teal-500/20 to-emerald-500/20",
      skills: ["Next.js (App Router)", "ReactJS", "Tailwind CSS", "Framer Motion", "HTML5/CSS3"],
    },
    {
      category: lang === "EN" ? "Backend & Cloud" : "Hệ thống & Cloud",
      icon: Cpu,
      gradient: "from-violet-500/20 via-purple-500/20 to-pink-500/20",
      skills: ["Node.js", "Notion API", "RESTful APIs", "MySQL", "SQLite", "PostgreSQL", "Vercel", "GitHub Actions"],
    },
    {
      category: lang === "EN" ? "AI & Automation" : "AI & Tự động hoá",
      icon: Sparkles,
      gradient: "from-amber-500/20 via-orange-500/20 to-rose-500/20",
      skills: [
        "Google Gemini API",
        "OpenRouter",
        "AI Agent Workflows",
        "Prompt Engineering (T.C.R.E.I)",
        "Antigravity",
        "Claude Code",
        "n8n",
        "Make",
      ],
    },
    {
      category: lang === "EN" ? "Design & Tools" : "Thiết kế & Công cụ",
      icon: Wrench,
      gradient: "from-pink-500/20 via-rose-500/20 to-indigo-500/20",
      skills: ["Figma", "Canva", "Adobe Photoshop", "Git", "GitHub", "Vercel Deployments"],
    },
  ];

  // Experience Data
  const experienceData = [
    {
      role_en: "Google Student Ambassador Trainer",
      role_vn: "Trainer Đại sứ Sinh viên Google (GSA Trainer)",
      org: "Google",
      period: "2026 – PRESENT",
      badge: "Google Internship Program",
      desc_en: [
        "Spearheaded GenAI and Prompt Engineering workshops across HCMC universities, driving AI adoption for 500+ diverse students.",
        "Engineered specialized AI Agents and deployed n8n automation workflows to manage email communication and participant datasets.",
        "Integrated AI tooling with Google Workspace / Office 365 to automate reporting pipelines and accelerate delivery.",
      ],
      desc_vn: [
        "Chủ trì các buổi workshop về GenAI và Kỹ nghệ Prompt tại các trường Đại học ở TP.HCM cho hơn 500+ sinh viên.",
        "Thiết kế và triển khai các AI Agent chuyên biệt kết hợp luồng tự động hóa n8n xử lý dữ liệu và hệ thống email tự động.",
        "Tích hợp các công cụ AI vào Google Workspace / Office 365 để tự động hóa báo cáo và tối ưu hóa quy trình làm việc.",
      ],
    },
    {
      role_en: "Top 200 Hackathon AI Riser Vietnam (ZeroLLM)",
      role_vn: "Top 200 Hackathon AI Riser Vietnam (Dự án ZeroLLM)",
      org: "AI Riser Vietnam 2026",
      period: "2026",
      badge: "National Hackathon Finalist",
      desc_en: [
        "Architected ZeroLLM — a 100% free AI directory that automatically discovers and verifies zero-cost LLM providers in real-time.",
        "Integrated Google Search Grounding with Gemini Flash to track and update active model endpoints dynamically.",
      ],
      desc_vn: [
        "Kiến trúc nên ZeroLLM — nền tảng tổng hợp và tự động tìm kiếm các nhà cung cấp API LLM miễn phí 100% theo thời gian thực.",
        "Ứng dụng Google Search Grounding kết hợp Gemini Flash để liên tục xác minh và cập nhật các model khả dụng.",
      ],
    },
    {
      role_en: "Frontend Development Intern",
      role_vn: "Thực tập sinh Phát triển Frontend",
      org: "Apps Cyclone",
      period: "2025",
      badge: "Frontend Engineering",
      desc_en: [
        "Translated Figma UI/UX designs into responsive, interactive website interfaces using ReactJS with pixel-perfect accuracy.",
        "Developed fully functional modular React components with comprehensive state management and CRUD operations.",
      ],
      desc_vn: [
        "Chuyển đổi thiết kế Figma UI/UX thành giao diện website tương tác mượt mà, chuẩn responsive bằng ReactJS.",
        "Xây dựng các component React dạng module hóa hoàn chỉnh với các thao tác CRUD và quản lý state tối ưu.",
      ],
    },
    {
      role_en: "WordPress Development Intern",
      role_vn: "Thực tập sinh Phát triển WordPress",
      org: "TBay",
      period: "2025",
      badge: "E-Commerce",
      desc_en: [
        "Constructed functional e-commerce web applications using WordPress, configuring custom themes and checkout plugins.",
      ],
      desc_vn: [
        "Xây dựng website thương mại điện tử hoàn chỉnh trên WordPress, tùy biến giao diện và tối ưu hóa luồng thanh toán.",
      ],
    },
  ];

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 antialiased selection:bg-indigo-500 selection:text-white transition-colors duration-500 font-sans overflow-x-hidden">
      
      {/* ── 3D AMBIENT BACKGROUND GLOWS ──────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/15 dark:bg-indigo-600/20 rounded-full blur-[120px] transform-gpu" />
        <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] bg-purple-500/15 dark:bg-purple-600/15 rounded-full blur-[140px] transform-gpu" />
        <div className="absolute bottom-10 left-1/4 w-[28rem] h-[28rem] bg-cyan-500/10 dark:bg-cyan-600/10 rounded-full blur-[130px] transform-gpu" />
      </div>

      {/* ── STICKY GLASS HEADER & NAV ────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/75 dark:bg-[#0B0F17]/75 border-b border-slate-200/80 dark:border-slate-800/80 transition-all duration-300">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Brand Logo with 3D gradient ring */}
          <a
            href="#"
            className="group flex items-center gap-2.5 transition-transform duration-300 hover:scale-105"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-[1.5px] shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-900 text-white font-black text-sm">
                Z
              </div>
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
              Zero<span className="text-indigo-600 dark:text-indigo-400">Vault</span>
            </span>
          </a>

          {/* Quick Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            <a href="#about" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              {lang === "EN" ? "About" : "Giới thiệu"}
            </a>
            <a href="#skills" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              {lang === "EN" ? "Skills" : "Kỹ năng"}
            </a>
            <a href="#experience" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              {lang === "EN" ? "Experience" : "Kinh nghiệm"}
            </a>
            <a href="#projects" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              {lang === "EN" ? "Projects" : "Dự án"}
            </a>
            <a href="#education" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              {lang === "EN" ? "Education" : "Học vấn"}
            </a>
          </nav>

          {/* Controls: Theme & Language */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-indigo-500/50 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all duration-200 shadow-sm"
              aria-label="Toggle theme"
            >
              {mounted ? (
                theme === "dark" ? (
                  <svg className="h-4 w-4 fill-amber-400" viewBox="0 0 20 20">
                    <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 fill-indigo-600" viewBox="0 0 24 24">
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
                } absolute left-1 top-1 h-7 w-10 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md transition-transform duration-300`}
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

      {/* ── 1. HERO SECTION ──────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 pt-12 md:pt-16 pb-8 text-center">
        {profileData && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            {/* Positioning Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold tracking-wide uppercase mb-5 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-spin-slow" />
              <span>
                {lang === "EN"
                  ? "AI Application Engineer • Solo Product Builder"
                  : "Kỹ sư Ứng dụng AI • Xây dựng Sản phẩm Độc lập"}
              </span>
            </div>

            {/* Name with 3D-feeling text shadow */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 dark:from-white dark:via-slate-100 dark:to-indigo-200">
                {lang === "VN" ? profileData.name_vn : profileData.name_en}
              </span>
            </h1>

            {/* Single-Line Typewriter Animation */}
            <TerminalTyping
              role={lang === "VN" ? profileData.role_vn : profileData.role_en}
              bio={lang === "VN" ? profileData.bio_vn : profileData.bio_en}
            />

            {/* Positioning Headline (Value Proposition) */}
            <p className="mt-3 text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
              {lang === "EN"
                ? "Building & shipping production-ready AI applications from concept to deployment with full ownership."
                : "Xây dựng và đưa các sản phẩm ứng dụng AI từ ý tưởng vào thực tế với tư duy làm chủ hệ thống trọn vẹn."}
            </p>

            {/* Date of Birth if configured */}
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

            {/* Social & Contact Buttons (Accessible in <10s) */}
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
                      className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold shadow-sm hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                    >
                      <Icon className="h-4 w-4 text-slate-500 group-hover:text-indigo-500 transition-colors" />
                      <span>{link.label}</span>
                    </a>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </section>

      {/* ── 2. ABOUT SECTION ────────────────────────────────────────────── */}
      <section id="about" className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-slate-900/5 dark:shadow-none relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <User className="h-5 w-5" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {lang === "EN" ? "About Me" : "Về Tôi"}
            </h2>
          </div>

          <div className="space-y-3 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
            <p>
              {lang === "EN"
                ? "I am an Information Technology student and AI Application Engineer with a passion for architecting practical, modern software. Operating with a solo-builder mindset, I orchestrate AI agents and engineering workflows to transform complex concepts into production-ready software with speed and precision."
                : "Tôi là sinh viên ngành Công nghệ Thông tin và Kỹ sư Ứng dụng AI, đam mê hiện thực hoá các ý tưởng công nghệ thành sản phẩm thực tế. Với tư duy solo builder và phương pháp chỉ đạo AI agent, tôi tập trung vào việc biến ý tưởng thành phần mềm hoàn chỉnh chạy trên production với tốc độ cao và tính ổn định."}
            </p>
            <p>
              {lang === "EN"
                ? "As a Google Student Ambassador Trainer, I actively deliver GenAI and prompt engineering workshops to hundreds of university students across Ho Chi Minh City. I believe in true engineering mastery: deeply understanding codebases, debugging edge cases, and owning every architectural decision from API design to serverless deployments."
                : "Với vai trò Trainer Đại sứ Sinh viên Google (GSA Trainer), tôi trực tiếp chia sẻ kiến thức về GenAI và kỹ nghệ Prompt cho hàng trăm sinh viên đại học tại TP.HCM. Tôi theo đuổi phong cách làm chủ kỹ thuật thực thụ: thấu hiểu từng dòng code, tự tay debug các trường hợp biên và nắm trọn vẹn kiến trúc hệ thống."}
            </p>
          </div>
        </motion.div>
      </section>

      {/* ── 3. SKILLS SECTION ────────────────────────────────────────────── */}
      <section id="skills" className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {lang === "EN" ? "Technical Skills" : "Kỹ Năng Công Nghệ"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {lang === "EN" ? "Categorized technology stack & specialized tools" : "Ngăn xếp công nghệ và công cụ chuyên sâu"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {skillsData.map((group, idx) => {
            const Icon = group.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="group relative rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-5 shadow-sm hover:shadow-xl hover:border-indigo-500/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${group.gradient} rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-500`} />
                <div className="flex items-center gap-2.5 mb-3.5">
                  <Icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-bold tracking-wide uppercase text-slate-800 dark:text-slate-200">
                    {group.category}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {group.skills.map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs group-hover:border-indigo-400/40 transition-colors"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── 4. EXPERIENCE & HIGHLIGHTS ──────────────────────────────────── */}
      <section id="experience" className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {lang === "EN" ? "Experience & Highlights" : "Kinh Nghiệm & Thành Tựu"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {lang === "EN" ? "Key industry engagements and leadership roles" : "Các vai trò thực tế và hoạt động nổi bật"}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {experienceData.map((exp, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: idx * 0.1 }}
              className="relative rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-6 sm:p-7 shadow-lg shadow-slate-900/5 hover:border-indigo-500/40 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                      {lang === "VN" ? exp.role_vn : exp.role_en}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                      {exp.badge}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
                    {exp.org}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 shrink-0">
                  {exp.period}
                </span>
              </div>

              <ul className="space-y-1.5 mt-3">
                {(lang === "VN" ? exp.desc_vn : exp.desc_en).map((bullet, bIdx) => (
                  <li key={bIdx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── 5. EDUCATION SECTION ────────────────────────────────────────── */}
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

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-6 sm:p-7 shadow-lg shadow-slate-900/5 hover:border-emerald-500/40 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {lang === "EN"
                  ? "Ly Tu Trong College of Ho Chi Minh City"
                  : "Trường Cao Đẳng Lý Tự Trọng TP.HCM"}
              </h3>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {lang === "EN"
                  ? "Information Technology (Class 25C2-LTM1)"
                  : "Chuyên ngành Công Nghệ Thông Tin (Lớp 25C2-LTM1)"}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="inline-block px-3 py-1 rounded-xl text-xs font-black bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                GPA: 3.5 / 4.0
              </span>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-mono">
                {lang === "EN" ? "Expected Graduation: 2027" : "Dự kiến tốt nghiệp: 2027"}
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── 6. FEATURED PROJECTS (CASE STUDY GRID) ──────────────────────── */}
      <section id="projects" className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Code className="h-5 w-5" />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                {lang === "EN" ? "Featured Case Studies" : "Dự Án Nổi Bật (Case Studies)"}
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              {lang === "EN"
                ? "In-depth engineering breakdowns showcasing architectural decisions, AI orchestration, and production outcomes."
                : "Phân tích kỹ thuật chuyên sâu thể hiện quyết định kiến trúc, khả năng làm chủ AI agent và kết quả thực tế."}
            </p>
          </div>
        </div>

        {/* Project 3D-feeling Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredProjects.map((project, index) => {
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
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative flex flex-col rounded-3xl border border-slate-200/90 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg shadow-slate-900/5 hover:shadow-2xl hover:border-indigo-500/50 hover:-translate-y-2 transition-all duration-300 cursor-pointer overflow-hidden"
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
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10">
                      <Code className="h-10 w-10 text-indigo-500/50" />
                    </div>
                  )}

                  {/* Category Tag Overlay */}
                  {project.category && (
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-900/80 backdrop-blur-md text-white border border-white/10 shadow-sm">
                        {project.category}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    {renderDateRange(project.project_date)}
                    {project.links && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                        <span>{lang === "EN" ? "View Case Study" : "Xem Chi Tiết"}</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {title}
                  </h3>

                  <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed flex-1">
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
      </section>

      {/* ── 7. CERTIFICATES & AWARDS (COMPACT LIST) ────────────────────── */}
      {certificates.length > 0 && (
        <section id="certificates" className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {lang === "EN" ? "Certificates & Accreditations" : "Chứng Chỉ & Thành Tựu Khác"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {lang === "EN" ? "Verified courses and technical completions" : "Các khóa đào tạo và chứng nhận đã hoàn thành"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {certificates.map((cert) => {
              const title =
                (lang === "EN" ? cert.title_en : cert.title_vn) ||
                cert.title_en ||
                cert.title_vn;

              return (
                <div
                  key={cert.id}
                  onClick={() => setSelectedProject(cert)}
                  className="group flex items-center justify-between p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 hover:border-amber-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-200 cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
                      <Award className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                        {title}
                      </h4>
                      {cert.project_date?.start && (
                        <p className="text-[11px] text-slate-400 font-mono">
                          {formatDate(cert.project_date.start)}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 group-hover:text-amber-500 transition-all" />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-slate-200/80 dark:border-slate-800/80 mt-16 py-8 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>
          © {new Date().getFullYear()} Nguyen Chi Thang • Built with Next.js 16, Notion CMS & Google Gemini AI.
        </p>
      </footer>

      {/* ── CASE STUDY DETAILS MODAL ────────────────────────────────────── */}
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
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wide bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
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
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 cursor-pointer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>{lang === "EN" ? "Open Live Project" : "Xem Trực Tiếp"}</span>
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
