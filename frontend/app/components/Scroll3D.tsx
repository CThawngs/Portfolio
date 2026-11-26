"use client";

import React, {
  useRef,
  useCallback,
  useEffect,
  useSyncExternalStore,
} from "react";

export function subscribeReducedMotion(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

export function getReducedMotionSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useReducedMotionPreference(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    () => false
  );
}

/**
 * Scroll3DSection
 * One-shot GPU compositor entrance (`opacity` + `translate3d(0, 18px, 0) -> 0`).
 * Disconnects its `IntersectionObserver` immediately after revealing once so
 * ongoing scroll remains 100% zero-overhead (locked 60fps on low-end laptops).
 */
export function Scroll3DSection({
  id,
  className = "",
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotionPreference();

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (reducedMotion || typeof IntersectionObserver === "undefined") {
      el.setAttribute("data-revealed", "true");
      return;
    }

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.94) {
      el.setAttribute("data-revealed", "true");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-revealed", "true");
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.06, rootMargin: "0px 0px -28px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <section
      ref={sectionRef}
      id={id}
      data-revealed={reducedMotion ? "true" : "false"}
      className={`apple-section-reveal ${className}`}
    >
      {children}
    </section>
  );
}

function getGridColumnCount(): number {
  if (typeof window === "undefined") return 3;
  if (window.innerWidth >= 1024) return 3;
  if (window.innerWidth >= 640) return 2;
  return 1;
}

/**
 * StaggeredShowcaseGrid
 * Orchestrates strict Row-by-Row, Left-before-Right, Bottom-to-Top card entrance:
 * - Within Row 1: Left card -> Middle card -> Right card (`+115ms` per column).
 * - Row 2 waits until Row 1 finishes cascading (`+210ms` row-completion beat) before
 *   revealing Row 2 Left -> Middle -> Right, and so on for subsequent rows.
 * - Uses a single shared `IntersectionObserver` that unobserves each card once revealed
 *   and clears transition delays once settled so 60fps scroll & hover stay snappy.
 */
