"use client";

import React, { useRef, useCallback, useSyncExternalStore } from "react";

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
 * Zero-overhead native semantic section container (no scroll-linked JS observers or 3D
 * projection matrices during scroll so low-end laptops scroll with zero jank).
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
  return (
    <section id={id} className={className}>
      {children}
    </section>
  );
}

/**
 * Tilt3DCard
 * Lightweight interactive card:
 * - Zero scroll observers, zero Framer Motion wrapper overhead, zero idle `will-change` VRAM cost.
 * - Caches card bounding box once on `pointerenter` so mouse movement never triggers layout reflow.
 * - Automatically skips 3D specular calculation on low-core devices (`hardwareConcurrency <= 4`).
 */
export function Tilt3DCard({
  children,
  onClick,
  className = "",
  maxTilt = 3.2,
  cursorZone = "view",
  style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  maxTilt?: number;
  index?: number;
  cursorZone?: "view" | "magnetic";
  style?: React.CSSProperties;
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const rafRef = useRef<number | null>(null);
  const reducedMotion = useReducedMotionPreference();

  const handlePointerEnter = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
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
    [reducedMotion]
  );

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
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      data-cursor={onClick ? cursorZone : undefined}
      style={style}
      className={`apple-3d-tilt-card relative h-full ${className}`}
    >
      {children}
      <div
        aria-hidden="true"
        className="apple-3d-glare pointer-events-none absolute inset-0 rounded-[inherit]"
      />
    </div>
  );
}
