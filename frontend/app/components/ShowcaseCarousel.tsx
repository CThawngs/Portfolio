"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Code,
  ExternalLink,
  Maximize2,
} from "lucide-react";
import { IntrinsicPortfolioImage } from "./SafePortfolioImage";
import { preloadImagesPriority } from "./imagePreloader";
import { getTagColorScheme, type TagColorScheme } from "./tagPalette";
import type { Project } from "../PortfolioUI";

interface ShowcaseCarouselProps {
  items: Project[];
  lang: "EN" | "VN";
  isCertificateReel?: boolean;
  tagColorMap?: Map<string, TagColorScheme>;
  onSelectProject: (project: Project) => void;
  formatYearOrDate: (project: Project) => string;
  formatDateRange: (dateRange: Project["project_date"]) => string | null;
  renderLinkifiedText: (text: string, className?: string) => React.ReactNode;
}

/**
 * ShowcaseCarousel — Frameless 3-Column Editorial Stage
 * - Center Stage displays ONLY the standalone image with all 4 corners cleanly rounded
 *   (zero outer card wrapper, zero padding frame, zero overlaid badges), adapting smoothly
 *   to Portrait, Square, Landscape, and No-Image entries.
 * - Pre-decodes neighboring items (±4 around active index) so Next/Prev switches in 0ms.
 */
