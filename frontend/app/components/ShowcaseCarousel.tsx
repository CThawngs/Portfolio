"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useSyncExternalStore,
} from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  Award,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Code,
  ExternalLink,
  Maximize2,
} from "lucide-react";
import {
  IntrinsicPortfolioImage,
  type AllowedNextImageWidth,
} from "./SafePortfolioImage";
import { preloadImagesPriority } from "./imagePreloader";
import { useReducedMotionPreference } from "./Scroll3D";
import { getTagColorScheme, type TagColorScheme } from "./tagPalette";
import type { Project } from "../PortfolioUI";

function subscribeDesktopStage(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(min-width: 1024px)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getDesktopStageSnapshot(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(min-width: 1024px)").matches;
}

function getStageOptimalWidth(): AllowedNextImageWidth {
  if (typeof window === "undefined") return 1080;
  const vw = window.innerWidth || 1440;
  const dpr = window.devicePixelRatio || 1;
  const cssPx = vw <= 639 ? vw * 0.94 : vw <= 1023 ? vw * 0.82 : 750;
  const needed = cssPx * dpr;
  if (needed <= 640) return 640;
  if (needed <= 828) return 828;
  return 1080;
}

const MORPH_SPRING = {
  type: "spring" as const,
  stiffness: 370,
  damping: 32,
  mass: 0.78,
};

/**
 * StageOverviewTyping
 * - Fast, silky 60fps one-shot terminal typing effect for Stage View's Overview column.
 * - Much faster than `#about` (`~420ms–1100ms` total) and NEVER deletes or loops:
 *   keeps 100% of the full description permanently displayed once finished, with
 *   clickable URLs rendered on completion and zero height bounce via an invisible sizing ghost.
 */
function StageOverviewTyping({
  text,
  renderLinkifiedText,
  className = "",
}: {
  text: string;
  renderLinkifiedText: (text: string, className?: string) => React.ReactNode;
  className?: string;
}) {
  const reducedMotion = useReducedMotionPreference();
  const [charCount, setCharCount] = useState(() =>
    reducedMotion ? text.length : 0
  );

  useEffect(() => {
    if (reducedMotion || !text) return;

    let rafId: number | null = null;
    const startTime = performance.now();
    const totalLen = text.length;
    const durationMs = Math.min(1100, Math.max(400, totalLen * 4.0));

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - progress, 1.35);
      const nextCount = Math.min(totalLen, Math.max(1, Math.ceil(eased * totalLen)));
      setCharCount(nextCount);
      if (progress < 1) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, [text, reducedMotion]);

  if (!text) return null;

  const visibleLen = reducedMotion ? text.length : charCount;
  const isDone = visibleLen >= text.length;

  return (
    <div
      data-testid="stage-overview-typing"
      data-typing-complete={isDone ? "true" : "false"}
      className={`grid ${className}`}
    >
      {/* Invisible full-text reserve prevents layout/height jump while typing */}
      <div
        aria-hidden="true"
        className="[grid-area:1/1] invisible pointer-events-none select-none whitespace-pre-line break-words"
      >
        {text}
      </div>

      <div className="[grid-area:1/1] whitespace-pre-line break-words">
        {isDone ? (
          renderLinkifiedText(text)
        ) : (
          <>
            <span>{text.slice(0, visibleLen)}</span>
            <span
              aria-hidden="true"
              className="inline-block w-[1.8px] h-[1.04em] align-middle bg-[var(--ink-primary)] ml-0.5 animate-pulse rounded-full"
            />
          </>
        )}
      </div>
    </div>
  );
}

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
  const isDesktopStage = useSyncExternalStore(
    subscribeDesktopStage,
    getDesktopStageSnapshot,
    () => true
  );

  const safeIndex = items.length ? Math.min(currentIndex, items.length - 1) : 0;
  const activeItem = items[safeIndex] || null;
  const activeCoverUrl = activeItem?.images?.[0] || "";

  // Polite neighbor + active preload matching exact `srcSet` width for 0ms Next/Prev & Modal open
  useEffect(() => {
    if (!items.length) return;
    const urlsToWarm: string[] = [];
    for (const offset of [0, 1, -1, 2, -2]) {
      const idx = safeIndex + offset;
      if (idx >= 0 && idx < items.length) {
        const cover = items[idx]?.images?.[0];
        if (cover) urlsToWarm.push(cover);
      }
    }
    preloadImagesPriority(urlsToWarm, getStageOptimalWidth());
  }, [items, safeIndex]);

  const prewarmActiveModal = useCallback(() => {
    if (activeCoverUrl) {
      preloadImagesPriority([activeCoverUrl], 1080);
    }
  }, [activeCoverUrl]);

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

  const touchRef = useRef<{ startX: number; startY: number; active: boolean }>({
    startX: 0,
    startY: 0,
    active: false,
  });

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    prewarmActiveModal();
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

  const scopePrefix = isCertificateReel ? "cert-stage" : "proj-stage";
  const desktopMorphPrefix = isDesktopStage ? `${scopePrefix}-lg` : undefined;
  const mobileMorphPrefix = !isDesktopStage ? `${scopePrefix}-sm` : undefined;

  const artworkPlaceholder = (
    <div
      onClick={() => onSelectProject(activeItem)}
      data-cursor="view"
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
    <LayoutGroup id={scopePrefix}>
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
        className="relative w-full select-none focus:outline-none py-3 sm:py-5"
      >
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)_minmax(220px,280px)] xl:grid-cols-[300px_minmax(0,1fr)_300px] gap-4 sm:gap-5 lg:gap-8 xl:gap-12 items-center">
          {/* LEFT COLUMN (Desktop >= 1024px) — PowerPoint / Google Slides Shared-Element Morph */}
          <div
            data-testid="stage-left-morph"
            className="hidden lg:flex flex-col justify-center items-start text-left min-w-0"
          >
            <motion.div
              layout="position"
              transition={MORPH_SPRING}
              className="w-full space-y-3"
            >
              {/* Morphing Date Badge */}
              <AnimatePresence mode="popLayout" initial={false}>
                {activeDateStr && (
                  <motion.span
                    key={`date-${activeItem.id}`}
                    layoutId={
                      desktopMorphPrefix
                        ? `${desktopMorphPrefix}-date`
                        : undefined
                    }
                    initial={{ opacity: 0, y: direction * 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: direction * -8 }}
                    transition={MORPH_SPRING}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold tabular-nums text-[var(--ink-meta)]"
                  >
                    <Calendar className="h-3.5 w-3.5 opacity-75" />
                    <span>{activeDateStr}</span>
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Slide-Morphing Title */}
              <div className="relative overflow-hidden py-0.5">
                <AnimatePresence mode="wait" initial={false} custom={direction}>
                  <motion.h3
                    key={`title-${activeItem.id}-${lang}`}
                    initial={{
                      opacity: 0,
                      y: direction * 16,
                      scale: 0.97,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                      y: direction * -14,
                      scale: 0.97,
                    }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    className="apple-h2 text-[20px] xl:text-[23px] font-semibold text-[var(--ink-primary)] leading-[1.3] break-words"
                  >
                    {activeTitle}
                  </motion.h3>
                </AnimatePresence>
              </div>

              {/* Shared-Tag PowerPoint Morph: Matching tags physically glide between positions */}
              {activeItem.tags && activeItem.tags.length > 0 && (
                <motion.div
                  layout="position"
                  transition={MORPH_SPRING}
                  className="flex flex-wrap gap-1.5 pt-0.5"
                >
                  <AnimatePresence mode="popLayout" initial={false}>
                    {activeItem.tags.map((tag) => {
                      const scheme = getTagColorScheme(tag, tagColorMap);
                      return (
                        <motion.span
                          key={tag}
                          layoutId={
                            desktopMorphPrefix
                              ? `${desktopMorphPrefix}-tag-${tag}`
                              : undefined
                          }
                          initial={{ opacity: 0, scale: 0.84, y: 6 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.84, y: -4 }}
                          transition={MORPH_SPRING}
                          className={`px-2.5 py-0.5 rounded-lg text-[11.5px] font-semibold border ${scheme.pill}`}
                        >
                          {tag}
                        </motion.span>
                      );
                    })}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Persistent Morphing Action Buttons */}
              <motion.div
                layout="position"
                transition={MORPH_SPRING}
                className="flex flex-wrap items-center gap-2.5 pt-2"
              >
                <motion.button
                  layoutId={
                    desktopMorphPrefix
                      ? `${desktopMorphPrefix}-cta-primary`
                      : undefined
                  }
                  transition={MORPH_SPRING}
                  type="button"
                  onPointerEnter={prewarmActiveModal}
                  onClick={() => onSelectProject(activeItem)}
                  data-cursor="magnetic"
                  className="inline-flex min-h-[40px] items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--ink-primary)] text-[var(--background)] text-xs font-semibold hover:opacity-85 hover:scale-[1.02] transition-opacity cursor-pointer"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>{viewBtnLabel}</span>
                </motion.button>

                <AnimatePresence mode="popLayout" initial={false}>
                  {activeItem.links && (
                    <motion.a
                      key="cta-open-live"
                      layoutId={
                        desktopMorphPrefix
                          ? `${desktopMorphPrefix}-cta-live`
                          : undefined
                      }
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={MORPH_SPRING}
                      href={activeItem.links}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-cursor="magnetic"
                      className="inline-flex min-h-[40px] items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--pill-bg)] apple-hairline text-xs font-semibold text-[var(--ink-primary)] hover:opacity-80 hover:scale-[1.02] transition-opacity cursor-pointer"
                    >
                      <span>
                        {lang === "EN" ? "Open Live" : "Xem Trực Tiếp"}
                      </span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </motion.a>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          </div>

          {/* CENTER COLUMN: Frameless 4-Corner-Rounded Compressed WebP Artwork (Top on Mobile, Center on Desktop) */}
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
                    x: direction * 26,
                    scale: 0.962,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    x: direction * -22,
                    scale: 0.968,
                  }}
                  transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                  className="flex w-full items-center justify-center"
                >
                  {coverSrc ? (
                    <IntrinsicPortfolioImage
                      src={coverSrc}
                      alt={activeTitle}
                      fallback={artworkPlaceholder}
                      onPointerEnter={prewarmActiveModal}
                      onTouchStart={prewarmActiveModal}
                      onClick={() => onSelectProject(activeItem)}
                      className="block w-auto h-auto max-w-full max-h-[260px] min-[380px]:max-h-[300px] sm:max-h-[400px] lg:max-h-[470px] rounded-[18px] sm:rounded-[22px] object-contain apple-hairline shadow-sm hover:scale-[1.01] transition-transform duration-300 cursor-pointer"
                    />
                  ) : (
                    artworkPlaceholder
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* RIGHT COLUMN (Desktop >= 1024px) — Fast Full One-Shot Typing Overview */}
          <div className="hidden lg:flex flex-col justify-center items-start text-left min-w-0">
            <div className="w-full space-y-2.5">
              <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                {lang === "EN" ? "Overview" : "Mô tả chi tiết"}
              </span>

              {activeDesc ? (
                <div className="max-h-[300px] overflow-y-auto overscroll-contain pr-1.5 text-[14.5px] xl:text-[15px] leading-[1.7] text-[var(--ink-secondary)]">
                  <StageOverviewTyping
                    key={`typing-lg-${activeItem.id}-${lang}`}
                    text={activeDesc}
                    renderLinkifiedText={renderLinkifiedText}
                  />
                </div>
              ) : (
                <p className="text-sm text-[var(--ink-muted)] italic">
                  {lang === "EN"
                    ? "Select View Details to inspect full entry metadata."
                    : "Nhấn Xem Chi Tiết để xem đầy đủ thông tin mục này."}
                </p>
              )}
            </div>
          </div>

          {/* MOBILE & TABLET (< 1024px) — Unified Morph Info Card + Fast Typing Overview (Above Bottom Arrows) */}
          <motion.div
            layout="position"
            transition={MORPH_SPRING}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            style={{ touchAction: "pan-y" }}
            data-testid="stage-mobile-card"
            className="lg:hidden w-full rounded-[20px] sm:rounded-[24px] apple-surface-card p-4 sm:p-5 text-left space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              {activeDateStr ? (
                <motion.span
                  layoutId={
                    mobileMorphPrefix
                      ? `${mobileMorphPrefix}-date`
                      : undefined
                  }
                  transition={MORPH_SPRING}
                  className="inline-flex items-center gap-1 text-xs font-semibold tabular-nums text-[var(--ink-meta)]"
                >
                  <Calendar className="h-3.5 w-3.5 opacity-75" />
                  <span>{activeDateStr}</span>
                </motion.span>
              ) : (
                <span />
              )}

              <span className="text-[11px] font-semibold tabular-nums text-[var(--ink-muted)]">
                {String(safeIndex + 1).padStart(2, "0")} /{" "}
                {String(items.length).padStart(2, "0")}
              </span>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.h3
                key={`m-title-${activeItem.id}-${lang}`}
                initial={{ opacity: 0, y: direction * 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: direction * -8 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="apple-h2 text-[17.5px] sm:text-[20px] font-semibold text-[var(--ink-primary)] leading-[1.34] break-words"
              >
                {activeTitle}
              </motion.h3>
            </AnimatePresence>

            {activeItem.tags && activeItem.tags.length > 0 && (
              <motion.div
                layout="position"
                transition={MORPH_SPRING}
                className="flex flex-wrap gap-1.5"
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  {activeItem.tags.map((tag) => {
                    const scheme = getTagColorScheme(tag, tagColorMap);
                    return (
                      <motion.span
                        key={tag}
                        layoutId={
                          mobileMorphPrefix
                            ? `${mobileMorphPrefix}-tag-${tag}`
                            : undefined
                        }
                        initial={{ opacity: 0, scale: 0.86 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.86 }}
                        transition={MORPH_SPRING}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${scheme.pill}`}
                      >
                        {tag}
                      </motion.span>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}

            {activeDesc && (
              <div className="pt-1 border-t border-[var(--card-border)] space-y-1.5">
                <span className="block text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                  {lang === "EN" ? "Overview" : "Mô tả chi tiết"}
                </span>
                <div className="text-[13.5px] sm:text-[14.5px] leading-[1.64] text-[var(--ink-secondary)]">
                  <StageOverviewTyping
                    key={`typing-sm-${activeItem.id}-${lang}`}
                    text={activeDesc}
                    renderLinkifiedText={renderLinkifiedText}
                  />
                </div>
              </div>
            )}

            <motion.div
              layout="position"
              transition={MORPH_SPRING}
              className="grid grid-cols-1 min-[360px]:flex min-[360px]:flex-wrap items-center gap-2 pt-1.5"
            >
              <motion.button
                layoutId={
                  mobileMorphPrefix
                    ? `${mobileMorphPrefix}-cta-primary`
                    : undefined
                }
                transition={MORPH_SPRING}
                type="button"
                onTouchStart={prewarmActiveModal}
                onClick={() => onSelectProject(activeItem)}
                className="inline-flex min-h-[40px] items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[var(--ink-primary)] text-[var(--background)] text-xs font-semibold hover:opacity-85 transition-opacity cursor-pointer"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                <span>{viewBtnLabel}</span>
              </motion.button>

              {activeItem.links && (
                <motion.a
                  layoutId={
                    mobileMorphPrefix
                      ? `${mobileMorphPrefix}-cta-live`
                      : undefined
                  }
                  transition={MORPH_SPRING}
                  href={activeItem.links}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[40px] items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[var(--pill-bg)] apple-hairline text-xs font-semibold text-[var(--ink-primary)] hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <span>{lang === "EN" ? "Open Live" : "Xem Trực Tiếp"}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </motion.a>
              )}
            </motion.div>
          </motion.div>
        </div>

        {/* BOTTOM-MOST STAGE NAVIGATION (`<  01 / N  >`) — Always Cleanly Positioned at the Very Bottom */}
        {items.length > 1 && (
          <div
            data-testid="stage-bottom-nav"
            className="mt-4 sm:mt-5 flex items-center justify-center gap-2.5"
          >
            <button
              type="button"
              onClick={() => goToIndex(safeIndex - 1)}
              disabled={safeIndex === 0}
              data-cursor="prev"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pill-bg)] apple-hairline text-[var(--ink-primary)] disabled:opacity-35 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:cursor-default"
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
              data-cursor="next"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pill-bg)] apple-hairline text-[var(--ink-primary)] disabled:opacity-35 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:cursor-default"
              aria-label={lang === "EN" ? "Next item" : "Mục tiếp"}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </LayoutGroup>
  );
}