export function StaggeredShowcaseGrid({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotionPreference();

  useEffect(() => {
    const gridEl = gridRef.current;
    if (!gridEl) return;

    const cards = Array.from(
      gridEl.querySelectorAll<HTMLElement>("[data-grid-index]")
    );
    if (!cards.length) return;

    if (reducedMotion || typeof IntersectionObserver === "undefined") {
      for (const c of cards) {
        c.setAttribute("data-card-visible", "true");
        c.setAttribute("data-card-settled", "true");
      }
      return;
    }

    let queueCursorMs = 0;
    let lastScheduledRow = -1;
    const timers: number[] = [];

    const CARD_STEP_MS = 115;
    const ROW_COMPLETE_PAUSE_MS = 210;

    const scheduleBatch = (batch: HTMLElement[], obs?: IntersectionObserver) => {
      if (!batch.length) return;
      batch.sort((a, b) => {
        const ia = Number(a.getAttribute("data-grid-index") || "0");
        const ib = Number(b.getAttribute("data-grid-index") || "0");
        return ia - ib;
      });

      const cols = getGridColumnCount();
      const now = performance.now();

      for (const cardEl of batch) {
        if (cardEl.getAttribute("data-card-visible") === "true") continue;
        const idx = Number(cardEl.getAttribute("data-grid-index") || "0");
        const row = Math.floor(idx / cols);

        if (queueCursorMs <= now) {
          queueCursorMs = now;
          lastScheduledRow = row;
        } else if (row > lastScheduledRow) {
          queueCursorMs += ROW_COMPLETE_PAUSE_MS;
          lastScheduledRow = row;
        }

        const delayMs = Math.max(0, Math.round(queueCursorMs - now));
        cardEl.style.setProperty("--stagger-delay", `${delayMs}ms`);
        cardEl.setAttribute("data-stagger-delay", String(delayMs));
        cardEl.setAttribute("data-card-visible", "true");

        queueCursorMs += CARD_STEP_MS;
        obs?.unobserve(cardEl);

        const settleTimer = window.setTimeout(() => {
          cardEl.style.removeProperty("--stagger-delay");
          cardEl.setAttribute("data-card-settled", "true");
        }, delayMs + 480);
        timers.push(settleTimer);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const newlyVisible: HTMLElement[] = [];
        for (const entry of entries) {
          if (entry.isIntersecting && entry.target instanceof HTMLElement) {
            newlyVisible.push(entry.target);
          }
        }
        if (newlyVisible.length > 0) {
          scheduleBatch(newlyVisible, observer);
        }
      },
      { threshold: 0.06, rootMargin: "0px 0px -20px 0px" }
    );

    for (const card of cards) {
      observer.observe(card);
    }

    return () => {
      observer.disconnect();
      for (const t of timers) {
        window.clearTimeout(t);
      }
    };
  }, [reducedMotion]);

  return (
    <div ref={gridRef} className={className}>
      {children}
    </div>
  );
}

/**
 * Tilt3DCard
 * Lightweight interactive card with optional staggered grid entrance (`staggerReveal`)
 * and hover/touch image pre-warming (`onPrewarm`).
 */
export function Tilt3DCard({
  children,
  onClick,
  onPrewarm,
  className = "",
  maxTilt = 3.2,
  index,
  staggerReveal = false,
  cursorZone = "view",
  style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  onPrewarm?: () => void;
  className?: string;
  maxTilt?: number;
  index?: number;
  staggerReveal?: boolean;
  cursorZone?: "view" | "magnetic";
  style?: React.CSSProperties;
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const rafRef = useRef<number | null>(null);
  const reducedMotion = useReducedMotionPreference();

  const handlePointerEnter = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      onPrewarm?.();
      if (reducedMotion || e.pointerType !== "mouse") return;
      if (
        typeof navigator !== "undefined" &&
        navigator.hardwareConcurrency &&
        navigator.hardwareConcurrency <= 4
      ) {
        return;
      }
      rectRef.current = e.currentTarget.getBoundingClientRect();
    },
    [onPrewarm, reducedMotion]
  );

  const handleTouchStart = useCallback(() => {
    onPrewarm?.();
  }, [onPrewarm]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (reducedMotion || e.pointerType !== "mouse") return;
      if (
        typeof navigator !== "undefined" &&
        navigator.hardwareConcurrency &&
        navigator.hardwareConcurrency <= 4
      ) {
        return;
      }
      const clientX = e.clientX;
      const clientY = e.clientY;

      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        const target = cardRef.current;
        const rect = rectRef.current;
        if (!target || !rect || !rect.width || !rect.height) return;

        const px = (clientX - rect.left) / rect.width;
        const py = (clientY - rect.top) / rect.height;
        const ry = ((px - 0.5) * 2 * maxTilt).toFixed(2);
        const rx = ((0.5 - py) * 2 * maxTilt).toFixed(2);

        target.style.setProperty("--rx", `${rx}deg`);
        target.style.setProperty("--ry", `${ry}deg`);
        target.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
        target.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
        target.style.setProperty("--glare-opacity", "1");
      });
    },
    [maxTilt, reducedMotion]
  );

  const handlePointerLeave = useCallback(() => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    rectRef.current = null;
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--glare-opacity", "0");
  }, []);

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onPointerEnter={handlePointerEnter}
      onTouchStart={handleTouchStart}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      data-grid-index={staggerReveal && typeof index === "number" ? index : undefined}
      data-card-visible={
        staggerReveal ? (reducedMotion ? "true" : "false") : undefined
      }
      data-card-settled={
        staggerReveal ? (reducedMotion ? "true" : "false") : undefined
      }
      data-cursor={onClick ? cursorZone : undefined}
      style={style}
      className={`apple-3d-tilt-card ${
        staggerReveal ? "apple-grid-card-entrance" : ""
      } relative h-full ${className}`}
    >
      {children}
      <div
        aria-hidden="true"
        className="apple-3d-glare pointer-events-none absolute inset-0 rounded-[inherit]"
      />
    </div>
  );
}
