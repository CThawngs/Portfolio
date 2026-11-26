"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
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
import { Tilt3DCard } from "./Scroll3D";
import type { Project } from "../PortfolioUI";

interface ShowcaseCarouselProps {
  items: Project[];
  lang: "EN" | "VN";
  isCertificateReel?: boolean;
  onSelectProject: (project: Project) => void;
  formatYearOrDate: (project: Project) => string;
  formatDateRange: (dateRange: Project["project_date"]) => string | null;
  renderLinkifiedText: (text: string, className?: string) => React.ReactNode;
}

function isUnoptimizedAsset(src: string): boolean {
  return /(\.gif|\.svg)(\?|$)/i.test(src) || src.startsWith("data:");
}

/**
 * ShowcaseCarousel — Zero-Overlap 3-Column Apple Editorial Stage (Direction 1)
 * - Desktop (>= 1024px):
 *   [Left Gutter: Category + Date, Title, Tags, 2 Action Buttons]
 *   [Center Stage: 100% Unobstructed 3D Artwork Frame (object-contain, zero overlap)]
 *   [Right Gutter: Full Editorial Description]
 * - Mobile / Tablet (< 1024px, including 360px–375px iPhone mini / iPhone 7 / iPhone X):
 *   Touch-swipeable Unobstructed Artwork Frame on top -> Prev/Counter/Next bar -> Elevated Details Card below.
 */