export default function ShowcaseCarousel({
  items,
  lang,
  isCertificateReel = false,
  tagColorMap,
  onSelectProject,
  formatYearOrDate,
  formatDateRange,
  renderLinkifiedText,
}: ShowcaseCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const safeIndex = items.length ? Math.min(currentIndex, items.length - 1) : 0;
  const activeItem = items[safeIndex] || null;

  // High-priority preload & GPU decode of adjacent Stage items for 0ms transitions
  useEffect(() => {
    if (!items.length) return;
    const neighborUrls: string[] = [];
    for (let offset = -3; offset <= 5; offset++) {
      const idx = safeIndex + offset;
      if (idx >= 0 && idx < items.length) {
        const imgs = items[idx]?.images;
        if (imgs && imgs.length > 0) {
          for (const u of imgs) {
            if (u) neighborUrls.push(u);
          }
        }
      }
    }
    preloadImagesPriority(neighborUrls);
  }, [items, safeIndex]);

  const goToIndex = useCallback(
    (nextIdx: number) => {
      if (!items.length) return;
      const clamped = Math.max(0, Math.min(items.length - 1, nextIdx));
      if (clamped === safeIndex) return;
      setDirection(clamped > safeIndex ? 1 : -1);
      setCurrentIndex(clamped);
    },
    [items.length, safeIndex]
  );

  // Scoped keyboard navigation when stage is near viewport center
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (
        typeof document !== "undefined" &&
        document.querySelector("[role='dialog']")
      ) {
        return;
      }

      const target = e.target;
      if (
        target instanceof Element &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          Boolean(target.closest("[role='dialog']")))
      ) {
        return;
      }

      if (!stageRef.current) return;
      const rect = stageRef.current.getBoundingClientRect();
      const stageCenter = rect.top + rect.height / 2;
      if (
        Math.abs(stageCenter - window.innerHeight / 2) >
        window.innerHeight * 0.55
      ) {
        return;
      }

      if (e.key === "ArrowLeft" && safeIndex > 0) {
        e.preventDefault();
        goToIndex(safeIndex - 1);
      } else if (e.key === "ArrowRight" && safeIndex < items.length - 1) {
        e.preventDefault();
        goToIndex(safeIndex + 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [safeIndex, items.length, goToIndex]);

  // Lightweight Mobile/Tablet Touch Swipe
  const touchRef = useRef<{ startX: number; startY: number; active: boolean }>({
    startX: 0,
    startY: 0,
    active: false,
  });

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    touchRef.current = {
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      active: true,
    };
  };

  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchRef.current.active || e.changedTouches.length !== 1) return;
    touchRef.current.active = false;
    const dx = e.changedTouches[0].clientX - touchRef.current.startX;
    const dy = e.changedTouches[0].clientY - touchRef.current.startY;
    if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      if (dx < 0 && safeIndex < items.length - 1) {
        goToIndex(safeIndex + 1);
      } else if (dx > 0 && safeIndex > 0) {
        goToIndex(safeIndex - 1);
      }
    }
  };

  if (!items.length || !activeItem) {
    return (
      <div className="my-6 sm:my-8">
        <div className="mx-auto max-w-2xl px-5 py-12 text-center rounded-[22px] apple-surface-card text-[var(--ink-meta)] text-sm">
          {lang === "EN"
            ? "No items match the selected filter."
            : "Không có mục nào khớp bộ lọc đang chọn."}
        </div>
      </div>
    );
  }

  const activeTitle =
    (lang === "EN" ? activeItem.title_en : activeItem.title_vn) ||
    activeItem.title_en ||
    activeItem.title_vn ||
    "Untitled";
  const activeDesc =
    (lang === "EN"
      ? activeItem.desc_en || activeItem.desc_vn
      : activeItem.desc_vn || activeItem.desc_en) || "";
  const activeDateStr =
    formatDateRange(activeItem.project_date) || formatYearOrDate(activeItem);
  const coverSrc =
    activeItem.images && activeItem.images[0] ? activeItem.images[0] : "";

  const viewBtnLabel = isCertificateReel
    ? lang === "EN"
      ? "View Certificate"
      : "Xem Chứng Chỉ"
    : lang === "EN"
    ? "View Details"
    : "Xem Chi Tiết";

  const artworkPlaceholder = (
    <div
      onClick={() => onSelectProject(activeItem)}
      className="relative flex aspect-[16/10] w-full max-w-[600px] mx-auto flex-col items-center justify-center p-6 sm:p-8 rounded-[18px] sm:rounded-[22px] bg-[var(--surface-elevated)] apple-hairline text-center overflow-hidden cursor-pointer"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 apple-studio-dots opacity-50"
      />
      <div className="relative z-10 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-[18px] sm:rounded-[20px] bg-[var(--pill-bg)] apple-hairline text-[var(--ink-primary)] mb-3">
        {isCertificateReel ? (
          <Award className="h-7 w-7 sm:h-8 sm:w-8 opacity-80" />
        ) : (
          <Code className="h-7 w-7 sm:h-8 sm:w-8 opacity-80" />
        )}
      </div>
      <p className="relative z-10 max-w-md text-sm sm:text-base font-semibold text-[var(--ink-primary)] line-clamp-2 break-words">
        {activeTitle}
      </p>
    </div>
  );

  return (
    <div
      ref={stageRef}
      tabIndex={0}
      aria-roledescription="carousel"
      aria-label={
        isCertificateReel
          ? lang === "EN"
            ? "Certificates stage showcase"
            : "Trình diễn chứng chỉ"
          : lang === "EN"
          ? "Projects stage showcase"
          : "Trình diễn dự án"
      }
      className="relative w-full select-none focus:outline-none py-3 sm:py-6"
    >
      {/* 3-Column Non-Overlapping Editorial Stage on Desktop / Clean Responsive Stack on < 1024px */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)_minmax(220px,280px)] xl:grid-cols-[300px_minmax(0,1fr)_300px] gap-4 sm:gap-6 lg:gap-8 xl:gap-12 items-center">
        {/* LEFT COLUMN (Desktop >= 1024px): Date, Title, Colorful Tags, Action Buttons */}
        <div className="hidden lg:flex flex-col justify-center items-start text-left min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`left-${activeItem.id}-${lang}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="w-full space-y-3"
            >
              {activeDateStr && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold tabular-nums text-[var(--ink-meta)]">
                  <Calendar className="h-3.5 w-3.5 opacity-75" />
                  <span>{activeDateStr}</span>
                </span>
              )}

              <h3 className="apple-h2 text-[20px] xl:text-[23px] font-semibold text-[var(--ink-primary)] leading-[1.3] break-words">
                {activeTitle}
              </h3>

              {activeItem.tags && activeItem.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {activeItem.tags.map((tag) => {
                    const scheme = getTagColorScheme(tag, tagColorMap);
                    return (
                      <span
                        key={tag}
                        className={`px-2.5 py-0.5 rounded-lg text-[11.5px] font-semibold border ${scheme.pill}`}
                      >
                        {tag}
                      </span>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => onSelectProject(activeItem)}
                  data-cursor="magnetic"
                  className="inline-flex min-h-[40px] items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--ink-primary)] text-[var(--background)] text-xs font-semibold hover:opacity-85 hover:scale-[1.02] transition-all cursor-pointer"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>{viewBtnLabel}</span>
                </button>

                {activeItem.links && (
                  <a
                    href={activeItem.links}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cursor="magnetic"
                    className="inline-flex min-h-[40px] items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--pill-bg)] apple-hairline text-xs font-semibold text-[var(--ink-primary)] hover:opacity-80 hover:scale-[1.02] transition-all cursor-pointer"
                  >
                    <span>{lang === "EN" ? "Open Live" : "Xem Trực Tiếp"}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* CENTER COLUMN: Pure Frameless 4-Corner-Rounded Artwork (Adapts to Portrait, Square & Landscape) */}
        <div
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="w-full min-w-0 flex flex-col items-center"
          style={{ touchAction: "pan-y" }}
        >
          <div className="relative w-full min-h-[200px] sm:min-h-[300px] lg:min-h-[380px] flex items-center justify-center">
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.div
                key={`art-${activeItem.id}`}
                custom={direction}
                initial={{
                  opacity: 0,
                  x: direction * 24,
                  scale: 0.985,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  x: direction * -20,
                  scale: 0.985,
                }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="flex w-full items-center justify-center"
              >
                {coverSrc ? (
                  <IntrinsicPortfolioImage
                    src={coverSrc}
                    alt={activeTitle}
                    fallback={artworkPlaceholder}
                    onClick={() => onSelectProject(activeItem)}
                    className="block w-auto h-auto max-w-full max-h-[260px] min-[380px]:max-h-[300px] sm:max-h-[410px] lg:max-h-[470px] rounded-[18px] sm:rounded-[22px] object-contain apple-hairline shadow-sm hover:scale-[1.01] transition-transform duration-300 cursor-pointer"
                  />
                ) : (
                  artworkPlaceholder
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Centered Stage Controls (Prev / Counter / Next) */}
          {items.length > 1 && (
            <div className="mt-3.5 sm:mt-4 flex items-center justify-center gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={() => goToIndex(safeIndex - 1)}
                disabled={safeIndex === 0}
                data-cursor="magnetic"
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[var(--pill-bg)] apple-hairline text-[var(--ink-primary)] disabled:opacity-35 hover:scale-105 transition-all cursor-pointer disabled:cursor-default"
                aria-label={lang === "EN" ? "Previous item" : "Mục trước"}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div
                aria-live="polite"
                className="inline-flex h-9 sm:h-10 items-center px-3.5 sm:px-4 rounded-full bg-[var(--pill-bg)] apple-hairline text-xs font-semibold tabular-nums text-[var(--ink-meta)]"
              >
                {String(safeIndex + 1).padStart(2, "0")} /{" "}
                {String(items.length).padStart(2, "0")}
              </div>

              <button
                type="button"
                onClick={() => goToIndex(safeIndex + 1)}
                disabled={safeIndex === items.length - 1}
                data-cursor="magnetic"
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[var(--pill-bg)] apple-hairline text-[var(--ink-primary)] disabled:opacity-35 hover:scale-105 transition-all cursor-pointer disabled:cursor-default"
                aria-label={lang === "EN" ? "Next item" : "Mục tiếp"}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (Desktop >= 1024px): Full Editorial Description */}
        <div className="hidden lg:flex flex-col justify-center items-start text-left min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`right-${activeItem.id}-${lang}`}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="w-full space-y-2.5"
            >
              <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                {lang === "EN" ? "Overview" : "Mô tả chi tiết"}
              </span>

              {activeDesc ? (
                <div className="max-h-[300px] overflow-y-auto overscroll-contain pr-1.5 text-[14.5px] xl:text-[15px] leading-[1.7] text-[var(--ink-secondary)] whitespace-pre-line break-words">
                  {renderLinkifiedText(activeDesc)}
                </div>
              ) : (
                <p className="text-sm text-[var(--ink-muted)] italic">
                  {lang === "EN"
                    ? "Select View Details to inspect full entry metadata."
                    : "Nhấn Xem Chi Tiết để xem đầy đủ thông tin mục này."}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* MOBILE & TABLET (< 1024px): Clean Responsive Details Card Below */}
        <div className="lg:hidden w-full rounded-[20px] sm:rounded-[24px] apple-surface-card p-4 sm:p-5 text-left space-y-3">
          {activeDateStr && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold tabular-nums text-[var(--ink-meta)]">
              <Calendar className="h-3.5 w-3.5 opacity-75" />
              <span>{activeDateStr}</span>
            </span>
          )}

          <h3 className="apple-h2 text-[17px] sm:text-[20px] font-semibold text-[var(--ink-primary)] leading-[1.34] break-words">
            {activeTitle}
          </h3>

          {activeDesc && (
            <div className="text-[13.5px] sm:text-[14.5px] leading-[1.65] text-[var(--ink-secondary)] whitespace-pre-line break-words">
              {renderLinkifiedText(activeDesc)}
            </div>
          )}

          {activeItem.tags && activeItem.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {activeItem.tags.map((tag) => {
                const scheme = getTagColorScheme(tag, tagColorMap);
                return (
                  <span
                    key={tag}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${scheme.pill}`}
                  >
                    {tag}
                  </span>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 min-[360px]:flex min-[360px]:flex-wrap items-center gap-2 pt-1.5">
            <button
              type="button"
              onClick={() => onSelectProject(activeItem)}
              className="inline-flex min-h-[40px] items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[var(--ink-primary)] text-[var(--background)] text-xs font-semibold hover:opacity-85 transition-opacity cursor-pointer"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>{viewBtnLabel}</span>
            </button>

            {activeItem.links && (
              <a
                href={activeItem.links}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[40px] items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[var(--pill-bg)] apple-hairline text-xs font-semibold text-[var(--ink-primary)] hover:opacity-80 transition-opacity cursor-pointer"
              >
                <span>{lang === "EN" ? "Open Live" : "Xem Trực Tiếp"}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
