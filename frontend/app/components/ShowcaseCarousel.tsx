"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  Award,
  ChevronLeft,
  ChevronRight,
  Code,
  ExternalLink,
  Maximize2,
  Plus,
  X,
} from "lucide-react";
import type { Project } from "../PortfolioUI";

interface ShowcaseCarouselProps {
  items: Project[];
  lang: "EN" | "VN";
  isCertificateReel?: boolean;
  onSelectProject: (project: Project) => void;
  formatYearOrDate: (project: Project) => string;
  renderLinkifiedText: (text: string, className?: string) => React.ReactNode;
}

function isUnoptimizedAsset(src: string): boolean {
  return /(\.gif|\.svg)(\?|$)/i.test(src) || src.startsWith("data:");
}

export default function ShowcaseCarousel({
  items,
  lang,
  isCertificateReel = false,
  onSelectProject,
  formatYearOrDate,
  renderLinkifiedText,
}: ShowcaseCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isAnimated, setIsAnimated] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [customTransitionMs, setCustomTransitionMs] = useState<number | null>(null);
  const [viewportWidth, setViewportWidth] = useState(1280);
  const [measuredWidths, setMeasuredWidths] = useState<number[]>([]);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const syncMeasurements = useCallback(() => {
    if (typeof window === "undefined") return;
    const w = window.innerWidth;
    setViewportWidth(w);
    setIsMobile(w <= 920);
    const nextWidths = cardRefs.current.map((el) => (el && el.offsetWidth > 0 ? el.offsetWidth : 0));
    setMeasuredWidths(nextWidths);
  }, []);

  // Measure viewport, cards & breakpoint (<= 920px matches reference Apple mobile layout)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setIsAnimated(false);
      syncMeasurements();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsAnimated(true));
      });
    };

    const rafId = requestAnimationFrame(handleResize);
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
    };
  }, [syncMeasurements, items.length]);

  const safeIndex = items.length ? Math.min(currentIndex, items.length - 1) : 0;
  const activeItem = items[safeIndex] || null;
  const isOverlayOpen = Boolean(activeItem && expandedItemId === activeItem.id);

  const toggleOverlay = useCallback(
    (nextOpen?: boolean) => {
      if (!activeItem) return;
      setExpandedItemId((prev) => {
        const currentlyOpen = prev === activeItem.id;
        const target = typeof nextOpen === "boolean" ? nextOpen : !currentlyOpen;
        return target ? activeItem.id : null;
      });
    },
    [activeItem]
  );

  const goToIndex = useCallback(
    (nextIdx: number, durationMs?: number) => {
      if (!items.length) return;
      const clamped = Math.max(0, Math.min(items.length - 1, nextIdx));
      setCustomTransitionMs(durationMs ?? null);
      setIsAnimated(true);
      setDragOffset(0);
      setCurrentIndex(clamped);
      setExpandedItemId(null);
    },
    [items.length]
  );

  // Compute Apple centered stage offsets & exact symmetric peeking margins purely from state
  const { trackTranslateX, itemMargins } = useMemo(() => {
    if (!items.length) {
      return { trackTranslateX: 0, itemMargins: [] as { ml: number; mr: number }[] };
    }

    const defaultCardW = isMobile
      ? Math.min(Math.round(viewportWidth * 0.82), 540)
      : Math.min(Math.round(viewportWidth * 0.6), 760);

    const widths = items.map((_, i) => {
      const measured = measuredWidths[i];
      return measured && measured > 0 ? measured : defaultCardW;
    });

    const activeW = widths[safeIndex] || defaultCardW;
    const sideSpace = Math.max(0, (viewportWidth - activeW) / 2);
    const minMargin = isMobile ? (viewportWidth < 600 ? 10 : 14) : 20;
    const desiredPeek = isMobile
      ? Math.min(48, Math.max(12, Math.round(sideSpace * 0.4)))
      : Math.min(96, Math.max(36, Math.round(sideSpace * 0.3)));

    // Total gap between active card and immediate neighbor = bigMargin + minMargin
    const bigMargin = Math.max(minMargin, Math.round(sideSpace - desiredPeek - minMargin));

    const margins = widths.map((_, i) => ({
      ml: i > safeIndex ? bigMargin : minMargin,
      mr: i < safeIndex ? bigMargin : minMargin,
    }));

    let cursor = 0;
    let activeCenter = 0;
    for (let i = 0; i < widths.length; i++) {
      const left = cursor + margins[i].ml;
      const center = left + widths[i] / 2;
      if (i === safeIndex) {
        activeCenter = center;
      }
      cursor += margins[i].ml + widths[i] + margins[i].mr;
    }

    const tx = Math.round(viewportWidth / 2 - activeCenter);
    return { trackTranslateX: tx, itemMargins: margins };
  }, [items, safeIndex, viewportWidth, isMobile, measuredWidths]);

  // Scoped keyboard navigation (Left/Right arrows, Space to quick-toggle overlay when stage focused)
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
      if (Math.abs(stageCenter - window.innerHeight / 2) > window.innerHeight * 0.6) {
        return;
      }

      if (e.key === "ArrowLeft") {
        if (safeIndex > 0) {
          e.preventDefault();
          goToIndex(safeIndex - 1);
        }
      } else if (e.key === "ArrowRight") {
        if (safeIndex < items.length - 1) {
          e.preventDefault();
          goToIndex(safeIndex + 1);
        }
      } else if (
        e.key === " " &&
        (target === document.body || stageRef.current.contains(target)) &&
        !target?.closest("button, a")
      ) {
        e.preventDefault();
        toggleOverlay();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [safeIndex, items.length, goToIndex, toggleOverlay]);

  // Magnetic parallax on desktop frosted overlay (+/- 10px)
  const handleOverlayPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isMobile || e.pointerType !== "mouse") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const el = overlayRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nx = Math.max(-1, Math.min(1, (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)));
      const ny = Math.max(-1, Math.min(1, (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)));
      el.style.setProperty("--px", `${(nx * 10).toFixed(2)}px`);
      el.style.setProperty("--py", `${(ny * 10).toFixed(2)}px`);
    },
    [isMobile]
  );

  const handleOverlayPointerLeave = useCallback(() => {
    const el = overlayRef.current;
    if (el) {
      el.style.setProperty("--px", "0px");
      el.style.setProperty("--py", "0px");
    }
    if (!isMobile && isOverlayOpen) {
      toggleOverlay(false);
    }
  }, [isMobile, isOverlayOpen, toggleOverlay]);

  // iOS Photos Touch Swipe Physics (<= 920px: 20px edge guard, 10px axis lock, 0.55 rubber band, flick velocity)
  const touchStateRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    currentX: number;
    axis: "" | "x" | "y";
    history: { x: number; t: number }[];
  }>({
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    axis: "",
    history: [],
  });

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile || e.touches.length !== 1) return;
    const t = e.touches[0];
    // Preserve >= 20px edge-back gesture zone for iOS Safari / Android Chrome
    if (t.clientX < 20 || t.clientX > window.innerWidth - 20) return;

    touchStateRef.current = {
      active: true,
      startX: t.clientX,
      startY: t.clientY,
      currentX: t.clientX,
      axis: "",
      history: [{ x: t.clientX, t: Date.now() }],
    };
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const st = touchStateRef.current;
    if (!isMobile || !st.active || e.touches.length !== 1) return;
    const t = e.touches[0];
    const dx = t.clientX - st.startX;
    const dy = t.clientY - st.startY;
    st.currentX = t.clientX;
    st.history.push({ x: t.clientX, t: Date.now() });
    if (st.history.length > 6) st.history.shift();

    if (!st.axis) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      if (Math.abs(dx) > Math.abs(dy) * 1.2) {
        st.axis = "x";
        st.startX = t.clientX;
        st.currentX = t.clientX;
        setIsAnimated(false);
      } else {
        st.axis = "y";
      }
    }

    if (st.axis === "x") {
      const rawDelta = t.clientX - st.startX;
      const atStart = safeIndex === 0 && rawDelta > 0;
      const atEnd = safeIndex === items.length - 1 && rawDelta < 0;
      let adjusted = rawDelta;
      if (atStart || atEnd) {
        const dim = window.innerWidth || 390;
        adjusted =
          Math.sign(rawDelta) * dim * (1 - 1 / ((Math.abs(rawDelta) * 0.55) / dim + 1));
      }
      setDragOffset(adjusted);
    }
  };

  const onTouchEnd = () => {
    const st = touchStateRef.current;
    if (!isMobile || !st.active) return;
    st.active = false;

    if (st.axis !== "x") {
      setDragOffset(0);
      setIsAnimated(true);
      return;
    }

    const deltaX = st.currentX - st.startX;
    const absDelta = Math.abs(deltaX);
    let velocity = 0;
    if (st.history.length >= 2) {
      const recent = st.history[st.history.length - 1];
      let oldest = st.history[0];
      for (let i = 0; i < st.history.length - 1; i++) {
        if (recent.t - st.history[i].t <= 100) {
          oldest = st.history[i];
          break;
        }
      }
      const dt = recent.t - oldest.t;
      if (dt > 0) velocity = (recent.x - oldest.x) / dt;
    }

    const absV = Math.abs(velocity);
    const w = window.innerWidth || 390;
    let nextIdx = safeIndex;

    if (absV > 0.5) {
      if (velocity < 0 && safeIndex < items.length - 1) nextIdx++;
      else if (velocity > 0 && safeIndex > 0) nextIdx--;
    } else if (absV > 0.25 && absDelta > w * 0.2) {
      if (deltaX < 0 && safeIndex < items.length - 1) nextIdx++;
      else if (deltaX > 0 && safeIndex > 0) nextIdx--;
    } else if (absDelta > w * 0.4) {
      if (deltaX < 0 && safeIndex < items.length - 1) nextIdx++;
      else if (deltaX > 0 && safeIndex > 0) nextIdx--;
    }

    const dur =
      absV > 1.1
        ? 320
        : absV > 0.5
        ? 380
        : nextIdx !== safeIndex
        ? 460
        : 380;

    goToIndex(nextIdx, dur);
  };

  if (!items.length || !activeItem) {
    return (
      <div className="apple-shell my-14">
        <div className="mx-auto max-w-2xl px-6 py-16 text-center rounded-[26px] apple-hairline bg-[var(--surface-elevated)] text-[var(--ink-meta)] text-sm">
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
  const activeYear = formatYearOrDate(activeItem);
  const activePill =
    activeItem.tags?.[0] ||
    activeItem.category ||
    (isCertificateReel
      ? lang === "EN"
        ? "Credential"
        : "Chứng chỉ"
      : lang === "EN"
      ? "Software"
      : "Dự án");

  const renderOverlayCard = () => (
    <div
      ref={overlayRef}
      onPointerMove={handleOverlayPointerMove}
      onPointerLeave={handleOverlayPointerLeave}
      onClick={() => {
        if (!isOverlayOpen) toggleOverlay(true);
      }}
      data-cursor="overlay"
      className={`carousel-overlay-surface magnetic-target z-20 rounded-[20px] sm:rounded-[22px] transition-all duration-300 ${
        isMobile
          ? "relative mx-auto mt-4 w-[min(82vw,540px)] apple-glass px-4 sm:px-5 py-3.5 sm:py-4 text-left"
          : `absolute top-1/2 ${
              isOverlayOpen
                ? "apple-glass w-[330px] p-5 rounded-[24px]"
                : "apple-glass hover:scale-[1.03] px-4.5 py-3.5 w-[285px] cursor-pointer"
            }`
      }`}
      style={
        !isMobile
          ? {
              left: "max(var(--page-gutter), calc(50% - min(30vw, 380px) - 44px))",
              transform: `translate3d(var(--px, 0px), calc(-50% + var(--py, 0px)), 0)`,
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-3 py-[0.08em]">
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] sm:text-[16px] leading-[1.35] font-bold text-[var(--ink-primary)] line-clamp-2">
            {activeTitle}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {activeYear && (
              <span className="text-[12.5px] font-semibold tabular-nums text-[var(--ink-meta)]">
                {activeYear}
              </span>
            )}
            {activePill && (
              <span className="px-2 py-0.5 rounded-[6px] bg-[var(--pill-bg)] text-[var(--ink-meta)] font-semibold text-[11px] leading-[18px]">
                {activePill}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleOverlay();
          }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--pill-bg)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-colors cursor-pointer"
          aria-expanded={isOverlayOpen}
          aria-label={
            isOverlayOpen
              ? lang === "EN"
                ? "Collapse summary"
                : "Thu gọn mô tả"
              : lang === "EN"
              ? "Expand summary"
              : "Mở rộng mô tả"
          }
        >
          {isOverlayOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isOverlayOpen && (
          <motion.div
            key="overlay-expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0.6, 0.2, 1] }}
            className={`overflow-hidden ${
              isMobile ? "max-h-[42dvh] overflow-y-auto overscroll-contain" : ""
            }`}
          >
            <div className="pt-3.5 mt-3 border-t border-[var(--card-border)] space-y-3.5 py-[0.12em]">
              {activeDesc && (
                <div className="text-[13.5px] leading-[1.6] text-[var(--glass-sub-ink)] line-clamp-6">
                  {renderLinkifiedText(activeDesc)}
                </div>
              )}

              {activeItem.tags && activeItem.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {activeItem.tags.slice(0, 6).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[var(--pill-bg)] text-[var(--ink-secondary)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectProject(activeItem);
                  }}
                  className="inline-flex min-h-[38px] items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--ink-primary)] text-[var(--background)] text-xs font-semibold hover:opacity-85 transition-opacity cursor-pointer"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>{lang === "EN" ? "Full Details" : "Xem Chi Tiết"}</span>
                </button>

                {activeItem.links && (
                  <a
                    href={activeItem.links}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex min-h-[38px] items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--pill-bg)] text-[var(--ink-primary)] text-xs font-semibold hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <span>{lang === "EN" ? "Live" : "Mở Link"}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
            ? "Certificates showcase"
            : "Trình diễn chứng chỉ"
          : lang === "EN"
          ? "Projects showcase"
          : "Trình diễn dự án"
      }
      className="relative w-full select-none focus:outline-none my-3 sm:my-4"
    >
      {/* Main Horizontal Stage */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="relative w-full overflow-hidden py-2.5 sm:py-4"
        style={{
          touchAction: "pan-y",
        }}
      >
        {/* Desktop Stage-Anchored Frosted Overlay */}
        {!isMobile && renderOverlayCard()}

        {/* Desktop Invisible Left / Right Click Zones (disabled on <= 920px per Apple HIG audit) */}
        {!isMobile && items.length > 1 && (
          <>
            <div
              onClick={() => safeIndex > 0 && goToIndex(safeIndex - 1)}
              data-cursor={safeIndex > 0 ? "prev" : "disabled"}
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-[22%] z-10"
            />
            <div
              onClick={() => safeIndex < items.length - 1 && goToIndex(safeIndex + 1)}
              data-cursor={safeIndex < items.length - 1 ? "next" : "disabled"}
              aria-hidden="true"
              className="absolute inset-y-0 right-0 w-[22%] z-10"
            />
          </>
        )}

        {/* Carousel Track */}
        <div
          ref={trackRef}
          className={`apple-carousel-track ${isAnimated ? "is-animated" : ""}`}
          style={{
            transform: `translate3d(${trackTranslateX + dragOffset}px, 0, 0)`,
            transitionDuration:
              isAnimated && customTransitionMs ? `${customTransitionMs}ms` : undefined,
          }}
        >
          {items.map((item, idx) => {
            const isActive = idx === safeIndex;
            const title =
              (lang === "EN" ? item.title_en : item.title_vn) ||
              item.title_en ||
              item.title_vn ||
              "Untitled";
            const coverSrc = item.images && item.images[0] ? item.images[0] : "";
            const margins = itemMargins[idx] || { ml: 16, mr: 16 };

            return (
              <div
                key={item.id}
                ref={(el) => {
                  cardRefs.current[idx] = el;
                }}
                onClick={() => {
                  if (!isActive) {
                    goToIndex(idx);
                  } else {
                    onSelectProject(item);
                  }
                }}
                data-cursor={
                  !isActive
                    ? idx < safeIndex
                      ? "prev"
                      : "next"
                    : "magnetic"
                }
                style={{
                  marginLeft: `${margins.ml}px`,
                  marginRight: `${margins.mr}px`,
                  boxShadow: isActive ? "var(--card-shadow)" : "none",
                }}
                className={`apple-carousel-card apple-hairline bg-[var(--surface-elevated)] cursor-pointer ${
                  isAnimated ? "is-animated" : ""
                } ${isActive ? "is-active" : ""}`}
              >
                {coverSrc ? (
                  <div className="relative h-full w-full bg-[var(--surface-elevated)]">
                    <Image
                      src={coverSrc}
                      alt={title}
                      fill
                      priority={idx <= 1}
                      unoptimized={isUnoptimizedAsset(coverSrc)}
                      sizes="(max-width: 920px) 84vw, 760px"
                      onLoad={() => {
                        if (idx === safeIndex) syncMeasurements();
                      }}
                      className={
                        isCertificateReel
                          ? "object-contain p-3 sm:p-5"
                          : "object-cover object-top"
                      }
                    />
                    {item.images.length > 1 && isActive && (
                      <span className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-full apple-glass text-[11px] font-semibold tabular-nums text-[var(--ink-primary)]">
                        1 / {item.images.length}
                      </span>
                    )}
                  </div>
                ) : (
                  /* Bespoke Apple Studio Poster Card when a Notion entry has no cover image */
                  <div className="relative flex h-full w-full flex-col justify-between p-6 sm:p-10 bg-gradient-to-br from-[var(--surface-elevated)] via-[var(--background)] to-[var(--pill-bg)]">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-[var(--pill-bg)] text-[var(--ink-primary)]">
                        {isCertificateReel ? (
                          <Award className="h-5 w-5" />
                        ) : (
                          <Code className="h-5 w-5" />
                        )}
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-[var(--ink-meta)]">
                        {formatYearOrDate(item)}
                      </span>
                    </div>

                    <div className="max-w-lg py-[0.12em]">
                      <p className="text-[11px] sm:text-xs uppercase tracking-[0.14em] font-semibold text-[var(--ink-meta)] mb-1.5 sm:mb-2">
                        {item.category || (isCertificateReel ? "Credential" : "Featured Work")}
                      </p>
                      <h4 className="apple-h2 text-lg sm:text-3xl font-semibold text-[var(--ink-primary)] line-clamp-2">
                        {title}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-1.5">
                        {(item.tags || []).slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[var(--pill-bg)] text-[var(--ink-secondary)]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--ink-meta)] shrink-0">
                        <span>{lang === "EN" ? "Open" : "Mở"}</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile Overlay beneath active card (flush width with card) */}
        {isMobile && renderOverlayCard()}
      </div>

      {/* Symmetric Stage Controls: Uniform 40px height across Prev / Counter / Next */}
      {items.length > 1 && (
        <div className="mt-2 sm:mt-3 flex items-center justify-center gap-2.5">
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
            {String(safeIndex + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
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
  );
}
