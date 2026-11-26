"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Calendar, ChevronDown } from "lucide-react";
import { useMagneticHandlers } from "./Magnetic";
import type { Project, ProfileData } from "../PortfolioUI";

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
  certificates: Project[];
  projectTags: string[];
  socialLinks: SocialLinkEntry[];
  formatDate: (d: string | null) => string;
  formatYearOrDate: (p: Project) => string;
  onSelectProject: (p: Project) => void;
  renderLinkifiedText: (text: string, className?: string) => React.ReactNode;
  renderTypingSubtitle: () => React.ReactNode;
}

function AppleHoverRow({
  children,
  onClick,
  href,
  external = false,
  ariaExpanded,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  external?: boolean;
  ariaExpanded?: boolean;
}) {
  const { onPointerMove, onPointerLeave } = useMagneticHandlers(4);

  if (href) {
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        data-cursor="magnetic"
        className="apple-list-row block w-full py-3 text-left no-underline cursor-pointer"
      >
        <div className="apple-list-row-inner">{children}</div>
      </a>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-expanded={ariaExpanded}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        data-cursor="magnetic"
        className="apple-list-row block w-full py-3 text-left cursor-pointer"
      >
        <div className="apple-list-row-inner">{children}</div>
      </button>
    );
  }

  return (
    <div
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="apple-list-row block w-full py-3 text-left"
    >
      <div className="apple-list-row-inner">{children}</div>
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
  certificates,
  projectTags,
  socialLinks,
  formatDate,
  formatYearOrDate,
  onSelectProject,
  renderLinkifiedText,
  renderTypingSubtitle,
}: MoreInfoViewProps) {
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [openExpIdx, setOpenExpIdx] = useState<number | null>(0);
  const ctaMagnetic = useMagneticHandlers(5);
  const readMoreMagnetic = useMagneticHandlers(4);

  const primaryEmailHref = profileData?.email
    ? `mailto:${profileData.email}`
    : socialLinks[0]?.href || "#";

  const firstAbout = aboutParagraphs[0] || "";
  const extraAbout = aboutParagraphs.slice(1);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="w-full px-6 sm:px-10 pt-4 pb-20"
    >
      <div className="mx-auto w-full max-w-[640px]">
        {/* Social Links Bar + Get in touch Pill CTA */}
        {socialLinks.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 mb-11">
            <div className="flex flex-wrap items-center -ml-2.5 gap-y-1">
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
              className="magnetic-target inline-flex min-h-[40px] items-center px-4 rounded-[12px] apple-hairline text-[13px] font-medium text-[var(--ink-primary)] hover:bg-[var(--row-hover-bg)] hover:scale-[1.04] transition-all cursor-pointer"
            >
              {lang === "EN" ? "Get in touch" : "Liên hệ ngay"}
            </a>
          </div>
        )}

        {/* Editorial Intro */}
        <div className="mb-14">
          <div className="py-[0.12em]">
            <h1 className="apple-h1 text-[34px] sm:text-[44px] font-normal text-[var(--ink-primary)] mb-3">
              {profileName}
            </h1>
          </div>

          {renderTypingSubtitle()}

          {profileData?.dob && (
            <p className="mt-2.5 inline-flex items-center gap-1.5 text-[13px] font-medium tabular-nums text-[var(--ink-meta)]">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {lang === "VN"
                  ? `Ngày sinh: ${formatDate(profileData.dob)}`
                  : `Born: ${formatDate(profileData.dob)}`}
              </span>
            </p>
          )}

          {firstAbout && (
            <div className="mt-6 text-[17px] sm:text-[18px] leading-[1.7] text-[var(--ink-primary)]">
              <p>{renderLinkifiedText(firstAbout)}</p>

              {extraAbout.length > 0 && (
                <>
                  <AnimatePresence initial={false}>
                    {aboutExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="pt-5 space-y-4 py-[0.12em] text-[var(--ink-secondary)]">
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
                    className="magnetic-target mt-4 inline-flex min-h-[44px] items-center text-[16px] font-normal text-[var(--ink-muted)] hover:text-[var(--ink-primary)] transition-colors cursor-pointer"
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

        {/* 1. Experience / Work Section */}
        {parsedExperiences.length > 0 && (
          <div className="mb-12">
            <h2 className="apple-h2 text-[26px] sm:text-[30px] font-normal text-[var(--ink-primary)] mb-3">
              {lang === "EN" ? "Experience" : "Kinh nghiệm"}
            </h2>

            <div className="divide-y divide-transparent">
              {parsedExperiences.map((exp, idx) => {
                const hasBullets = exp.bullets && exp.bullets.length > 0;
                const isOpen = openExpIdx === idx;
                return (
                  <div key={idx}>
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
                          <span className="text-[17px] sm:text-[18px] font-medium text-[var(--ink-primary)]">
                            {exp.org || exp.role}
                          </span>
                          {exp.org && exp.role && (
                            <span className="text-[15px] sm:text-[16px] text-[var(--ink-meta)]">
                              {exp.role}
                            </span>
                          )}
                          {exp.badge && (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[var(--pill-bg)] text-[var(--ink-meta)]">
                              {exp.badge}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {exp.period && (
                            <span className="text-[14px] sm:text-[15px] tabular-nums text-[var(--ink-meta)]">
                              {exp.period}
                            </span>
                          )}
                          {hasBullets && (
                            <ChevronDown
                              className={`h-4 w-4 text-[var(--ink-meta)] transition-transform duration-200 ${
                                isOpen ? "rotate-180" : ""
                              }`}
                            />
                          )}
                        </div>
                      </div>
                    </AppleHoverRow>

                    <AnimatePresence initial={false}>
                      {hasBullets && isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <ul className="pl-4 sm:pl-5 pr-2 pb-4 pt-1 space-y-2 text-[14.5px] sm:text-[15px] leading-[1.65] text-[var(--ink-secondary)]">
                            {exp.bullets.map((b, bIdx) => (
                              <li key={bIdx} className="flex items-start gap-2.5">
                                <span
                                  className="mt-2.5 h-1 w-1 rounded-full bg-[var(--ink-meta)] shrink-0"
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
        )}

        {/* 2. Technical Skills & Tools Section */}
        {(parsedSkills.length > 0 || projectTags.length > 0) && (
          <div className="mb-12">
            <h2 className="apple-h2 text-[26px] sm:text-[30px] font-normal text-[var(--ink-primary)] mb-3">
              {lang === "EN" ? "Technical Skills" : "Kỹ năng công nghệ"}
            </h2>

            {parsedSkills.length > 0 ? (
              <div>
                {parsedSkills.map((group, idx) => (
                  <AppleHoverRow key={idx}>
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5 sm:gap-6">
                      <span className="text-[17px] sm:text-[18px] font-medium text-[var(--ink-primary)] shrink-0">
                        {group.category}
                      </span>
                      <span className="text-[15px] sm:text-[16px] leading-[1.6] text-[var(--ink-meta)] sm:text-right">
                        {group.skills.join(" · ")}
                      </span>
                    </div>
                  </AppleHoverRow>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 pt-2">
                {projectTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 rounded-xl text-[13px] font-medium bg-[var(--pill-bg)] text-[var(--ink-secondary)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. Certificates & Accreditations Section */}
        {certificates.length > 0 && (
          <div className="mb-12">
            <h2 className="apple-h2 text-[26px] sm:text-[30px] font-normal text-[var(--ink-primary)] mb-3">
              {lang === "EN" ? "Certificates" : "Chứng chỉ"}
            </h2>

            <div>
              {certificates.map((cert) => {
                const title =
                  (lang === "EN" ? cert.title_en : cert.title_vn) ||
                  cert.title_en ||
                  cert.title_vn ||
                  "Certificate";
                const dateStr = formatYearOrDate(cert);
                return (
                  <AppleHoverRow
                    key={cert.id}
                    onClick={() => onSelectProject(cert)}
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-[17px] sm:text-[18px] font-normal text-[var(--ink-secondary)] group-hover:text-[var(--ink-primary)] truncate">
                        {title}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[14px] sm:text-[15px] tabular-nums text-[var(--ink-meta)] shrink-0">
                        <span>{dateStr || (lang === "EN" ? "View" : "Xem")}</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </AppleHoverRow>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Education Section */}
        {parsedEducations.length > 0 && (
          <div className="mb-8">
            <h2 className="apple-h2 text-[26px] sm:text-[30px] font-normal text-[var(--ink-primary)] mb-3">
              {lang === "EN" ? "Education" : "Học vấn"}
            </h2>

            <div>
              {parsedEducations.map((edu, idx) => (
                <AppleHoverRow key={idx}>
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4">
                    <div className="min-w-0">
                      <span className="text-[17px] sm:text-[18px] font-medium text-[var(--ink-primary)]">
                        {edu.school}
                      </span>
                      {edu.major && (
                        <span className="block sm:inline sm:ml-2.5 text-[15px] sm:text-[16px] text-[var(--ink-meta)]">
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
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold tabular-nums bg-[var(--pill-bg)] text-[var(--ink-primary)]">
                          {edu.gpa}
                        </span>
                      )}
                      {edu.period && (
                        <span className="text-[14px] sm:text-[15px] tabular-nums text-[var(--ink-meta)]">
                          {edu.period}
                        </span>
                      )}
                    </div>
                  </div>
                </AppleHoverRow>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.section>
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
      className="magnetic-target inline-flex min-h-[40px] items-center gap-1.5 px-2.5 text-[13.5px] font-medium text-[var(--ink-meta)] hover:text-[var(--ink-primary)] hover:scale-[1.06] transition-all cursor-pointer"
    >
      <Icon className="h-4 w-4 opacity-70" />
      <span>{link.label}</span>
    </a>
  );
}