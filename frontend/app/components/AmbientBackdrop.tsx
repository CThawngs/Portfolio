"use client";

import React, { useEffect, useRef } from "react";

/**
 * Ultra-Lightweight Architectural Studio Backdrop
 * - Keeps the luxury Smoked-Obsidian (#060608) + Warm-Pearl & Champagne-Gold softbox atmosphere
 * - Zero SVG feTurbulence filters, zero mix-blend-mode, zero blur() filters, and zero scroll-linked
 *   backdrop transforms so integrated GPUs & low-end machines scroll at locked 60/120fps.
 */
export default function AmbientBackdrop() {
  const progressRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let rafId: number | null = null;

    const updateProgress = () => {
      rafId = null;
      const bar = progressRef.current;
      if (!bar) return;

      const scrollY = window.scrollY || window.pageYOffset || 0;
      const docHeight = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const progress = Math.max(0, Math.min(1, scrollY / docHeight));
      bar.style.transform = `scaleX(${progress.toFixed(4)})`;
    };

    const onScroll = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(updateProgress);
      }
    };

    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <>
      {/* Isolated 1.5px Scroll Progress Hairline (Zero repaint on background layers) */}
      <div
        ref={progressRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 right-0 z-50 h-[1.5px] origin-left"
        style={{
          transform: "scaleX(0)",
          background: "var(--scroll-beam)",
        }}
      />

      {/* Static GPU-Composited Studio Backdrop (Painted Once, Zero Repaints on Scroll) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
        style={{ contain: "strict" }}
      >
        {/* Base Velvet Obsidian & Multi-Point Studio Wash */}
        <div className="absolute inset-0 apple-studio-canvas" />

        {/* Overhead Architectural Conic Softbox Wash (Zero CSS Blur Filter) */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-[130vw] max-w-[1720px] h-[500px] apple-studio-rays" />

        {/* Precision Architectural Micro-Dot Matrix Masked Inside Spotlight Cone */}
        <div className="absolute inset-0 apple-studio-dots" />

        {/* Top Horizon Specular Rim Line */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(92vw,1120px)] h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, var(--studio-horizon-line) 50%, transparent 100%)",
          }}
        />
      </div>
    </>
  );
}
