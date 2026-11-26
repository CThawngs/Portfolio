"use client";

import React, { useEffect, useRef } from "react";

/**
 * Apple Studio Ambient Backdrop
 * Pure GPU-composited multi-stop radial light washes + subtle architectural grid + top scroll progress beam.
 * Avoids runtime CSS `filter: blur(...)` on moving layers so integrated GPUs and older mobile devices
 * (iPhone 7, iPhone X, iPhone mini, low-spec laptops) maintain a locked 60fps during scroll.
 */
export default function AmbientBackdrop() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let rafId: number | null = null;

    const updateScrollVars = () => {
      rafId = null;
      const el = rootRef.current;
      if (!el) return;

      const scrollY = window.scrollY || window.pageYOffset || 0;
      const docHeight = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const progress = Math.max(0, Math.min(1, scrollY / docHeight));

      el.style.setProperty("--scroll-progress", progress.toFixed(4));

      if (!reducedMotion) {
        const shiftA = (progress * -110).toFixed(1);
        const shiftB = (progress * 95).toFixed(1);
        const shiftC = Math.sin(progress * Math.PI) * 55;
        el.style.setProperty("--orb-a-y", `${shiftA}px`);
        el.style.setProperty("--orb-b-y", `${shiftB}px`);
        el.style.setProperty("--orb-c-x", `${shiftC.toFixed(1)}px`);
      }
    };

    const onScroll = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(updateScrollVars);
      }
    };

    updateScrollVars();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* Top 2px Apple Luminous Scroll Progress Hairline */}
      <div
        className="fixed top-0 left-0 right-0 z-50 h-[2px] origin-left will-change-transform"
        style={{
          transform: "scaleX(var(--scroll-progress, 0))",
          background:
            "linear-gradient(90deg, var(--accent-glow-a), var(--accent-glow-b), var(--accent-glow-c))",
        }}
      />

      {/* Base Studio Surface Gradient */}
      <div className="absolute inset-0 apple-studio-canvas" />

      {/* GPU-Composited Ambient Light Orbs (Pre-feathered radial gradients — zero runtime CSS blur lag) */}
      <div
        className="absolute -top-[18%] -left-[12%] h-[72vw] w-[72vw] max-h-[820px] max-w-[820px] rounded-full will-change-transform"
        style={{
          transform: "translate3d(var(--orb-c-x, 0px), var(--orb-a-y, 0px), 0)",
          background:
            "radial-gradient(circle at 50% 50%, var(--ambient-orb-1) 0%, transparent 68%)",
        }}
      />

      <div
        className="absolute top-[16%] -right-[16%] h-[68vw] w-[68vw] max-h-[780px] max-w-[780px] rounded-full will-change-transform"
        style={{
          transform: "translate3d(calc(var(--orb-c-x, 0px) * -0.6), var(--orb-b-y, 0px), 0)",
          background:
            "radial-gradient(circle at 50% 50%, var(--ambient-orb-2) 0%, transparent 68%)",
        }}
      />

      <div
        className="absolute -bottom-[22%] left-[18%] h-[70vw] w-[70vw] max-h-[860px] max-w-[860px] rounded-full will-change-transform"
        style={{
          transform: "translate3d(0, calc(var(--orb-a-y, 0px) * -0.55), 0)",
          background:
            "radial-gradient(circle at 50% 50%, var(--ambient-orb-3) 0%, transparent 70%)",
        }}
      />

      {/* Subtle Apple Architectural Dot/Line Perspective Mesh (Masked cleanly toward edges) */}
      <div className="absolute inset-0 apple-architectural-grid opacity-70 dark:opacity-55" />

      {/* Soft Studio Edge Vignette for Elevated Card Contrast */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 75% at 50% 45%, transparent 52%, var(--vignette-edge) 100%)",
        }}
      />
    </div>
  );
}
