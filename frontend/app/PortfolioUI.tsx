"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Code, Briefcase, Camera, Mail } from "lucide-react";

// ── LinkifiedText ─────────────────────────────────────────────────────────────
// Detects URLs (http/https/www) inside plain text and renders them as styled
// anchor tags: dark-blue, bold, pointer cursor, opens in a new tab.
// All other text is rendered as plain React nodes.
const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;

function LinkifiedText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const parts = text.split(URL_REGEX);
  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (URL_REGEX.test(part)) {
          // Reset lastIndex after test() so subsequent calls work correctly
          URL_REGEX.lastIndex = 0;
          const href = part.startsWith("www.") ? `https://${part}` : part;
          return (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-bold text-blue-700 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 underline underline-offset-2 cursor-pointer transition-colors duration-150 break-all"
            >
              {part}
            </a>
          );
        }
        URL_REGEX.lastIndex = 0;
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </span>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

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
  project_date?: {
    start: string | null;
    end: string | null;
  };
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

const tagThemes = [
  'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20',
  'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
  'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'
];

const getTagStyle = (tagName: string): string => {
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash += tagName.charCodeAt(i);
  }
  return tagThemes[hash % tagThemes.length];
};

const getVisitButtonText = (category: string | undefined, lang: "EN" | "VN") => {
  const cleanCategory = (category || "Project").trim();
  const lowerCategory = cleanCategory.toLowerCase();

  const translations: Record<string, { en: string; vn: string }> = {
    project: { en: "Project", vn: "Dự án" },
    certificate: { en: "Certification", vn: "Chứng chỉ" },
  };

  if (lang === "EN") {
    const displayCategory = translations[lowerCategory]?.en || cleanCategory;
    return `Visit ${displayCategory}`;
  } else {
    const displayCategory = translations[lowerCategory]?.vn || cleanCategory;
    return `Truy cập ${displayCategory}`;
  }
};


