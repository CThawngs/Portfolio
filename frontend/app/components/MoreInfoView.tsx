"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronDown } from "lucide-react";
import { useMagneticHandlers } from "./Magnetic";
import { Scroll3DSection } from "./Scroll3D";
import { getTagColorScheme, type TagColorScheme } from "./tagPalette";
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
  projectTags: string[];
  tagColorMap?: Map<string, TagColorScheme>;
  socialLinks: SocialLinkEntry[];
  formatDate: (d: string | null) => string;
  renderLinkifiedText: (text: string, className?: string) => React.ReactNode;
  renderTypingSubtitle: () => React.ReactNode;
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
  const { onPointerEnter, onPointerMove, onPointerLeave } =
    useMagneticHandlers(3);
  const sharedClass =
    "apple-list-row group block -mx-2 px-2 sm:-mx-3.5 sm:px-3.5 py-3 sm:py-3.5 text-left";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-expanded={ariaExpanded}
        onPointerEnter={onPointerEnter}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        data-cursor="magnetic"
        className={`${sharedClass} w-[calc(100%+1rem)] sm:w-[calc(100%+1.75rem)] cursor-pointer`}
      >
        {children}
      </button>
    );
  }

  return (
    <div
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={sharedClass}
    >
      {children}
    </div>
  );
}

