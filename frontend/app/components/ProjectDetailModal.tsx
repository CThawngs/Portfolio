"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ExternalLink,
  Calendar,
  FolderKanban,
  Tag,
  Award,
  Code,
} from "lucide-react";
import { IntrinsicPortfolioImage } from "./SafePortfolioImage";
import { getTagColorScheme, type TagColorScheme } from "./tagPalette";
import type { Project } from "../PortfolioUI";

interface ProjectDetailModalProps {
  project: Project | null;
  lang: "EN" | "VN";
  tagColorMap?: Map<string, TagColorScheme>;
  onClose: () => void;
  formatDateRange: (dateRange: Project["project_date"]) => string | null;
  renderLinkifiedText: (text: string, className?: string) => React.ReactNode;
}

/**
 * ProjectDetailModal — Seamless Unified Apple Split-Inspector
 * - Unified surface background (`bg-[var(--surface-modal)]`) across BOTH left-side and right-side,
 *   with ZERO middle divider border.
 * - Left-side contains ONLY the item's full natural-dimension image with harmonious rounded corners
 *   (no extra cards, no preview badges, nothing overlaid on top of the image).
 * - On Desktop (`>= 1024px`), left-side stays completely stationary while ONLY the right-side
 *   details column scrolls up and down when content is long.
 */
