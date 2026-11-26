"use client";

import React, { useRef, useCallback, useSyncExternalStore } from "react";
import { motion } from "framer-motion";

function subscribeReducedMotion(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getReducedMotionSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Scroll3DSection
 * Apple-style scroll-triggered 3D spatial reveal using IntersectionObserver + GPU transform only.
 * Works smoothly across desktop and small mobile screens (iPhone 7 / iPhone X / iPhone mini)
 * with zero per-frame JS scroll layout thrashing.
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
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    () => false
  );

  if (reducedMotion) {
    return (
      <section id={id} className={className}>
        {children}
      </section>
    );
  }

  return (
    <section id={id} className={`apple-perspective-stage ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 26, scale: 0.978, rotateX: 4.5 }}
        whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
        viewport={{ once: false, amount: 0.08, margin: "0px 0px -36px 0px" }}
        transition={{
          duration: 0.62,
          delay,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{ transformOrigin: "50% 18%" }}
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

  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    () => false
  );

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

  const staggerDelay = Math.min(index % 6, 5) * 0.045;

  return (
    <motion.div
      initial={
        reducedMotion
          ? false
          : { opacity: 0, y: 22, scale: 0.968, rotateX: 5 }
      }
      whileInView={
        reducedMotion
          ? undefined
          : { opacity: 1, y: 0, scale: 1, rotateX: 0 }
      }
      viewport={{ once: false, amount: 0.1, margin: "0px 0px -24px 0px" }}
      transition={{
        duration: 0.52,
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
