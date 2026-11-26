"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
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

  const imgIdx = imgState.projectId === project?.id ? imgState.idx : 0;

  useEffect(() => {
    if (!project) return;

    const prevActive = document.activeElement as HTMLElement | null;
    document.body.classList.add("lock-scroll");
    const focusTimer = setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])"
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
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
  }, [project, onClose]);

  const images = project?.images?.filter(Boolean) ?? [];
  const activeImgSrc = images[imgIdx] || images[0] || "";
  const dateLabel = project ? formatDateRange(project.project_date) : null;
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

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/45 dark:bg-black/70 backdrop-blur-xl"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="apple-sheet-title"
        >
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.96, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 24 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-3xl max-h-[90dvh] overflow-y-auto rounded-t-[32px] sm:rounded-[32px] apple-hairline bg-[var(--background)] p-6 sm:p-9 shadow-2xl"
          >
            {/* Mobile Grabber */}
            <div className="sm:hidden mx-auto mb-4 h-1.5 w-11 rounded-full bg-[var(--ink-decorative)] opacity-50" aria-hidden="true" />

            {/* Close Button (44x44 tap target) */}
            <button
              ref={closeBtnRef}
              onClick={onClose}
              data-cursor="magnetic"
              className="sticky sm:absolute top-0 sm:top-5 float-right sm:float-none right-5 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--pill-bg)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:scale-105 transition-all cursor-pointer"
              aria-label={lang === "EN" ? "Close details" : "Đóng chi tiết"}
            >
              <X className="h-5 w-5" />
            </button>

            {/* Media Gallery */}
            {images.length > 0 && activeImgSrc && (
              <div className="relative w-full aspect-[16/10] rounded-[24px] overflow-hidden mb-7 bg-[var(--surface-elevated)] apple-hairline clear-both">
                <Image
                  src={activeImgSrc}
                  alt={title}
                  fill
                  priority
                  unoptimized={isUnoptimizedAsset(activeImgSrc)}
                  sizes="(max-width: 768px) 100vw, 768px"
                  className="object-contain bg-[var(--surface-elevated)]"
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
                      className="absolute left-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full apple-glass text-[var(--ink-primary)] hover:scale-105 transition-transform cursor-pointer"
                      aria-label={lang === "EN" ? "Previous image" : "Ảnh trước"}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setImgState({
                          projectId: project.id,
                          idx: (imgIdx + 1) % images.length,
                        })
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full apple-glass text-[var(--ink-primary)] hover:scale-105 transition-transform cursor-pointer"
                      aria-label={lang === "EN" ? "Next image" : "Ảnh tiếp"}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full apple-glass text-xs font-semibold tabular-nums text-[var(--ink-primary)]">
                      {imgIdx + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Meta Pills */}
            <div className="flex flex-wrap items-center gap-2.5 mb-3 pr-12">
              {project.category && (
                <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-[var(--pill-bg)] text-[var(--ink-meta)]">
                  {project.category}
                </span>
              )}
              {dateLabel && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold tabular-nums text-[var(--ink-meta)]">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{dateLabel}</span>
                </span>
              )}
            </div>

            {/* Title */}
            <h2
              id="apple-sheet-title"
              className="apple-h2 text-2xl sm:text-3xl font-semibold text-[var(--ink-primary)] mb-5"
            >
              {title}
            </h2>

            {/* Description */}
            {desc && (
              <div className="text-[15px] sm:text-base text-[var(--ink-secondary)] leading-[1.75] space-y-4 mb-7">
                {renderLinkifiedText(desc, "block whitespace-pre-wrap")}
              </div>
            )}

            {/* Tags */}
            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-5 border-t border-[var(--card-border)]">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[var(--pill-bg)] text-[var(--ink-secondary)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Live Action CTA */}
            {project.links && (
              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href={project.links}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="magnetic"
                  className="inline-flex min-h-[44px] items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--ink-primary)] text-[var(--background)] font-medium text-sm hover:opacity-85 hover:scale-[1.03] transition-all cursor-pointer"
                >
                  <span>{lang === "EN" ? "Open Live Project" : "Mở Xem Trực Tiếp"}</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
