"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ExternalLink,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Tag,
  Award,
  Layers,
} from "lucide-react";
import type { Project } from "../PortfolioUI";

interface ProjectDetailModalProps {
  project: Project | null;
  lang: "EN" | "VN";
  onClose: () => void;
  formatDateRange: (dateRange: Project["project_date"]) => string | null;
  renderLinkifiedText: (text: string, className?: string) => React.ReactNode;
}

function isUnoptimizedAsset(src: string): boolean {
  return /(\.gif|\.svg)(\?|$)/i.test(src) || src.startsWith("data:");
}

/**
 * ProjectDetailModal — Apple Studio Split-Inspector Sheet
 * - Desktop (>= 1024px with media): 2-column Studio Split layout
 *   [Left: Full-frame object-contain Media Canvas + Thumbnail Strip]
 *   [Right: Sticky Header + Editorial Title + Bento Metadata Strip + Overview + Tags + Grounded Action Bar]
 * - Mobile (360px–375px iPhone mini / iPhone 7 / iPhone X): Tactile Apple Bottom Sheet with safe-area padding.
 */
export default function ProjectDetailModal({
  project,
  lang,
  onClose,
  formatDateRange,
  renderLinkifiedText,
}: ProjectDetailModalProps) {
  const [imgState, setImgState] = useState<{ projectId: string | undefined; idx: number }>({
    projectId: undefined,
    idx: 0,
  });
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const projectId = project?.id;
  const imgIdx = imgState.projectId === projectId ? imgState.idx : 0;

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
  const hasMedia = images.length > 0;
  const activeImgSrc = images[imgIdx] || images[0] || "";
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

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5 lg:p-8 bg-black/50 dark:bg-black/75 backdrop-blur-xl"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="apple-sheet-title"
        >
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.95, y: 28, rotateX: 3 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 22 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformPerspective: 1200 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full ${
              hasMedia ? "sm:max-w-3xl lg:max-w-5xl" : "sm:max-w-2xl"
            } max-h-[92dvh] sm:max-h-[88dvh] flex flex-col lg:block overflow-hidden rounded-t-[26px] sm:rounded-[30px] apple-glass bg-[var(--background)] shadow-2xl`}
          >
            {/* Mobile Sheet Grabber */}
            <div
              className="sm:hidden mx-auto mt-2.5 mb-1 h-1.5 w-10 shrink-0 rounded-full bg-[var(--ink-decorative)] opacity-55"
              aria-hidden="true"
            />

            <div
              className={`flex-1 min-h-0 overflow-y-auto lg:overflow-hidden ${
                hasMedia
                  ? "lg:grid lg:grid-cols-[1.16fr_1fr] lg:max-h-[88dvh]"
                  : "flex flex-col max-h-[88dvh]"
              }`}
            >
              {/* LEFT PANE: Studio Media Stage (When item has images) */}
              {hasMedia && activeImgSrc && (
                <div className="relative flex flex-col justify-between bg-[var(--surface-elevated)] border-b lg:border-b-0 lg:border-r border-[var(--card-border)] p-3.5 sm:p-6 lg:min-h-[480px]">
                  {/* Subtle radial studio spotlight */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(circle at 50% 45%, var(--ambient-orb-1) 0%, transparent 72%)",
                    }}
                  />

                  {/* Top Media Badge Row */}
                  <div className="relative z-10 hidden lg:flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--background)]/80 apple-hairline text-[11px] font-semibold text-[var(--ink-meta)]">
                      {isCertificate ? (
                        <Award className="h-3.5 w-3.5" />
                      ) : (
                        <Layers className="h-3.5 w-3.5" />
                      )}
                      <span>
                        {isCertificate
                          ? lang === "EN"
                            ? "Credential Preview"
                            : "Bản xem chứng chỉ"
                          : lang === "EN"
                          ? "Studio Preview"
                          : "Khung xem dự án"}
                      </span>
                    </span>

                    {images.length > 1 && (
                      <span className="px-2.5 py-1 rounded-full bg-[var(--background)]/80 apple-hairline text-[11px] font-semibold tabular-nums text-[var(--ink-primary)]">
                        {imgIdx + 1} / {images.length}
                      </span>
                    )}
                  </div>

                  {/* Uncropped Artwork Canvas */}
                  <div className="relative z-10 w-full aspect-[16/10] lg:aspect-auto lg:flex-1 lg:min-h-[320px] rounded-[18px] sm:rounded-[22px] overflow-hidden bg-[var(--background)]/65 apple-hairline">
                    <Image
                      src={activeImgSrc}
                      alt={title}
                      fill
                      priority
                      unoptimized={isUnoptimizedAsset(activeImgSrc)}
                      sizes="(max-width: 1024px) 95vw, 580px"
                      className="object-contain p-2 sm:p-3.5"
                    />

                    {images.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setImgState({
                              projectId: project.id,
                              idx: (imgIdx - 1 + images.length) % images.length,
                            })
                          }
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full apple-glass text-[var(--ink-primary)] hover:scale-105 transition-transform cursor-pointer"
                          aria-label={lang === "EN" ? "Previous image" : "Ảnh trước"}
                        >
                          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setImgState({
                              projectId: project.id,
                              idx: (imgIdx + 1) % images.length,
                            })
                          }
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full apple-glass text-[var(--ink-primary)] hover:scale-105 transition-transform cursor-pointer"
                          aria-label={lang === "EN" ? "Next image" : "Ảnh tiếp"}
                        >
                          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Interactive Thumbnail Filmstrip (when multiple images exist) */}
                  {images.length > 1 && (
                    <div className="relative z-10 mt-3 flex items-center justify-center gap-2 overflow-x-auto hide-scrollbar py-0.5">
                      {images.map((thumb, idx) => {
                        const selected = idx === imgIdx;
                        return (
                          <button
                            key={`${thumb}-${idx}`}
                            type="button"
                            onClick={() =>
                              setImgState({ projectId: project.id, idx })
                            }
                            className={`relative h-11 w-16 shrink-0 rounded-lg overflow-hidden transition-all cursor-pointer ${
                              selected
                                ? "ring-2 ring-[var(--focus-ring)] opacity-100 scale-[1.03]"
                                : "apple-hairline opacity-55 hover:opacity-90"
                            }`}
                            aria-label={`${lang === "EN" ? "Image" : "Ảnh"} ${idx + 1}`}
                          >
                            <Image
                              src={thumb}
                              alt=""
                              fill
                              unoptimized={isUnoptimizedAsset(thumb)}
                              sizes="64px"
                              className="object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* RIGHT PANE: Structured Spec & Editorial Inspector */}
              <div className="flex flex-col lg:max-h-[88dvh] min-h-0 bg-[var(--background)]">
                {/* Sticky Inspector Top Header */}
                <div className="flex items-center justify-between gap-3 px-4 sm:px-6 pt-3.5 sm:pt-5 pb-3 border-b border-[var(--card-border)] shrink-0">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--pill-bg)] apple-hairline text-[var(--ink-primary)]">
                      {categoryLabel}
                    </span>
                    {project.status && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[var(--surface-elevated)] text-[var(--ink-meta)]">
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

                {/* Scrollable Editorial Content */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 sm:py-5 space-y-5">
                  <div>
                    <h2
                      id="apple-sheet-title"
                      className="apple-h2 text-[20px] sm:text-[25px] font-semibold text-[var(--ink-primary)] leading-[1.28] break-words"
                    >
                      {title}
                    </h2>
                  </div>

                  {/* Bento Metadata Spec Strip */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-[16px] p-3 bg-[var(--surface-elevated)] apple-hairline">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)] mb-1">
                        <Calendar className="h-3.5 w-3.5 opacity-80" />
                        <span>{lang === "EN" ? "Timeline" : "Thời gian"}</span>
                      </div>
                      <p className="text-[13px] sm:text-[13.5px] font-semibold tabular-nums text-[var(--ink-primary)] break-words">
                        {dateLabel || (lang === "EN" ? "Published" : "Đã cập nhật")}
                      </p>
                    </div>

                    <div className="rounded-[16px] p-3 bg-[var(--surface-elevated)] apple-hairline">
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

                  {/* Technologies & Tags */}
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
                        {project.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2.5 py-1 rounded-xl text-xs font-medium bg-[var(--pill-bg)] apple-hairline text-[var(--ink-secondary)]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Grounded Sticky Action Bar (Safe-area aware for iPhone X / iPhone mini) */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 sm:px-6 pt-3.5 pb-[max(0.95rem,env(safe-area-inset-bottom))] border-t border-[var(--card-border)] bg-[var(--background)] shrink-0">
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
