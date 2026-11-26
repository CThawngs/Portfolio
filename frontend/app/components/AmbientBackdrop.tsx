"use client";

import React, { useEffect, useRef } from "react";

/**
 * Editorial Matte Backdrop
 * Replaces AI-style glowing neon orbs/grids with a calm, human-crafted achromatic
 * canvas (inspired by Rauno Freiberg, Paco Coursey & Vercel Geist) plus an
 * understated 1.5px monochrome scroll progress hairline.
 */
export default function AmbientBackdrop() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

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
      {/* Subtle Monochrome Top Scroll Hairline */}
      <div
        className="fixed top-0 left-0 right-0 z-50 h-[1.5px] origin-left will-change-transform"
        style={{
          transform: "scaleX(var(--scroll-progress, 0))",
          backgroundColor: "var(--scroll-beam)",
        }}
      />

      {/* Calm Matte Editorial Canvas */}
      <div className="absolute inset-0 apple-studio-canvas" />
    </div>
  );
}
