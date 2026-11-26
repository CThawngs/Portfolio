"use client";

import React, { useEffect, useRef } from "react";

/**
 * Tactile Analog Film Grain (Data URI SVG feTurbulence)
 * Eliminates digital banding and gives smoked-titanium physicality without network requests.
 */
const ANALOG_GRAIN_SVG =
  "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

/**
 * Architectural Studio Backdrop
 * Crafted after Raycast Pro, Resend & Apple Titanium Pro:
 * - Overhead warm-pearl & champagne-gold softbox illumination over deep velvet onyx (#060608)
 * - Masked precision micro-dot field that catches light inside the spotlight cone
 * - Subtle scroll-coupled depth parallax + tactile analog film grain
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
      el.style.setProperty(
        "--beam-shift-y",
        `${Math.min(48, scrollY * 0.04).toFixed(1)}px`
      );
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
      {/* Warm-Champagne & Pearl Scroll Progress Hairline */}
      <div
        className="fixed top-0 left-0 right-0 z-50 h-[1.5px] origin-left will-change-transform"
        style={{
          transform: "scaleX(var(--scroll-progress, 0))",
          background: "var(--scroll-beam)",
        }}
      />

      {/* Base Velvet Obsidian & Multi-Point Studio Wash */}
      <div className="absolute inset-0 apple-studio-canvas" />

      {/* Overhead Architectural Conic Softbox Caustics */}
      <div
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-[140vw] max-w-[1800px] h-[540px] apple-studio-rays will-change-transform"
        style={{
          transform:
            "translate3d(0, calc(var(--beam-shift-y, 0px) * -0.5), 0)",
        }}
      />

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

      {/* Subtle Tactile Analog Film Grain */}
      <div
        className="absolute inset-0 opacity-[0.022] dark:opacity-[0.032] mix-blend-overlay"
        style={{
          backgroundImage: `url("${ANALOG_GRAIN_SVG}")`,
          backgroundSize: "180px 180px",
        }}
      />
    </div>
  );
}
