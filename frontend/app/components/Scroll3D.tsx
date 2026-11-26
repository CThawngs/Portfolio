"use client";

import React, { useRef, useCallback, useSyncExternalStore } from "react";
import { motion } from "framer-motion";

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
 * Apple-style scroll-triggered 3D spatial reveal using IntersectionObserver + GPU transform only.
 * Uses `once: true` + `amount: "some"` so tall multi-card mobile sections (~3,000px+) trigger
 * immediately upon entering view and never vanish while scrolling through cards or pagination.
 */
export function Scroll3DSection({
  id,
  className = "",
  children,
  delay = 0,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  const reducedMotion = useReducedMotionPreference();

  return (
    <section id={id} className={`apple-perspective-stage ${className}`}>
      <motion.div
        initial={
          reducedMotion
            ? false
            : { opacity: 0, y: 24, scale: 0.984, rotateX: 3.5 }
        }
        whileInView={
          reducedMotion
            ? undefined
            : { opacity: 1, y: 0, scale: 1, rotateX: 0 }
        }
        viewport={{ once: true, amount: "some", margin: "0px 0px -20px 0px" }}
        transition={{
          duration: 0.58,
          delay,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{ transformOrigin: "50% 12%" }}
        className="will-change-transform"
      >
        {children}
      </motion.div>
    </section>
  );
}

/**
 * Tilt3DCard
 * Interactive 3D perspective card with subtle Apple VisionOS specular sheen on desktop fine pointers,
 * plus scroll-triggered 3D entrance and responsive press feedback on mobile/touch devices.
 */
export function Tilt3DCard({
  children,
  onClick,
  className = "",
  maxTilt = 4.2,
  index = 0,
  style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  maxTilt?: number;
  index?: number;
  style?: React.CSSProperties;
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const reducedMotion = useReducedMotionPreference();

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (reducedMotion || e.pointerType !== "mouse") return;
      const el = cardRef.current;
      if (!el) return;

      const clientX = e.clientX;
      const clientY = e.clientY;

      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        const target = cardRef.current;
        if (!target) return;
        const rect = target.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

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
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--glare-opacity", "0");
  }, []);

  const staggerDelay = Math.min(index % 6, 5) * 0.04;

  return (
    <motion.div
      initial={
        reducedMotion
          ? false
          : { opacity: 0, y: 20, scale: 0.972, rotateX: 4 }
      }
      whileInView={
        reducedMotion
          ? undefined
          : { opacity: 1, y: 0, scale: 1, rotateX: 0 }
      }
      viewport={{ once: true, amount: "some", margin: "0px 0px -16px 0px" }}
      transition={{
        duration: 0.48,
        delay: staggerDelay,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{ transformPerspective: 1100 }}
      className="h-full"
    >
      <div
        ref={cardRef}
        onClick={onClick}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        data-cursor={onClick ? "magnetic" : undefined}
        style={style}
        className={`apple-3d-tilt-card relative h-full ${className}`}
      >
        {children}
        {/* Dynamic Specular Sheen Overlay (Mouse hover only, 0 cost at rest) */}
        <div
          aria-hidden="true"
          className="apple-3d-glare pointer-events-none absolute inset-0 rounded-[inherit]"
        />
      </div>
    </motion.div>
  );
}