export default function ShowcaseCarousel({
  items,
  lang,
  isCertificateReel = false,
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
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.closest("[role='dialog']"))
      ) {
        return;
      }

      if (!stageRef.current) return;
      const rect = stageRef.current.getBoundingClientRect();
      const stageCenter = rect.top + rect.height / 2;
      if (Math.abs(stageCenter - window.innerHeight / 2) > window.innerHeight * 0.55) {
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
      <div className="my-8">
        <div className="mx-auto max-w-2xl px-6 py-14 text-center rounded-[24px] apple-surface-card text-[var(--ink-meta)] text-sm">
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
  const activeCategory =
    activeItem.category && activeItem.category !== "Uncategorized"
      ? activeItem.category
      : isCertificateReel
      ? lang === "EN"
        ? "Certificate"
        : "Chứng chỉ"
      : lang === "EN"
      ? "Project"
      : "Dự án";
  const coverSrc =
    activeItem.images && activeItem.images[0] ? activeItem.images[0] : "";

  const viewBtnLabel = isCertificateReel
    ? lang === "EN"
      ? "View Certificate"
      : "Xem Chứng Chỉ"
    : lang === "EN"
    ? "View Details"
    : "Xem Chi Tiết";

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
      className="relative w-full select-none focus:outline-none py-4 sm:py-6"
    >
      {/* 3-Column Non-Overlapping Apple Editorial Stage on Desktop / Clean Vertical Stack on < 1024px */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)_minmax(220px,280px)] xl:grid-cols-[305px_minmax(0,1fr)_305px] gap-5 sm:gap-6 lg:gap-8 xl:gap-11 items-center">
        {/* LEFT COLUMN (Desktop >= 1024px): Title, Date, Category & Tags, 2 Action Buttons */}
        <div className="hidden lg:flex flex-col justify-center items-start text-left min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`left-${activeItem.id}-${lang}`}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="w-full space-y-3.5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-[var(--pill-bg)] apple-hairline text-[11px] font-semibold text-[var(--ink-primary)]">
                  {activeCategory}
                </span>
                {activeDateStr && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold tabular-nums text-[var(--ink-meta)]">
                    <Calendar className="h-3.5 w-3.5 opacity-75" />
                    <span>{activeDateStr}</span>
                  </span>
                )}
              </div>

              <h3 className="apple-h2 text-[20px] xl:text-[23px] font-semibold text-[var(--ink-primary)] leading-[1.3] break-words">
                {activeTitle}
              </h3>

              {activeItem.tags && activeItem.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {activeItem.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-lg text-[11.5px] font-medium bg-[var(--pill-bg)] apple-hairline text-[var(--ink-secondary)]"
                    >
                      {tag}
                    </span>
                  ))}
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

        {/* CENTER COLUMN: 100% Unobstructed 3D Studio Artwork Frame */}
        <div
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="w-full min-w-0 apple-perspective-stage"
          style={{ touchAction: "pan-y" }}
        >
          <Tilt3DCard
            maxTilt={3.5}
            onClick={() => onSelectProject(activeItem)}
            className="rounded-[20px] sm:rounded-[26px] apple-surface-card overflow-hidden cursor-pointer"
          >
            <div className="relative w-full aspect-[16/10] bg-[var(--surface-elevated)] overflow-hidden">
              <AnimatePresence mode="wait" initial={false} custom={direction}>
                <motion.div
                  key={`art-${activeItem.id}`}
                  custom={direction}
                  initial={{
                    opacity: 0,
                    x: direction * 34,
                    scale: 0.975,
                    rotateY: direction * -4,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    scale: 1,
                    rotateY: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x: direction * -28,
                    scale: 0.98,
                    rotateY: direction * 3,
                  }}
                  transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  style={{ transformPerspective: 1100 }}
                  className="relative h-full w-full"
                >
                  {coverSrc ? (
                    <div className="relative h-full w-full bg-[var(--surface-elevated)]">
                      <Image
                        src={coverSrc}
                        alt={activeTitle}
                        fill
                        priority
                        unoptimized={isUnoptimizedAsset(coverSrc)}
                        sizes="(max-width: 1024px) 94vw, 760px"
                        className="object-contain p-2 sm:p-3.5"
                      />
                      {activeItem.images.length > 1 && (
                        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full apple-glass text-[11px] font-semibold tabular-nums text-[var(--ink-primary)]">
                          1 / {activeItem.images.length}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="relative flex h-full w-full flex-col items-center justify-center p-6 sm:p-10 bg-gradient-to-br from-[var(--surface-elevated)] via-[var(--background)] to-[var(--pill-bg)] text-center">
                      <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-[22px] sm:rounded-[26px] bg-[var(--pill-bg)] apple-hairline text-[var(--ink-primary)] mb-3.5">
                        {isCertificateReel ? (
                          <Award className="h-8 w-8 sm:h-9 sm:w-9 opacity-80" />
                        ) : (
                          <Code className="h-8 w-8 sm:h-9 sm:w-9 opacity-80" />
                        )}
                      </div>
                      <span className="px-3 py-1 rounded-full bg-[var(--pill-bg)] apple-hairline text-[11px] uppercase tracking-[0.12em] font-semibold text-[var(--ink-meta)]">
                        {activeCategory}
                      </span>
                      <p className="mt-3 max-w-md text-sm sm:text-base font-medium text-[var(--ink-primary)] line-clamp-2">
                        {activeTitle}
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </Tilt3DCard>

          {/* Centered Stage Controls (Prev / Counter / Next) right below Center Frame */}
          {items.length > 1 && (
            <div className="mt-3.5 sm:mt-4 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => goToIndex(safeIndex - 1)}
                disabled={safeIndex === 0}
                data-cursor="magnetic"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pill-bg)] apple-hairline text-[var(--ink-primary)] disabled:opacity-35 hover:scale-105 transition-all cursor-pointer disabled:cursor-default"
                aria-label={lang === "EN" ? "Previous item" : "Mục trước"}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div
                aria-live="polite"
                className="inline-flex h-10 items-center px-4 rounded-full bg-[var(--pill-bg)] apple-hairline text-xs font-semibold tabular-nums text-[var(--ink-meta)]"
              >
                {String(safeIndex + 1).padStart(2, "0")} /{" "}
                {String(items.length).padStart(2, "0")}
              </div>

              <button
                type="button"
                onClick={() => goToIndex(safeIndex + 1)}
                disabled={safeIndex === items.length - 1}
                data-cursor="magnetic"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pill-bg)] apple-hairline text-[var(--ink-primary)] disabled:opacity-35 hover:scale-105 transition-all cursor-pointer disabled:cursor-default"
                aria-label={lang === "EN" ? "Next item" : "Mục tiếp"}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (Desktop >= 1024px): Full Editorial Description in Right Whitespace */}
        <div className="hidden lg:flex flex-col justify-center items-start text-left min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`right-${activeItem.id}-${lang}`}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="w-full space-y-2.5"
            >
              <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                {lang === "EN" ? "Overview" : "Mô tả chi tiết"}
              </span>

              {activeDesc ? (
                <div className="max-h-[300px] overflow-y-auto overscroll-contain pr-1.5 text-[14.5px] xl:text-[15px] leading-[1.7] text-[var(--ink-secondary)] whitespace-pre-line">
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

        {/* MOBILE & TABLET (< 1024px, tuned for 360px–375px iPhone mini / iPhone 7 / iPhone X): Clean Non-Overlapping Card Below */}
        <div className="lg:hidden w-full rounded-[20px] sm:rounded-[24px] apple-surface-card p-4 sm:p-5 text-left space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-[var(--pill-bg)] apple-hairline text-[11px] font-semibold text-[var(--ink-primary)]">
                {activeCategory}
              </span>
              {activeDateStr && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold tabular-nums text-[var(--ink-meta)]">
                  <Calendar className="h-3.5 w-3.5 opacity-75" />
                  <span>{activeDateStr}</span>
                </span>
              )}
            </div>
          </div>

          <h3 className="apple-h2 text-[17.5px] sm:text-[20px] font-semibold text-[var(--ink-primary)] leading-[1.34] break-words">
            {activeTitle}
          </h3>

          {activeDesc && (
            <div className="text-[13.5px] sm:text-[14.5px] leading-[1.65] text-[var(--ink-secondary)] whitespace-pre-line">
              {renderLinkifiedText(activeDesc)}
            </div>
          )}

          {activeItem.tags && activeItem.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {activeItem.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[var(--pill-bg)] apple-hairline text-[var(--ink-secondary)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1.5">
            <button
              type="button"
              onClick={() => onSelectProject(activeItem)}
              className="inline-flex min-h-[38px] items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--ink-primary)] text-[var(--background)] text-xs font-semibold hover:opacity-85 transition-opacity cursor-pointer"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>{viewBtnLabel}</span>
            </button>

            {activeItem.links && (
              <a
                href={activeItem.links}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[38px] items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--pill-bg)] apple-hairline text-xs font-semibold text-[var(--ink-primary)] hover:opacity-80 transition-opacity cursor-pointer"
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
