"use client";

import React, { useState, useRef, useSyncExternalStore } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  ArrowUpRight,
  Award,
  Briefcase,
  Calendar,
  ChevronDown,
  Code2,
  Cpu,
} from "lucide-react";
import { useMagneticHandlers } from "./Magnetic";
import { Scroll3DSection, Tilt3DCard } from "./Scroll3D";
import type { ProfileData } from "../PortfolioUI";

export interface SkillGroupItem {
  category: string;
  skills: string[];
}

export interface ExperienceEntry {
  org: string;
  role: string;
  period?: string;
  badge?: string;
  bullets: string[];
}

export interface EducationEntry {
  school: string;
  major?: string;
  gpa?: string;
  period?: string;
  notes?: string;
}

export interface SocialLinkEntry {
  type: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface MoreInfoViewProps {
  lang: "EN" | "VN";
  profileName: string;
  profileData?: ProfileData | null;
  aboutParagraphs: string[];
  parsedExperiences: ExperienceEntry[];
  parsedSkills: SkillGroupItem[];
  parsedEducations: EducationEntry[];
  projectCount: number;
  certificateCount: number;
  projectTags: string[];
  socialLinks: SocialLinkEntry[];
  formatDate: (d: string | null) => string;
  onJumpToSection: (sectionId: string) => void;
  renderLinkifiedText: (text: string, className?: string) => React.ReactNode;
  renderTypingSubtitle: () => React.ReactNode;
}

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

function AppleHoverRow({
  children,
  onClick,
  ariaExpanded,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  ariaExpanded?: boolean;
}) {
  const { onPointerMove, onPointerLeave } = useMagneticHandlers(3);
  const sharedClass =
    "apple-list-row group block -mx-2.5 px-2.5 sm:-mx-3.5 sm:px-3.5 py-3.5 text-left";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-expanded={ariaExpanded}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        data-cursor="magnetic"
        className={`${sharedClass} w-[calc(100%+1.25rem)] sm:w-[calc(100%+1.75rem)] cursor-pointer`}
      >
        {children}
      </button>
    );
  }

  return (
    <div
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={sharedClass}
    >
      {children}
    </div>
  );
}