function HeroSocialIconButton({ link }: { link: SocialLinkEntry }) {
  const { onPointerEnter, onPointerMove, onPointerLeave } =
    useMagneticHandlers(5);
  const Icon = link.icon;
  const isMail = link.type === "email" || link.href.startsWith("mailto:");

  return (
    <a
      href={link.href}
      target={isMail ? undefined : "_blank"}
      rel={isMail ? undefined : "noopener noreferrer"}
      aria-label={link.label}
      title={link.label}
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      data-cursor="magnetic"
      className="magnetic-target group relative inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-[13px] sm:rounded-[14px] bg-[var(--pill-bg)] hover:bg-[var(--pill-active-bg)] apple-hairline text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:scale-[1.06] transition-all cursor-pointer"
    >
      <Icon className="h-[18px] w-[18px] sm:h-[19px] sm:w-[19px]" />
    </a>
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
  projectTags,
  tagColorMap,
  socialLinks,
  formatDate,
  renderLinkifiedText,
  renderTypingSubtitle,
}: MoreInfoViewProps) {
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [openExpIdx, setOpenExpIdx] = useState<number | null>(0);

  const readMoreMagnetic = useMagneticHandlers(4);

  const firstAbout = aboutParagraphs[0] || "";
  const extraAbout = aboutParagraphs.slice(1);
  const anyExpHasBullets = parsedExperiences.some(
    (e) => e.bullets && e.bullets.length > 0
  );

  return (
    <div className="apple-shell pt-2 sm:pt-5 pb-4 sm:pb-6 space-y-5 sm:space-y-8">
      {/* 1. HERO & ABOUT CARD (#about) — Centered & Zero Scroll-Linked Transform Overhead */}
      <section id="about" className="relative">
        <div className="mx-auto w-full max-w-[1040px] rounded-[22px] sm:rounded-[30px] apple-surface-card p-5 sm:p-8 lg:p-10">
          {/* Centered & Symmetrically Balanced Personal Info Block */}
          <div className="mx-auto max-w-3xl flex flex-col items-center text-center">
            <h1 className="apple-h1 text-[24px] min-[380px]:text-[28px] sm:text-[40px] lg:text-[46px] font-semibold text-[var(--ink-primary)] mb-2 text-balance break-words">
              {profileName}
            </h1>

            <div className="w-full flex justify-center">
              {renderTypingSubtitle()}
            </div>

            {profileData?.dob && (
              <p className="mt-3 mx-auto inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-[var(--pill-bg)] apple-hairline text-[12px] sm:text-[12.5px] font-medium tabular-nums text-[var(--ink-meta)]">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {lang === "VN"
                    ? `Ngày sinh: ${formatDate(profileData.dob)}`
                    : `Born: ${formatDate(profileData.dob)}`}
                </span>
              </p>
            )}

            {firstAbout && (
              <div className="mt-5 sm:mt-6 w-full max-w-[64ch] mx-auto text-[14.5px] sm:text-[17px] leading-[1.72] text-[var(--ink-primary)] text-center sm:text-justify sm:[text-align-last:center]">
                <p>{renderLinkifiedText(firstAbout)}</p>

                {extraAbout.length > 0 && (
                  <>
                    <AnimatePresence initial={false}>
                      {aboutExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            duration: 0.3,
                            ease: [0.22, 1, 0.36, 1],
                          }}
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

                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => setAboutExpanded((prev) => !prev)}
                        onPointerEnter={readMoreMagnetic.onPointerEnter}
                        onPointerMove={readMoreMagnetic.onPointerMove}
                        onPointerLeave={readMoreMagnetic.onPointerLeave}
                        data-cursor="magnetic"
                        className="magnetic-target mt-3 inline-flex min-h-[38px] items-center justify-center text-[14px] sm:text-[15px] font-semibold text-[var(--ink-meta)] hover:text-[var(--ink-primary)] transition-colors cursor-pointer"
                      >
                        {aboutExpanded
                          ? lang === "EN"
                            ? "Read Less"
                            : "Thu gọn"
                          : lang === "EN"
                          ? "Read More"
                          : "Đọc thêm"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Centered & Evenly Spaced Bottom Contact & Social Media Icon Links */}
          {socialLinks.length > 0 && (
            <div className="mt-5 sm:mt-7 pt-5 w-full max-w-md mx-auto border-t border-[var(--card-border)] flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              {socialLinks.map((link) => (
                <HeroSocialIconButton key={link.type} link={link} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 2. EXPERIENCE SECTION (#experience) */}
      {parsedExperiences.length > 0 && (
        <Scroll3DSection id="experience">
          <div className="mx-auto w-full max-w-[1040px] rounded-[22px] sm:rounded-[30px] apple-surface-card p-4 sm:p-8">
            <div className="flex items-baseline justify-between gap-3 mb-3.5 sm:mb-4">
              <h2 className="apple-h2 text-[20px] sm:text-[26px] font-semibold text-[var(--ink-primary)]">
                {lang === "EN" ? "Experience" : "Kinh nghiệm"}
              </h2>
              <span className="text-xs font-semibold tabular-nums text-[var(--ink-meta)] shrink-0">
                {parsedExperiences.length}{" "}
                {lang === "EN" ? "roles" : "vị trí"}
              </span>
            </div>

            <div className="divide-y divide-[var(--card-border)] border-t border-b border-[var(--card-border)]">
              {parsedExperiences.map((exp, idx) => {
                const hasBullets = Boolean(
                  exp.bullets && exp.bullets.length > 0
                );
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
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5 sm:gap-4">
                        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 min-w-0">
                          <span className="text-[15.5px] sm:text-[17.5px] font-semibold text-[var(--ink-primary)] break-words">
                            {exp.org || exp.role}
                          </span>
                          {exp.org && exp.role && (
                            <span className="text-[13.5px] sm:text-[15.5px] text-[var(--ink-meta)] break-words">
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
                            <span className="text-[12.5px] sm:text-[14px] tabular-nums text-[var(--ink-meta)]">
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
                          transition={{
                            duration: 0.24,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="overflow-hidden"
                        >
                          <ul className="pl-2 sm:pl-4 pr-1 sm:pr-2 pb-3.5 sm:pb-4 pt-1 space-y-2 text-[13.5px] sm:text-[15px] leading-[1.65] text-[var(--ink-secondary)]">
                            {exp.bullets.map((b, bIdx) => (
                              <li
                                key={bIdx}
                                className="flex items-start gap-2.5"
                              >
                                <span
                                  className="mt-2.5 h-1.5 w-1.5 rounded-full bg-[var(--ink-meta)] shrink-0"
                                  aria-hidden="true"
                                />
                                <span className="break-words">
                                  {renderLinkifiedText(b)}
                                </span>
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
          <div className="mx-auto w-full max-w-[1040px] rounded-[22px] sm:rounded-[30px] apple-surface-card p-4 sm:p-8">
            <h2 className="apple-h2 text-[20px] sm:text-[26px] font-semibold text-[var(--ink-primary)] mb-3.5 sm:mb-4">
              {lang === "EN" ? "Technical Skills" : "Kỹ năng công nghệ"}
            </h2>

            {parsedSkills.length > 0 ? (
              <div className="divide-y divide-[var(--card-border)] border-t border-b border-[var(--card-border)]">
                {parsedSkills.map((group, idx) => (
                  <div key={idx} className="py-0.5">
                    <AppleHoverRow>
                      <div className="grid grid-cols-1 sm:grid-cols-[210px_minmax(0,1fr)] gap-1 sm:gap-6 items-baseline">
                        <span className="text-[15px] sm:text-[16.5px] font-semibold text-[var(--ink-primary)] break-words">
                          {group.category}
                        </span>
                        <span className="text-[13.5px] sm:text-[15px] leading-[1.65] text-[var(--ink-secondary)] break-words">
                          {group.skills.join(" · ")}
                        </span>
                      </div>
                    </AppleHoverRow>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {projectTags.map((tag) => {
                  const scheme = getTagColorScheme(tag, tagColorMap);
                  return (
                    <span
                      key={tag}
                      className={`px-3 py-1.5 rounded-xl text-[12.5px] sm:text-[13px] font-semibold border ${scheme.pill}`}
                    >
                      {tag}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </Scroll3DSection>
      )}

      {/* 4. EDUCATION SECTION (#education) */}
      {parsedEducations.length > 0 && (
        <Scroll3DSection id="education">
          <div className="mx-auto w-full max-w-[1040px] rounded-[22px] sm:rounded-[30px] apple-surface-card p-4 sm:p-8">
            <h2 className="apple-h2 text-[20px] sm:text-[26px] font-semibold text-[var(--ink-primary)] mb-3.5 sm:mb-4">
              {lang === "EN" ? "Education" : "Học vấn"}
            </h2>

            <div className="divide-y divide-[var(--card-border)] border-t border-b border-[var(--card-border)]">
              {parsedEducations.map((edu, idx) => (
                <div key={idx} className="py-0.5">
                  <AppleHoverRow>
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5 sm:gap-4">
                      <div className="min-w-0">
                        <span className="text-[15.5px] sm:text-[17.5px] font-semibold text-[var(--ink-primary)] break-words">
                          {edu.school}
                        </span>
                        {edu.major && (
                          <span className="block sm:inline sm:ml-2.5 text-[13.5px] sm:text-[15.5px] text-[var(--ink-meta)] break-words">
                            {edu.major}
                          </span>
                        )}
                        {edu.notes && (
                          <p className="text-[13px] sm:text-[13.5px] text-[var(--ink-meta)] mt-0.5 break-words">
                            {edu.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {edu.gpa && (
                          <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold tabular-nums bg-[var(--pill-bg)] apple-hairline text-[var(--ink-primary)]">
                            {edu.gpa}
                          </span>
                        )}
                        {edu.period && (
                          <span className="text-[12.5px] sm:text-[14px] tabular-nums text-[var(--ink-meta)]">
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
