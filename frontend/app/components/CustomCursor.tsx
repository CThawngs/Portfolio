"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";

type CursorZone = "default" | "prev" | "next" | "magnetic" | "view" | "overlay";

/**
 * Reference-Portfolio Dual-Layer Custom Cursor (Desktop Fine Pointer >= 768px Only)
 * - `.apple-cursor-dot`: 1:1 zero-latency hardware dot so exact pointer position is always visible.
 * - `.apple-cursor`: Smooth framerate-independent spring-trailing circle that morphs across
 *   buttons/links (`magnetic`), project/certificate cards & Stage artwork (`view`), and prev/next controls.
 * - Strictly disabled below `768px` and on touch/pen devices so mobile responsive viewports
 *   never display stray desktop cursor rings.
 */
export default function CustomCursor() {
  const ringRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaDesktop = window.matchMedia("(min-width: 768px)");
    const mediaFine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const mediaMotion = window.matchMedia(
      "(prefers-reduced-motion: no-preference)"
    );

    const updateCapability = () => {
      const ok =
        mediaDesktop.matches && mediaFine.matches && mediaMotion.matches;
      setEnabled(ok);
      if (!ok) {
        document.documentElement.classList.remove("custom-cursor-active");
      }
    };

    updateCapability();
    mediaDesktop.addEventListener("change", updateCapability);
    mediaFine.addEventListener("change", updateCapability);
    mediaMotion.addEventListener("change", updateCapability);

    return () => {
      document.documentElement.classList.remove("custom-cursor-active");
      mediaDesktop.removeEventListener("change", updateCapability);
      mediaFine.removeEventListener("change", updateCapability);
      mediaMotion.removeEventListener("change", updateCapability);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let targetX = -100;
    let targetY = -100;
    let ringX = -100;
    let ringY = -100;
    let initialized = false;
    let isVisible = false;
    let isPressing = false;
    let currentZone: CursorZone = "default";
    let rafId: number | null = null;
    let lastTime = 0;

    const syncAttributes = () => {
      const ring = ringRef.current;
      const dot = dotRef.current;
      if (!ring || !dot) return;
      const vis = isVisible ? "true" : "false";
      const press = isPressing ? "true" : "false";
      if (ring.getAttribute("data-visible") !== vis) {
        ring.setAttribute("data-visible", vis);
      }
      if (dot.getAttribute("data-visible") !== vis) {
        dot.setAttribute("data-visible", vis);
      }
      if (ring.getAttribute("data-pressing") !== press) {
        ring.setAttribute("data-pressing", press);
      }
      if (dot.getAttribute("data-pressing") !== press) {
        dot.setAttribute("data-pressing", press);
      }
      if (ring.getAttribute("data-zone") !== currentZone) {
        ring.setAttribute("data-zone", currentZone);
      }
      if (dot.getAttribute("data-zone") !== currentZone) {
        dot.setAttribute("data-zone", currentZone);
      }
    };

    const resolveZone = (target: EventTarget | null): CursorZone => {
      if (!(target instanceof Element)) return "default";
      if (target.closest(".carousel-overlay-surface")) {
        return "overlay";
      }
      const directControl = target.closest(
        "a, button, [role='tab'], input, select, textarea, [data-cursor='prev'], [data-cursor='next'], [data-cursor='magnetic']"
      );
      if (directControl) {
        if (
          directControl instanceof HTMLButtonElement &&
          directControl.disabled
        ) {
          return "default";
        }
        const attr = directControl.getAttribute("data-cursor");
        if (attr === "prev" || attr === "next" || attr === "view") {
          return attr;
        }
        return "magnetic";
      }

      const zoneEl = target.closest("[data-cursor]");
      if (zoneEl) {
        const attr = zoneEl.getAttribute("data-cursor");
        if (
          attr === "view" ||
          attr === "prev" ||
          attr === "next" ||
          attr === "overlay" ||
          attr === "magnetic"
        ) {
          return attr;
        }
      }

      if (target.closest("[role='button']")) {
        return "magnetic";
      }
      return "default";
    };

    const stepRing = (now: number) => {
      const ring = ringRef.current;
      if (!ring) {
        rafId = null;
        return;
      }

      const dt = lastTime ? Math.min(0.05, (now - lastTime) / 1000) : 1 / 60;
      lastTime = now;

      const alpha = 1 - Math.pow(0.00012, dt);
      ringX += (targetX - ringX) * alpha;
      ringY += (targetY - ringY) * alpha;

      const dx = targetX - ringX;
      const dy = targetY - ringY;
      const dist = Math.hypot(dx, dy);

      ring.style.transform = `translate3d(${ringX.toFixed(2)}px, ${ringY.toFixed(
        2
      )}px, 0) translate(-50%, -50%)`;

      if (dist > 0.12 && isVisible) {
        rafId = window.requestAnimationFrame(stepRing);
      } else {
        ringX = targetX;
        ringY = targetY;
        ring.style.transform = `translate3d(${ringX.toFixed(
          2
        )}px, ${ringY.toFixed(2)}px, 0) translate(-50%, -50%)`;
        rafId = null;
        lastTime = 0;
      }
    };

    const hideCursorAndRestoreNative = () => {
      isVisible = false;
      isPressing = false;
      document.documentElement.classList.remove("custom-cursor-active");
      syncAttributes();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (
        e.pointerType === "touch" ||
        e.pointerType === "pen" ||
        window.innerWidth < 768
      ) {
        hideCursorAndRestoreNative();
        return;
      }

      const ring = ringRef.current;
      const dot = dotRef.current;
      if (!ring || !dot) return;

      targetX = e.clientX;
      targetY = e.clientY;

      if (!initialized) {
        initialized = true;
        ringX = targetX;
        ringY = targetY;
        ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      }

      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;

      const nextZone = resolveZone(e.target);
      if (nextZone === "overlay") {
        document.documentElement.classList.remove("custom-cursor-active");
      } else if (
        !document.documentElement.classList.contains("custom-cursor-active")
      ) {
        document.documentElement.classList.add("custom-cursor-active");
      }

      isVisible = true;
      currentZone = nextZone;
      syncAttributes();

      if (rafId === null) {
        lastTime = 0;
        rafId = window.requestAnimationFrame(stepRing);
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") {
        isPressing = true;
        syncAttributes();
      }
    };

    const onPointerUp = () => {
      if (isPressing) {
        isPressing = false;
        syncAttributes();
      }
    };

    const onMouseLeaveWindow = (e: MouseEvent) => {
      if (!e.relatedTarget) {
        isVisible = false;
        syncAttributes();
      }
    };

    const onWindowBlur = () => {
      isVisible = false;
      isPressing = false;
      syncAttributes();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        hideCursorAndRestoreNative();
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    document.addEventListener("mouseout", onMouseLeaveWindow, {
      passive: true,
    });
    window.addEventListener("blur", onWindowBlur, { passive: true });
    window.addEventListener("keydown", onKeyDown, { passive: true });

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      document.documentElement.classList.remove("custom-cursor-active");
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("mouseout", onMouseLeaveWindow);
      window.removeEventListener("blur", onWindowBlur);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden="true"
        data-testid="custom-cursor-dot"
        data-visible="false"
        data-zone="default"
        data-pressing="false"
        className="apple-cursor-dot"
      />
      <div
        ref={ringRef}
        aria-hidden="true"
        data-testid="custom-cursor-ring"
        data-visible="false"
        data-zone="default"
        data-pressing="false"
        className="apple-cursor"
      >
        <ArrowUpRight className="cursor-icon cursor-icon-view h-4 w-4 stroke-[2.3]" />
        <ChevronLeft className="cursor-icon cursor-icon-prev h-4 w-4 stroke-[2.3]" />
        <ChevronRight className="cursor-icon cursor-icon-next h-4 w-4 stroke-[2.3]" />
      </div>
    </>
  );
}