export default function MoreInfoView({
  lang,
  profileName,
  profileData,
  aboutParagraphs,
  parsedExperiences,
  parsedSkills,
  parsedEducations,
  projectCount,
  certificateCount,
  projectTags,
  socialLinks,
  formatDate,
  onJumpToSection,
  renderLinkifiedText,
  renderTypingSubtitle,
}: MoreInfoViewProps) {
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [openExpIdx, setOpenExpIdx] = useState<number | null>(0);
  const heroRef = useRef<HTMLDivElement | null>(null);

  const ctaMagnetic = useMagneticHandlers(5);
  const readMoreMagnetic = useMagneticHandlers(4);

  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    () => false
  );

  // Continuous GPU-only 3D Hero Parallax on scroll (1 lightweight ScrollObserver for Hero)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.968]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 22]);
  const heroRotateX = useTransform(scrollYProgress, [0, 1], [0, -3.2]);

  const primaryEmailHref = profileData?.email
    ? `mailto:${profileData.email}`
    : socialLinks[0]?.href || "#";

  const firstAbout = aboutParagraphs[0] || "";
  const extraAbout = aboutParagraphs.slice(1);
  const anyExpHasBullets = parsedExperiences.some(
    (e) => e.bullets && e.bullets.length > 0
  );

  const skillGroupsCount =
    parsedSkills.length > 0
      ? parsedSkills.reduce((acc, g) => acc + g.skills.length, 0)
      : projectTags.length;

  const bentoStats = [
    {
      id: "projects",
      label: lang === "EN" ? "Projects" : "Dự án",
      value: projectCount,
      sub: lang === "EN" ? "Shipped builds" : "Sản phẩm thực tế",
      icon: Code2,
      show: true,
    },
    {
      id: "certificates",
      label: lang === "EN" ? "Credentials" : "Chứng chỉ",
      value: certificateCount,
      sub: lang === "EN" ? "Verified awards" : "Chứng nhận quốc tế",
      icon: Award,
      show: certificateCount > 0,
    },
    {
      id: "experience",
      label: lang === "EN" ? "Experience" : "Kinh nghiệm",
      value: parsedExperiences.length,
      sub: lang === "EN" ? "Roles & teams" : "Vị trí đảm nhiệm",
      icon: Briefcase,
      show: parsedExperiences.length > 0,
    },
    {
      id: "skills",
      label: lang === "EN" ? "Tech Stack" : "Công nghệ",
      value: skillGroupsCount,
      sub: lang === "EN" ? "Tools & frameworks" : "Kỹ năng chuyên môn",
      icon: Cpu,
      show: skillGroupsCount > 0,
    },
  ].filter((s) => s.show);

  return (
    <div className="apple-shell pt-3 sm:pt-6 pb-6 space-y-6 sm:space-y-9">
      {/* 1. HERO & ABOUT 3D STUDIO CARD (#about) */}
      <section id="about" ref={heroRef} className="apple-perspective-stage">
        <motion.div
          style={
            reducedMotion
              ? undefined
              : {
                  scale: heroScale,
                  y: heroY,
                  rotateX: heroRotateX,
                  transformPerspective: 1200,
                  transformOrigin: "50% 0%",
                }
          }
          className="mx-auto w-full max-w-[1040px] rounded-[24px] sm:rounded-[32px] apple-surface-card p-5 sm:p-8 lg:p-10 will-change-transform"
        >
          {/* Top Social & Contact Row */}
          {socialLinks.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 sm:mb-7 border-b border-[var(--card-border)]">
              <div className="flex flex-wrap items-center gap-x-3.5 sm:gap-x-5 gap-y-1.5">
                {socialLinks
                  .filter((s) => s.type !== "email")
                  .map((link) => {
                    const Icon = link.icon;
                    return (
                      <SocialStatLink key={link.type} link={link} Icon={Icon} />
                    );
                  })}
              </div>

              <a
                href={primaryEmailHref}
                onPointerMove={ctaMagnetic.onPointerMove}
                onPointerLeave={ctaMagnetic.onPointerLeave}
                data-cursor="magnetic"
                className="magnetic-target inline-flex h-9 sm:h-10 items-center gap-1.5 px-3.5 sm:px-4 rounded-full bg-[var(--ink-primary)] text-[var(--background)] text-xs sm:text-[13px] font-semibold hover:opacity-85 hover:scale-[1.03] transition-all cursor-pointer"
              >
                <span>{lang === "EN" ? "Get in touch" : "Liên hệ ngay"}</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          {/* Editorial Headline & Bio */}
          <div className="max-w-3xl">
            <h1 className="apple-h1 text-[28px] sm:text-[40px] lg:text-[46px] font-semibold text-[var(--ink-primary)] mb-2 break-words">
              {profileName}
            </h1>

            {renderTypingSubtitle()}

            {profileData?.dob && (
              <p className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--pill-bg)] apple-hairline text-[12px] sm:text-[12.5px] font-medium tabular-nums text-[var(--ink-meta)]">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {lang === "VN"
                    ? `Ngày sinh: ${formatDate(profileData.dob)}`
                    : `Born: ${formatDate(profileData.dob)}`}
                </span>
              </p>
            )}

            {firstAbout && (
              <div className="mt-5 sm:mt-6 text-[15.5px] sm:text-[17.5px] leading-[1.7] text-[var(--ink-primary)]">
                <p>{renderLinkifiedText(firstAbout)}</p>

                {extraAbout.length > 0 && (
                  <>
                    <AnimatePresence initial={false}>
                      {aboutExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 space-y-4 text-[var(--ink-secondary)]">
                            {extraAbout.map((para, i) => (
                              <p key={i}>{renderLinkifiedText(para)}</p>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      type="button"
                      onClick={() => setAboutExpanded((prev) => !prev)}
                      onPointerMove={readMoreMagnetic.onPointerMove}
                      onPointerLeave={readMoreMagnetic.onPointerLeave}
                      data-cursor="magnetic"
                      className="magnetic-target mt-3 inline-flex min-h-[38px] items-center text-[14px] sm:text-[15px] font-semibold text-[var(--ink-meta)] hover:text-[var(--ink-primary)] transition-colors cursor-pointer"
                    >
                      {aboutExpanded
                        ? lang === "EN"
                          ? "Read Less"
                          : "Thu gọn"
                        : lang === "EN"
                        ? "Read More"
                        : "Đọc thêm"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Interactive 3D Bento Quick-Jump Strip (Responsive 2x2 on iPhone mini/7/X, 4 cols on sm+) */}
          {bentoStats.length > 0 && (
            <div className="mt-6 sm:mt-8 pt-6 border-t border-[var(--card-border)] grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
              {bentoStats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <Tilt3DCard
                    key={stat.id}
                    index={idx}
                    maxTilt={4}
                    onClick={() => onJumpToSection(stat.id)}
                    className="group rounded-[18px] sm:rounded-[20px] p-3.5 sm:p-4 bg-[var(--surface-elevated)]/85 hover:bg-[var(--surface-card-hover)] apple-hairline cursor-pointer text-left"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--pill-bg)] apple-hairline text-[var(--ink-primary)]">
                        <Icon className="h-4 w-4 opacity-85" />
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-[var(--ink-muted)] group-hover:text-[var(--ink-primary)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </div>
                    <p className="text-[20px] sm:text-[24px] font-semibold tabular-nums text-[var(--ink-primary)] leading-tight">
                      {stat.value}
                    </p>
                    <p className="text-xs sm:text-[13px] font-semibold text-[var(--ink-primary)] mt-0.5">
                      {stat.label}
                    </p>
                    <p className="text-[11px] text-[var(--ink-meta)] truncate">
                      {stat.sub}
                    </p>
                  </Tilt3DCard>
                );
              })}
            </div>
          )}
        </motion.div>
      </section>

      {/* 2. EXPERIENCE SECTION (#experience) */}
      {parsedExperiences.length > 0 && (
        <Scroll3DSection id="experience">
          <div className="mx-auto w-full max-w-[1040px] rounded-[24px] sm:rounded-[30px] apple-surface-card p-5 sm:p-8">
            <div className="flex items-baseline justify-between gap-3 mb-4">
              <h2 className="apple-h2 text-[22px] sm:text-[26px] font-semibold text-[var(--ink-primary)]">
                {lang === "EN" ? "Experience" : "Kinh nghiệm"}
              </h2>
              <span className="text-xs font-semibold tabular-nums text-[var(--ink-meta)]">
                {parsedExperiences.length}{" "}
                {lang === "EN" ? "roles" : "vị trí"}
              </span>
            </div>

            <div className="divide-y divide-[var(--card-border)] border-t border-b border-[var(--card-border)]">
              {parsedExperiences.map((exp, idx) => {
                const hasBullets = Boolean(exp.bullets && exp.bullets.length > 0);
                const isOpen = openExpIdx === idx;
                return (
                  <div key={idx} className="py-0.5">
                    <AppleHoverRow
                      onClick={
                        hasBullets
                          ? () => setOpenExpIdx(isOpen ? null : idx)
                          : undefined
                      }
                      ariaExpanded={hasBullets ? isOpen : undefined}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4">
                        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 min-w-0">
                          <span className="text-[16px] sm:text-[17.5px] font-semibold text-[var(--ink-primary)]">
                            {exp.org || exp.role}
                          </span>
                          {exp.org && exp.role && (
                            <span className="text-[14px] sm:text-[15.5px] text-[var(--ink-meta)]">
                              {exp.role}
                            </span>
                          )}
                          {exp.badge && (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[var(--pill-bg)] apple-hairline text-[var(--ink-primary)]">
                              {exp.badge}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                          {exp.period && (
                            <span className="text-[13px] sm:text-[14px] tabular-nums text-[var(--ink-meta)]">
                              {exp.period}
                            </span>
                          )}
                          {hasBullets ? (
                            <ChevronDown
                              className={`h-4 w-4 text-[var(--ink-meta)] transition-transform duration-200 ${
                                isOpen ? "rotate-180" : ""
                              }`}
                            />
                          ) : anyExpHasBullets ? (
                            <span
                              className="hidden sm:inline-block w-4"
                              aria-hidden="true"
                            />
                          ) : null}
                        </div>
                      </div>
                    </AppleHoverRow>

                    <AnimatePresence initial={false}>
                      {hasBullets && isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <ul className="pl-2.5 sm:pl-4 pr-2 pb-4 pt-1 space-y-2 text-[14px] sm:text-[15px] leading-[1.65] text-[var(--ink-secondary)]">
                            {exp.bullets.map((b, bIdx) => (
                              <li key={bIdx} className="flex items-start gap-2.5">
                                <span
                                  className="mt-2.5 h-1.5 w-1.5 rounded-full bg-[var(--ink-meta)] shrink-0"
                                  aria-hidden="true"
                                />
                                <span>{renderLinkifiedText(b)}</span>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </Scroll3DSection>
      )}

      {/* 3. TECHNICAL SKILLS SECTION (#skills) */}
      {(parsedSkills.length > 0 || projectTags.length > 0) && (
        <Scroll3DSection id="skills">
          <div className="mx-auto w-full max-w-[1040px] rounded-[24px] sm:rounded-[30px] apple-surface-card p-5 sm:p-8">
            <h2 className="apple-h2 text-[22px] sm:text-[26px] font-semibold text-[var(--ink-primary)] mb-4">
              {lang === "EN" ? "Technical Skills" : "Kỹ năng công nghệ"}
            </h2>

            {parsedSkills.length > 0 ? (
              <div className="divide-y divide-[var(--card-border)] border-t border-b border-[var(--card-border)]">
                {parsedSkills.map((group, idx) => (
                  <div key={idx} className="py-0.5">
                    <AppleHoverRow>
                      <div className="grid grid-cols-1 sm:grid-cols-[210px_minmax(0,1fr)] gap-1 sm:gap-6 items-baseline">
                        <span className="text-[15.5px] sm:text-[16.5px] font-semibold text-[var(--ink-primary)]">
                          {group.category}
                        </span>
                        <span className="text-[14px] sm:text-[15px] leading-[1.65] text-[var(--ink-secondary)]">
                          {group.skills.join(" · ")}
                        </span>
                      </div>
                    </AppleHoverRow>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {projectTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 rounded-xl text-[13px] font-medium bg-[var(--pill-bg)] apple-hairline text-[var(--ink-secondary)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Scroll3DSection>
      )}

      {/* 4. EDUCATION SECTION (#education) */}
      {parsedEducations.length > 0 && (
        <Scroll3DSection id="education">
          <div className="mx-auto w-full max-w-[1040px] rounded-[24px] sm:rounded-[30px] apple-surface-card p-5 sm:p-8">
            <h2 className="apple-h2 text-[22px] sm:text-[26px] font-semibold text-[var(--ink-primary)] mb-4">
              {lang === "EN" ? "Education" : "Học vấn"}
            </h2>

            <div className="divide-y divide-[var(--card-border)] border-t border-b border-[var(--card-border)]">
              {parsedEducations.map((edu, idx) => (
                <div key={idx} className="py-0.5">
                  <AppleHoverRow>
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4">
                      <div className="min-w-0">
                        <span className="text-[16px] sm:text-[17.5px] font-semibold text-[var(--ink-primary)]">
                          {edu.school}
                        </span>
                        {edu.major && (
                          <span className="block sm:inline sm:ml-2.5 text-[14px] sm:text-[15.5px] text-[var(--ink-meta)]">
                            {edu.major}
                          </span>
                        )}
                        {edu.notes && (
                          <p className="text-[13.5px] text-[var(--ink-meta)] mt-0.5">
                            {edu.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {edu.gpa && (
                          <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold tabular-nums bg-[var(--pill-bg)] apple-hairline text-[var(--ink-primary)]">
                            {edu.gpa}
                          </span>
                        )}
                        {edu.period && (
                          <span className="text-[13px] sm:text-[14px] tabular-nums text-[var(--ink-meta)]">
                            {edu.period}
                          </span>
                        )}
                      </div>
                    </div>
                  </AppleHoverRow>
                </div>
              ))}
            </div>
          </div>
        </Scroll3DSection>
      )}
    </div>
  );
}

function SocialStatLink({
  link,
  Icon,
}: {
  link: SocialLinkEntry;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  const { onPointerMove, onPointerLeave } = useMagneticHandlers(4);
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      data-cursor="magnetic"
      className="magnetic-target inline-flex min-h-[36px] items-center gap-1.5 text-[13px] sm:text-[13.5px] font-medium text-[var(--ink-meta)] hover:text-[var(--ink-primary)] hover:scale-[1.04] transition-all cursor-pointer"
    >
      <Icon className="h-4 w-4 opacity-80" />
      <span>{link.label}</span>
    </a>
  );
}
