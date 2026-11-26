"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type CursorZone = "default" | "prev" | "next" | "magnetic" | "overlay";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pressing, setPressing] = useState(false);
  const [zone, setZone] = useState<CursorZone>("default");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaFine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const mediaMotion = window.matchMedia("(prefers-reduced-motion: no-preference)");

    const updateCapability = () => {
      const ok = mediaFine.matches && mediaMotion.matches;
      setEnabled(ok);
      document.documentElement.classList.toggle("custom-cursor-active", ok);
      if (!ok) {
        setVisible(false);
      }
    };

    updateCapability();
    mediaFine.addEventListener("change", updateCapability);
    mediaMotion.addEventListener("change", updateCapability);

    return () => {
      document.documentElement.classList.remove("custom-cursor-active");
      mediaFine.removeEventListener("change", updateCapability);
      mediaMotion.removeEventListener("change", updateCapability);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const resolveZone = (target: EventTarget | null): CursorZone => {
      if (!(target instanceof Element)) return "default";
      // Inside frosted summary card, fade out big glass ring and yield to crisp native OS cursor
      if (target.closest(".carousel-overlay-surface")) {
        return "overlay";
      }
      const zoneEl = target.closest("[data-cursor]");
      if (zoneEl) {
        const attr = zoneEl.getAttribute("data-cursor");
        if (attr === "prev" || attr === "next" || attr === "overlay" || attr === "magnetic") {
          return attr;
        }
        if (attr === "disabled") return "default";
      }
      if (target.closest("a, button, [role='button'], [role='tab'], input, select, textarea")) {
        return "magnetic";
      }
      return "default";
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch" || e.pointerType === "pen") {
        document.documentElement.classList.remove("custom-cursor-active");
        setVisible(false);
        return;
      }

      if (!document.documentElement.classList.contains("custom-cursor-active")) {
        document.documentElement.classList.add("custom-cursor-active");
      }

      const el = cursorRef.current;
      if (el) {
        el.style.setProperty("--cx", `${e.clientX}px`);
        el.style.setProperty("--cy", `${e.clientY}px`);
      }

      setVisible(true);
      setZone(resolveZone(e.target));
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") {
        setPressing(true);
      }
    };

    const onPointerUp = () => {
      setPressing(false);
    };

    const onMouseLeaveWindow = (e: MouseEvent) => {
      if (!e.relatedTarget) {
        setVisible(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        // Yield to native pointer/focus ring during keyboard navigation until mouse moves again
        document.documentElement.classList.remove("custom-cursor-active");
        setVisible(false);
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    document.addEventListener("mouseout", onMouseLeaveWindow, { passive: true });
    window.addEventListener("keydown", onKeyDown, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("mouseout", onMouseLeaveWindow);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [enabled]);

  if (!enabled) return null;

  const stateClasses = [
    "apple-cursor",
    pressing ? "is-pressing" : "",
    zone === "magnetic" ? "is-magnetic-target" : "",
    zone === "overlay" ? "is-overlay-hover" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      className={stateClasses}
      style={{ opacity: visible ? undefined : 0 }}
    >
      {zone === "prev" && <ChevronLeft className="h-4 w-4 stroke-[2.2] opacity-80" />}
      {zone === "next" && <ChevronRight className="h-4 w-4 stroke-[2.2] opacity-80" />}
    </div>
  );
}