export default function ProjectDetailModal({
  project,
  lang,
  tagColorMap,
  onClose,
  formatDateRange,
  renderLinkifiedText,
}: ProjectDetailModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const projectId = project?.id;

  useEffect(() => {
    if (!projectId) return;

    const prevActive = document.activeElement as HTMLElement | null;
    document.body.classList.add("lock-scroll");
    const focusTimer = setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 30);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])"
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement as HTMLElement | null;
        const inside = active && dialogRef.current.contains(active);

        if (e.shiftKey) {
          if (!inside || active === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (!inside || active === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      clearTimeout(focusTimer);
      document.body.classList.remove("lock-scroll");
      window.removeEventListener("keydown", onKeyDown);
      prevActive?.focus?.();
    };
  }, [projectId]);

  const images = project?.images?.filter(Boolean) ?? [];
  const primaryImgSrc = images[0] || "";
  const hasMedia = Boolean(primaryImgSrc);
  const dateLabel = project
    ? formatDateRange(project.project_date) ||
      (project.last_edited_time
        ? String(new Date(project.last_edited_time).getFullYear())
        : null)
    : null;

  const isCertificate = Boolean(
    project?.category &&
      (project.category.toLowerCase().includes("certificate") ||
        project.category.toLowerCase().includes("chứng chỉ"))
  );

  const categoryLabel =
    project?.category && project.category !== "Uncategorized"
      ? project.category
      : isCertificate
      ? lang === "EN"
        ? "Certificate"
        : "Chứng chỉ"
      : lang === "EN"
      ? "Project"
      : "Dự án";

  const title = project
    ? (lang === "EN" ? project.title_en : project.title_vn) ||
      project.title_en ||
      project.title_vn ||
      "Untitled"
    : "";
  const desc = project
    ? (lang === "EN"
        ? project.desc_en || project.desc_vn
        : project.desc_vn || project.desc_en) || ""
    : "";

  const primaryCtaLabel = isCertificate
    ? lang === "EN"
      ? "Verify Credential"
      : "Xem Chứng Nhận"
    : lang === "EN"
    ? "Open Live Project"
    : "Mở Xem Trực Tiếp";

  const modalMediaFallback = (
    <div className="flex aspect-[16/10] w-full items-center justify-center rounded-[18px] bg-[var(--pill-bg)]">
      {isCertificate ? (
        <Award className="h-12 w-12 text-[var(--ink-meta)] opacity-60" />
      ) : (
        <Code className="h-12 w-12 text-[var(--ink-meta)] opacity-60" />
      )}
    </div>
  );

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5 lg:p-8 bg-black/55 dark:bg-black/75 backdrop-blur-xl"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="apple-sheet-title"
        >
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 18 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full ${
              hasMedia ? "sm:max-w-3xl lg:max-w-5xl" : "sm:max-w-2xl"
            } max-h-[92dvh] sm:max-h-[86dvh] flex flex-col overflow-hidden rounded-t-[26px] sm:rounded-[30px] bg-[var(--surface-modal)] apple-hairline shadow-2xl`}
          >
            {/* Mobile Sheet Grabber */}
            <div
              className="sm:hidden mx-auto mt-2.5 mb-1 h-1.5 w-10 shrink-0 rounded-full bg-[var(--ink-decorative)] opacity-55"
              aria-hidden="true"
            />

            <div
              className={`flex-1 min-h-0 overflow-y-auto lg:overflow-hidden ${
                hasMedia
                  ? "lg:grid lg:grid-cols-[1.18fr_1fr] lg:max-h-[86dvh]"
                  : "flex flex-col max-h-[86dvh]"
              }`}
            >
              {/* LEFT PANE: Pure Standalone Artwork Only — Same Background, Zero Divider Border, Stationary on Desktop */}
              {hasMedia && (
                <div className="flex items-center justify-center bg-[var(--surface-modal)] px-4 pt-4 pb-2 sm:px-6 sm:pt-6 sm:pb-3 lg:p-7 lg:pr-3 lg:max-h-[86dvh] lg:overflow-hidden">
                  <IntrinsicPortfolioImage
                    src={primaryImgSrc}
                    alt={title}
                    fallback={modalMediaFallback}
                    className="block w-auto h-auto max-w-full max-h-[38dvh] sm:max-h-[42dvh] lg:max-h-[calc(86dvh-3.5rem)] rounded-[16px] sm:rounded-[20px] object-contain"
                  />
                </div>
              )}

              {/* RIGHT PANE: Seamless Same-Color Details Column (Scrolls Independently While Left Pane Stays Fixed) */}
              <div className="flex flex-col min-h-0 lg:max-h-[86dvh] lg:overflow-hidden bg-[var(--surface-modal)]">
                {/* Pinned Top Header */}
                <div className="flex items-center justify-between gap-3 px-4 sm:px-6 pt-3.5 sm:pt-6 pb-3 shrink-0">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--pill-bg)] apple-hairline text-[var(--ink-primary)]">
                      {categoryLabel}
                    </span>
                    {project.status && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[var(--pill-bg)] text-[var(--ink-meta)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span>
                          {lang === "EN" ? "Verified Entry" : "Đã xuất bản"}
                        </span>
                      </span>
                    )}
                  </div>

                  <button
                    ref={closeBtnRef}
                    type="button"
                    onClick={onClose}
                    data-cursor="magnetic"
                    className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-[var(--pill-bg)] apple-hairline text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:scale-105 transition-all cursor-pointer"
                    aria-label={lang === "EN" ? "Close details" : "Đóng chi tiết"}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Independently Scrollable Editorial Content */}
                <div className="flex-1 min-h-0 lg:overflow-y-auto overscroll-contain px-4 sm:px-6 py-3 sm:py-4 space-y-5">
                  <div>
                    <h2
                      id="apple-sheet-title"
                      className="apple-h2 text-[20px] sm:text-[25px] font-semibold text-[var(--ink-primary)] leading-[1.28] break-words"
                    >
                      {title}
                    </h2>
                  </div>

                  {/* Metadata Strip */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-[16px] p-3 bg-[var(--pill-bg)]/65 apple-hairline">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)] mb-1">
                        <Calendar className="h-3.5 w-3.5 opacity-80" />
                        <span>{lang === "EN" ? "Timeline" : "Thời gian"}</span>
                      </div>
                      <p className="text-[13px] sm:text-[13.5px] font-semibold tabular-nums text-[var(--ink-primary)] break-words">
                        {dateLabel || (lang === "EN" ? "Published" : "Đã cập nhật")}
                      </p>
                    </div>

                    <div className="rounded-[16px] p-3 bg-[var(--pill-bg)]/65 apple-hairline">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)] mb-1">
                        <FolderKanban className="h-3.5 w-3.5 opacity-80" />
                        <span>{lang === "EN" ? "Category" : "Danh mục"}</span>
                      </div>
                      <p className="text-[13px] sm:text-[13.5px] font-semibold text-[var(--ink-primary)] break-words">
                        {categoryLabel}
                      </p>
                    </div>
                  </div>

                  {/* Overview / Story */}
                  {desc && (
                    <div className="space-y-2">
                      <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                        {lang === "EN" ? "Overview" : "Mô tả chi tiết"}
                      </h3>
                      <div className="text-[14.5px] sm:text-[15px] text-[var(--ink-secondary)] leading-[1.74] whitespace-pre-wrap">
                        {renderLinkifiedText(desc)}
                      </div>
                    </div>
                  )}

                  {/* Colorful Technologies & Tags */}
                  {project.tags && project.tags.length > 0 && (
                    <div className="space-y-2.5 pt-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                        <Tag className="h-3.5 w-3.5 opacity-80" />
                        <span>
                          {lang === "EN"
                            ? "Technologies & Topics"
                            : "Công nghệ & Chủ đề"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {project.tags.map((tag) => {
                          const scheme = getTagColorScheme(tag, tagColorMap);
                          return (
                            <span
                              key={tag}
                              className={`px-2.5 py-1 rounded-xl text-xs font-semibold border ${scheme.pill}`}
                            >
                              {tag}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Pinned Bottom Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 sm:px-6 pt-3.5 pb-[max(0.95rem,env(safe-area-inset-bottom))] border-t border-[var(--card-border)] bg-[var(--surface-modal)] shrink-0">
                  {project.links ? (
                    <a
                      href={project.links}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-cursor="magnetic"
                      className="flex-1 sm:flex-initial inline-flex min-h-[42px] items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[var(--ink-primary)] text-[var(--background)] font-semibold text-xs sm:text-sm hover:opacity-85 hover:scale-[1.02] transition-all cursor-pointer"
                    >
                      <span>{primaryCtaLabel}</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="text-xs text-[var(--ink-muted)]">
                      {lang === "EN" ? "Portfolio Entry" : "Hồ sơ năng lực"}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex min-h-[42px] items-center justify-center px-4 py-2 rounded-full bg-[var(--pill-bg)] apple-hairline text-xs sm:text-sm font-semibold text-[var(--ink-primary)] hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    {lang === "EN" ? "Close" : "Đóng"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
