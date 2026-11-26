"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ExternalLink,
  Calendar,
  Award,
  Code,
  Tag,
  FolderKanban,
} from "lucide-react";
import {
  canOptimizeWithNextImage,
  classifyAspectRatio,
  getCachedBitmap,
  getOptimizedImageUrl,
  recordLoadedBitmap,
  type ImageOrientation,
} from "./SafePortfolioImage";
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
 * ProjectDetailModal
 * - Strictly 2 close mechanisms: (1) Top-right 'X' button, (2) Clicking outside the panel
 *   (plus Escape keyboard support for accessibility).
 * - Instant 0ms Image Rendering:
 *   Reuses the exact decoded bitmap URL (`cachedBitmap.currentSrc`) already loaded by
 *   Stage or Grid view for both the ambient color wash and the immediate base layer
 *   (eliminating cold `/_next/image` network misses), while seamlessly layering a crisp
 *   `w=1080` high-res WebP upgrade on top if the cached bitmap was smaller.
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

  const [rawFallbackFor, setRawFallbackFor] = useState<string | null>(null);
  const [failedImgSrc, setFailedImgSrc] = useState<string | null>(null);
  const [hiResLoadedFor, setHiResLoadedFor] = useState<string | null>(null);
  const [measuredOrientation, setMeasuredOrientation] = useState<{
    src: string;
    orientation: ImageOrientation;
  } | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const projectId = project?.id ?? null;

  useEffect(() => {
    if (!projectId) return;

    const prevActive = document.activeElement as HTMLElement | null;
    document.body.classList.add("lock-scroll");
    const focusTimer = setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el.offsetParent !== null);

        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement as HTMLElement | null;
        const inside = active ? dialogRef.current.contains(active) : false;

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
  const showMediaPane = Boolean(
    primaryImgSrc && failedImgSrc !== primaryImgSrc
  );

  const cachedBitmap = getCachedBitmap(primaryImgSrc);

  const orientation: ImageOrientation =
    measuredOrientation && measuredOrientation.src === primaryImgSrc
      ? measuredOrientation.orientation
      : cachedBitmap?.orientation ?? "landscape";

  const usingRaw =
    rawFallbackFor === primaryImgSrc ||
    !canOptimizeWithNextImage(primaryImgSrc);

  const hiResTargetSrc = usingRaw
    ? primaryImgSrc
    : getOptimizedImageUrl(primaryImgSrc, 1080);

  // Instant 0ms base URL: exact in-RAM `currentSrc` from Stage/Grid if available, else 640w WebP
  const instantBaseSrc = usingRaw
    ? primaryImgSrc
    : cachedBitmap?.currentSrc || getOptimizedImageUrl(primaryImgSrc, 640);

  const needsHiResOverlay =
    !usingRaw &&
    canOptimizeWithNextImage(primaryImgSrc) &&
    instantBaseSrc !== hiResTargetSrc;

  const isHiResReady = hiResLoadedFor === primaryImgSrc;

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

  const modalMaxWidthClass = !showMediaPane
    ? "sm:max-w-[600px]"
    : orientation === "portrait"
    ? "sm:max-w-2xl lg:max-w-[940px]"
    : orientation === "square"
    ? "sm:max-w-3xl lg:max-w-[1020px]"
    : "sm:max-w-3xl lg:max-w-[1120px]";

  const splitGridColsClass =
    orientation === "portrait"
      ? "lg:grid-cols-[41%_59%]"
      : orientation === "square"
      ? "lg:grid-cols-[48%_52%]"
      : "lg:grid-cols-[58%_42%]";

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5 lg:p-8 bg-black/68 dark:bg-black/82 backdrop-blur-xs"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="apple-sheet-title"
        >
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full ${modalMaxWidthClass} max-h-[92dvh] sm:max-h-[86dvh] flex flex-col overflow-hidden rounded-t-[24px] sm:rounded-[28px] bg-[var(--surface-modal)] apple-hairline shadow-2xl`}
          >
            {/* Top-Right Close Button ('X') */}
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              data-cursor="magnetic"
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[var(--surface-modal)]/90 lg:bg-[var(--pill-bg)] apple-hairline text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:scale-105 transition-all shadow-sm cursor-pointer"
              aria-label={lang === "EN" ? "Close details" : "Đóng chi tiết"}
            >
              <X className="h-4 w-4" />
            </button>

            <div
              className={`flex-1 min-h-0 overflow-y-auto lg:overflow-hidden ${
                showMediaPane
                  ? `lg:grid ${splitGridColsClass} lg:max-h-[86dvh]`
                  : "flex flex-col max-h-[86dvh]"
              }`}
            >
              {/* LEFT PANE: Full-Bleed Edge-to-Edge Media (`p-0`), Instant 0ms Cached Bitmap */}
              {showMediaPane && (
                <div
                  data-testid="modal-media-pane"
                  data-orientation={orientation}
                  className="relative w-full p-0 m-0 overflow-hidden bg-[var(--surface-modal)] flex items-center justify-center min-h-[210px] sm:min-h-[280px] lg:min-h-[420px] lg:h-full lg:max-h-[86dvh]"
                >
                  {/* Zero-network-miss Ambient Color Echo reusing already-cached `instantBaseSrc` */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={instantBaseSrc}
                    alt=""
                    aria-hidden="true"
                    loading="eager"
                    decoding="sync"
                    className="pointer-events-none select-none absolute inset-0 h-full w-full object-cover scale-125 blur-md opacity-55 dark:opacity-45"
                  />

                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-black/[0.04] dark:bg-black/[0.16]"
                  />

                  {/* Layer 1: Instant 0ms RAM-Cached Foreground Artwork */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    data-testid="modal-primary-image"
                    src={instantBaseSrc}
                    alt={title}
                    loading="eager"
                    decoding="sync"
                    fetchPriority="high"
                    onLoad={(e) => {
                      const img = e.currentTarget;
                      if (img.naturalWidth && img.naturalHeight) {
                        recordLoadedBitmap(
                          primaryImgSrc,
                          img.currentSrc || img.src,
                          img.naturalWidth,
                          img.naturalHeight
                        );
                        setMeasuredOrientation({
                          src: primaryImgSrc,
                          orientation: classifyAspectRatio(
                            img.naturalWidth,
                            img.naturalHeight
                          ),
                        });
                      }
                    }}
                    onError={() => {
                      if (!usingRaw) {
                        setRawFallbackFor(primaryImgSrc);
                      } else {
                        setFailedImgSrc(primaryImgSrc);
                      }
                    }}
                    className="relative z-10 block w-full h-full max-h-[46dvh] sm:max-h-[50dvh] lg:max-h-[86dvh] object-contain"
                  />

                  {/* Layer 2: Seamless High-Res `w=1080` Crisp Upgrade (when opened from smaller Grid thumbnail) */}
                  {needsHiResOverlay && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      ref={(node) => {
                        if (
                          node &&
                          node.complete &&
                          node.naturalWidth > 0 &&
                          hiResLoadedFor !== primaryImgSrc
                        ) {
                          recordLoadedBitmap(
                            primaryImgSrc,
                            node.currentSrc || node.src,
                            node.naturalWidth,
                            node.naturalHeight
                          );
                          setHiResLoadedFor(primaryImgSrc);
                        }
                      }}
                      src={hiResTargetSrc}
                      alt=""
                      aria-hidden="true"
                      loading="eager"
                      decoding="async"
                      fetchPriority="high"
                      onLoad={(e) => {
                        const img = e.currentTarget;
                        if (img.naturalWidth && img.naturalHeight) {
                          recordLoadedBitmap(
                            primaryImgSrc,
                            img.currentSrc || img.src,
                            img.naturalWidth,
                            img.naturalHeight
                          );
                        }
                        setHiResLoadedFor(primaryImgSrc);
                      }}
                      className={`pointer-events-none absolute inset-0 z-20 block w-full h-full max-h-[46dvh] sm:max-h-[50dvh] lg:max-h-[86dvh] m-auto object-contain transition-opacity duration-200 ${
                        isHiResReady ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  )}
                </div>
              )}

              {/* RIGHT PANE: Seamless Same-Color Details Column */}
              <div
                data-testid="modal-details-pane"
                className="flex flex-col min-h-0 lg:max-h-[86dvh] lg:overflow-hidden bg-[var(--surface-modal)]"
              >
                <div
                  className={`flex items-center gap-2.5 px-4 sm:px-6 pt-4 sm:pt-6 pb-2.5 shrink-0 ${
                    showMediaPane ? "pr-4 lg:pr-16" : "pr-14 sm:pr-16"
                  }`}
                >
                  {!showMediaPane && (
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--pill-bg)] apple-hairline text-[var(--ink-primary)]">
                      {isCertificate ? (
                        <Award className="h-4 w-4 opacity-85" />
                      ) : (
                        <Code className="h-4 w-4 opacity-85" />
                      )}
                    </span>
                  )}

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
                </div>

                <div className="flex-1 min-h-0 lg:overflow-y-auto overscroll-contain px-4 sm:px-6 py-3 sm:py-4 pb-[max(1.1rem,env(safe-area-inset-bottom))] space-y-4 sm:space-y-5">
                  <div>
                    <h2
                      id="apple-sheet-title"
                      className="apple-h2 text-[19px] sm:text-[24px] font-semibold text-[var(--ink-primary)] leading-[1.3] break-words"
                    >
                      {title}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2.5">
                    <div className="rounded-[14px] sm:rounded-[16px] p-3 bg-[var(--pill-bg)]/65 apple-hairline">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)] mb-1">
                        <Calendar className="h-3.5 w-3.5 opacity-80 shrink-0" />
                        <span>{lang === "EN" ? "Timeline" : "Thời gian"}</span>
                      </div>
                      <p className="text-[13px] sm:text-[13.5px] font-semibold tabular-nums text-[var(--ink-primary)] break-words">
                        {dateLabel ||
                          (lang === "EN" ? "Published" : "Đã cập nhật")}
                      </p>
                    </div>

                    <div className="rounded-[14px] sm:rounded-[16px] p-3 bg-[var(--pill-bg)]/65 apple-hairline">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)] mb-1">
                        <FolderKanban className="h-3.5 w-3.5 opacity-80 shrink-0" />
                        <span>{lang === "EN" ? "Category" : "Danh mục"}</span>
                      </div>
                      <p className="text-[13px] sm:text-[13.5px] font-semibold text-[var(--ink-primary)] break-words">
                        {categoryLabel}
                      </p>
                    </div>
                  </div>

                  {desc && (
                    <div className="space-y-2">
                      <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                        {lang === "EN" ? "Overview" : "Mô tả chi tiết"}
                      </h3>
                      <div className="text-[14px] sm:text-[15px] text-[var(--ink-secondary)] leading-[1.72] whitespace-pre-wrap break-words">
                        {renderLinkifiedText(desc)}
                      </div>
                    </div>
                  )}

                  {project.tags && project.tags.length > 0 && (
                    <div className="space-y-2.5 pt-0.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                        <Tag className="h-3.5 w-3.5 opacity-80 shrink-0" />
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

                {project.links && (
                  <div className="flex items-center px-4 sm:px-6 pt-3 pb-[max(0.95rem,env(safe-area-inset-bottom))] border-t border-[var(--card-border)] bg-[var(--surface-modal)] shrink-0">
                    <a
                      href={project.links}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-cursor="magnetic"
                      className="w-full sm:w-auto inline-flex min-h-[42px] items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[var(--ink-primary)] text-[var(--background)] font-semibold text-xs sm:text-sm hover:opacity-85 hover:scale-[1.02] transition-all cursor-pointer"
                    >
                      <span>{primaryCtaLabel}</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