export default function PortfolioUI({ projects = [], profileData = null }: PortfolioUIProps) {
  const [activeTab, setActiveTab] = useState<string>("All");
  const [lang, setLang] = useState<"EN" | "VN">("EN");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Notion-style search / filter / sort states
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<string>("newest");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch for client-only state (theme)
  useEffect(() => {
    setMounted(true);
  }, []);

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
        icon: Code,
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

  // Reset page to 1 when filters or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, sortOrder, selectedTags]);

  // 1. Helper function to format dates localized deterministically (no hydration errors)
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    
    const parts = dateString.split("-");
    if (parts.length !== 3) {
      return dateString;
    }

    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10);
    const dayIndex = parseInt(parts[2], 10);

    const day = String(dayIndex).padStart(2, "0");
    const month = String(monthIndex).padStart(2, "0");

    if (lang === "VN") {
      return `${day}/${month}/${year}`;
    } else {
      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const monthName = months[monthIndex - 1] || "";
      return `${monthName} ${dayIndex}, ${year}`;
    }
  };

  // 2. Helper function to render formatted date range like Notion
  const renderDateRange = (projectDate?: { start: string | null; end: string | null }) => {
    if (!projectDate?.start) return null;
    const startFormatted = formatDate(projectDate.start);
    const endFormatted = projectDate.end ? formatDate(projectDate.end) : "";
    
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 mt-2">
        <svg className="h-4 w-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <span>
          {startFormatted}
          {endFormatted ? <> &rarr; {endFormatted}</> : null}
        </span>
      </p>
    );
  };

  // 3. Dynamically extract unique categories
  const categories = useMemo(() => {
    const unique = new Set(
      projects.map((p) => p.category).filter(Boolean)
    );
    return ["All", ...Array.from(unique)];
  }, [projects]);

  // 4. Dynamically extract all unique tags
  const uniqueTags = useMemo(() => {
    const allTags = projects.flatMap((p) => p.tags || []);
    return Array.from(new Set(allTags)).filter(Boolean);
  }, [projects]);

  // 5. Filter and sort projects based on dynamic controls
  const filteredAndSortedProjects = useMemo(() => {
    // ── Safety guard: only render fully Published items ──────────────────────
    // This is a second layer of defence on top of the Notion API filter.
    let result = projects.filter((p) => p.status === "Published");

    // Category filter
    if (activeTab !== "All") {
      result = result.filter((p) => p.category === activeTab);
    }

    // Tag filter (project must match ALL selected tags)
    if (selectedTags.length > 0) {
      result = result.filter((p) =>
        selectedTags.every((tag) => p.tags?.includes(tag))
      );
    }

    // Sort order — always sort by actual start date so the order is deterministic
    if (sortOrder === "newest" || sortOrder === "oldest") {
      result.sort((a, b) => {
        // Items with no date are pushed to the end regardless of sort direction
        const dateA = a.project_date?.start ? new Date(a.project_date.start).getTime() : -Infinity;
        const dateB = b.project_date?.start ? new Date(b.project_date.start).getTime() : -Infinity;
        return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
      });
    } else if (sortOrder === "a-z") {
      result.sort((a, b) => {
        const titleA = (lang === "EN" ? a.title_en : a.title_vn) || a.title_en || a.title_vn || "";
        const titleB = (lang === "EN" ? b.title_en : b.title_vn) || b.title_en || b.title_vn || "";
        return titleA.localeCompare(titleB, lang === "VN" ? "vi" : "en");
      });
    }

    return result;
  }, [projects, activeTab, selectedTags, sortOrder, lang]);

  const ITEMS_PER_PAGE = 6;
  const totalPages = Math.ceil(filteredAndSortedProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = useMemo(() => {
    return filteredAndSortedProjects.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filteredAndSortedProjects, currentPage]);

  console.log("Raw Project Data:", projects);

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-8 min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-20 transition-colors duration-300">
      
      {/* ── HEADER & NAVIGATION ────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-950/80 backdrop-blur-md transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5 flex items-center justify-between w-full">
          
          <h1 className="text-2xl font-bold tracking-tight text-left text-slate-900 dark:text-white animate-fade-in">
            Portfolio
          </h1>

          {/* Right Side: Theme & Language controllers */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-all duration-200 cursor-pointer animate-fade-in"
              aria-label="Toggle theme"
            >
              {mounted ? (
                theme === "dark" ? (
                  // Sun Icon
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.02.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.01c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z" />
                  </svg>
                ) : (
                  // Moon Icon
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.3 22h-.1c-5.5 0-10-4.5-10-10C2.2 6.8 6.5 2.5 11.9 2.2c.5 0 .9.3 1.1.8s-.1.9-.5 1.2C11 5.4 10 7.2 10 9.2c0 3.8 3.1 6.9 6.9 6.9 2 0 3.8-1 5-2.5.3-.4.8-.5 1.2-.3s.7.7.5 1.2c-.8 3.8-3.9 6.6-7.8 7.4-.5.1-1 .1-1.5.1z" />
                  </svg>
                )
              ) : (
                <div className="h-5 w-5 rounded-full bg-slate-300 dark:bg-slate-700 animate-pulse" />
              )}
            </button>

            {/* Language Toggle Switch */}
            <button
              onClick={() => setLang(lang === "EN" ? "VN" : "EN")}
              className="relative inline-flex h-8 w-24 cursor-pointer items-center rounded-full bg-slate-200 dark:bg-slate-800 p-1 transition-colors duration-300 focus:outline-none"
              aria-label="Toggle language"
            >
              <span
                className={`${
                  lang === "VN" ? "translate-x-11" : "translate-x-0"
                } absolute left-1 top-1 h-6 w-11 rounded-full bg-indigo-600 dark:bg-indigo-500 transition-transform duration-300`}
              />
              <span className="relative z-10 flex w-full justify-between px-2 text-[10px] font-semibold uppercase tracking-wider antialiased select-none pointer-events-none">
                <span className={`w-11 text-center transition-colors duration-300 ${lang === "EN" ? "text-white" : "text-slate-500 dark:text-slate-400"}`}>
                  EN
                </span>
                <span className={`w-11 text-center transition-colors duration-300 ${lang === "VN" ? "text-white" : "text-slate-500 dark:text-slate-400"}`}>
                  VN
                </span>
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ── PROFILE BIO SECTION ────────────────────────────────────────── */}
      {profileData && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8 animate-fade-in">
          <div className="flex flex-col items-center text-center w-full max-w-4xl mx-auto p-6 md:p-8 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-200 dark:border-slate-700/50 shadow-lg dark:shadow-2xl gap-4">
            
            {/* Top Section (Personal Info) */}
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-2 text-center text-slate-900 dark:text-white">
              {lang === 'VN' ? profileData.name_vn : profileData.name_en}
            </h2>
            <p className="text-lg md:text-xl font-medium text-indigo-600 dark:text-indigo-400 mb-1 text-center">
              {lang === "VN" ? profileData.role_vn : profileData.role_en}
            </p>
            
            {profileData.dob && (
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2 mb-3">
                <svg className="h-4 w-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>{lang === "VN" ? `Ngày sinh: ${formatDate(profileData.dob)}` : `Born: ${formatDate(profileData.dob)}`}</span>
              </p>
            )}

            {(lang === "VN" ? profileData.bio_vn : profileData.bio_en) && (
              <p className="text-base text-slate-700 dark:text-slate-300 max-w-2xl leading-relaxed text-center">
                {lang === "VN" ? profileData.bio_vn : profileData.bio_en}
              </p>
            )}

            {/* Bottom Section (Social/Contact Links) */}
            {socialLinks.length > 0 && (
              <div className="mt-4 md:mt-6 w-full flex flex-row flex-wrap justify-center items-center gap-3 md:gap-6">
                {socialLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <a
                      key={link.type}
                      href={link.href}
                      target={link.type === "email" ? undefined : "_blank"}
                      rel={link.type === "email" ? undefined : "noopener noreferrer"}
                      className={`flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 hover:text-indigo-600 dark:hover:text-indigo-300 hover:border-indigo-300 dark:hover:border-indigo-500/50 rounded-full transition-all text-sm md:text-base ${
                        link.type === "email" ? "h-auto py-2" : ""
                      }`}
                    >
                      <Icon className="h-4 w-4 md:h-5 md:w-5 shrink-0" />
                      <span className={
                        link.type === "email"
                          ? "break-all whitespace-normal text-center"
                          : "truncate max-w-[150px] sm:max-w-none"
                      }>
                        {link.label}
                      </span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── CATEGORY TABS ──────────────────────────────────────────────── */}
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 mt-6">
        <div 
          className="flex overflow-x-auto flex-nowrap gap-3 pb-2 border-b border-slate-200 dark:border-slate-800 snap-x snap-mandatory hide-scrollbar transition-colors duration-300"
        >
          {categories.map((cat) => {
            const isActive = activeTab === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setActiveTab(cat);
                  setSelectedTags([]); // Reset tag filters when switching main categories
                }}
                className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 shrink-0 snap-start ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    : "bg-slate-200/65 text-slate-600 hover:bg-slate-300 hover:text-slate-900 dark:bg-slate-800/65 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── CONTROL BAR FOR MOBILE ────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 mt-4 flex md:hidden items-center justify-between">
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-all duration-200 cursor-pointer"
        >
          <span>{lang === "EN" ? "Filter & Sort ⚙️" : "Bộ lọc & Sắp xếp ⚙️"}</span>
          <svg
            className={`h-4 w-4 transform transition-transform duration-200 ${isFilterOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Clear Filters (Reset button) visible on mobile control bar if filters active */}
        {(selectedTags.length > 0 || activeTab !== "All") && (
          <button
            onClick={() => {
              setActiveTab("All");
              setSelectedTags([]);
            }}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            {lang === "EN" ? "Clear Filters" : "Xoá bộ lọc"}
          </button>
        )}
      </div>

      {/* ── FILTER & SORT CONTROLS ────────────────────────────────────── */}
      <section 
        className={`mx-auto max-w-7xl px-4 sm:px-6 mt-4 flex-col gap-4 md:flex ${
          isFilterOpen ? "flex" : "hidden md:flex"
        }`}
      >
        {/* Sort select & reset panel */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-900 pb-4 transition-colors duration-300">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {lang === "EN" ? "Sort By" : "Sắp xếp"}
            </span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 outline-none hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-750"
            >
              <option value="newest">{lang === "EN" ? "Newest" : "Mới nhất"}</option>
              <option value="oldest">{lang === "EN" ? "Oldest" : "Cũ nhất"}</option>
              <option value="a-z">A - Z</option>
            </select>
          </div>

          {/* Reset Filters button - hidden on mobile drawer since we have it on the mobile control bar */}
          {(selectedTags.length > 0 || activeTab !== "All") && (
            <button
              onClick={() => {
                setActiveTab("All");
                setSelectedTags([]);
              }}
              className="hidden md:block text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer self-start sm:self-center"
            >
              {lang === "EN" ? "Clear Filters" : "Xoá bộ lọc"}
            </button>
          )}
        </div>

        {/* Dynamic Tag Filters — wraps naturally on all screen sizes */}
        {uniqueTags.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-2">
            {uniqueTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedTags(selectedTags.filter((t) => t !== tag));
                    } else {
                      setSelectedTags([...selectedTags, tag]);
                    }
                  }}
                  className={`cursor-pointer px-3 py-1 rounded-full text-[10px] font-medium transition-all duration-200 border ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100 shadow-sm border-2"
                      : `${getTagStyle(tag)} hover:opacity-85`
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ── PROJECTS GRID ──────────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        {filteredAndSortedProjects.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 dark:bg-slate-950/40 rounded-3xl border border-slate-200 dark:border-slate-800/80 transition-colors duration-300">
            <span className="text-4xl">🔎</span>
            <h3 className="mt-4 text-lg font-bold text-slate-700 dark:text-slate-300">
              {lang === "EN" ? "No projects found" : "Không tìm thấy dự án nào"}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {lang === "EN" ? "Try adjusting filter/sort options." : "Hãy thử thay đổi tùy chọn bộ lọc/sắp xếp."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full min-w-[200px]">
              {paginatedProjects.map((project, index) => {
                const title =
                  (lang === "EN" ? project.title_en : project.title_vn) ||
                  project.title_en ||
                  project.title_vn ||
                  "Untitled Project";

                const hasImage = project.images && project.images[0];

                return (
                  <motion.div
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-xl dark:shadow-none hover:border-indigo-300 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900/60 transition-all duration-300 hover:-translate-y-1.5 dark:hover:border-slate-700 dark:hover:shadow-indigo-505/5 cursor-pointer"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                  >
                    {/* Card Image */}
                    <div className="relative w-full overflow-hidden transition-colors duration-300">
                      {hasImage ? (
                        <img
                          src={project.images[0]}
                          alt={title}
                          className="w-full aspect-[16/10] object-cover object-top transition-transform duration-500 hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex aspect-[16/10] w-full items-center justify-center bg-gradient-to-br from-indigo-50 via-slate-100 to-purple-55 dark:from-indigo-950 dark:via-slate-900 dark:to-purple-950">
                          <span className="text-3xl opacity-50 dark:opacity-40">💻</span>
                        </div>
                      )}
                    </div>

                    {/* Card Details */}
                    <div className="flex flex-1 flex-col p-6">
                      {project.category && (
                        <span className="mb-2 w-fit rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[9px] font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-300">
                          {project.category}
                        </span>
                      )}

                      <h3 className="text-lg font-bold text-slate-905 dark:text-white">
                        {title}
                      </h3>

                      {/* Date display below Title */}
                      {renderDateRange(project.project_date)}
                      
                      <LinkifiedText
                        className="mt-2 text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed flex-1 block"
                        text={
                          lang === "EN"
                            ? project.desc_en || project.desc_vn
                            : project.desc_vn || project.desc_en
                        }
                      />

                      {/* Tags (Deterministic colors) */}
                      {project.tags && project.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {project.tags.slice(0, 3).map((tag, idx) => {
                            return (
                              <span
                                key={idx}
                                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${getTagStyle(tag)}`}
                              >
                                {tag}
                              </span>
                            );
                          })}
                          {project.tags.length > 3 && (
                            <span className="text-[10px] text-slate-505 dark:text-slate-500 self-center font-bold">
                              +{project.tags.length - 3}
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
            {totalPages > 1 && (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="cursor-pointer px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 bg-slate-200/65 text-slate-600 hover:bg-slate-300 hover:text-slate-900 dark:bg-slate-800/65 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {"<-"}
                </button>
                <span className="text-sm font-medium">
                  Page {currentPage} of {totalPages || 1}
                </span>
                <button
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="cursor-pointer px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 bg-slate-200/65 text-slate-600 hover:bg-slate-300 hover:text-slate-900 dark:bg-slate-800/65 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {"->"}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── DETAIL MODAL OVERLAY ───────────────────────────────────────── */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/85 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="w-full max-w-2xl flex flex-col bg-slate-900 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button (X) - always visible top-right */}
            <button
              onClick={() => setSelectedProject(null)}
              className="absolute right-4 top-4 z-50 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-950/80 hover:bg-slate-950 text-slate-300 hover:text-white transition-colors duration-200 border border-slate-800/50 shadow-sm"
              aria-label="Close modal"
            >
              ✕
            </button>

            {/* Inner Content Wrapper — vertical on ALL screen sizes */}
            <div className="flex flex-col max-h-[80vh] overflow-y-auto">
              
              {/* Top Section: Media/Image */}
              <div className="w-full shrink-0 relative bg-black/50 h-[40vw] min-h-[200px] max-h-[300px]">
                {selectedProject.images && selectedProject.images[0] ? (
                  <img
                    src={selectedProject.images[0]}
                    alt={selectedProject.title_en}
                    className="w-full h-full absolute inset-0 object-contain"
                  />
                ) : (
                  <div className="flex w-full h-full absolute inset-0 items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950">
                    <span className="text-5xl opacity-50 dark:opacity-40">💻</span>
                  </div>
                )}
              </div>

              {/* Bottom Section: Info & Actions */}
              <div className="w-full p-6 flex flex-col gap-1 text-white">
                <div>
                  {selectedProject.category && (
                    <span className="mb-3 inline-block rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-3.5 py-1 text-[10px] font-extrabold tracking-widest uppercase text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/20">
                      {selectedProject.category}
                    </span>
                  )}

                  <h3 className="text-2xl font-extrabold text-white">
                    {lang === "EN"
                      ? selectedProject.title_en || selectedProject.title_vn
                      : selectedProject.title_vn || selectedProject.title_en}
                  </h3>

                  {/* Date display below Title in Modal */}
                  {renderDateRange(selectedProject.project_date)}

                  {/* Tags Directly */}
                  {selectedProject.tags && selectedProject.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {selectedProject.tags.map((tag, idx) => {
                        return (
                          <span
                            key={idx}
                            className={`inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold ${getTagStyle(tag)}`}
                          >
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="mt-4 text-slate-300">
                  <LinkifiedText
                    className="leading-relaxed text-sm block"
                    text={
                      lang === "EN"
                        ? selectedProject.desc_en || selectedProject.desc_vn
                        : selectedProject.desc_vn || selectedProject.desc_en
                    }
                  />
                </div>

                {/* Actions footer */}
                <div className="mt-6 pt-4 flex justify-end gap-4 border-t border-slate-800">
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors duration-200"
                  >
                    {lang === "EN" ? "Close" : "Đóng"}
                  </button>
                  {selectedProject.links && (
                    <a
                      href={selectedProject.links}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all duration-200"
                    >
                      {getVisitButtonText(selectedProject.category, lang)} ↗
                    </a>
                  )}
                </div>

              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
