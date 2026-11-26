"use client";

import React, { useRef, useCallback } from "react";

interface MagneticProps {
  children: React.ReactElement;
  maxOffset?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * Zero-Reflow Magnetic Pointer Handlers
 * Caches bounding rect once on `pointerenter` and throttles updates via `requestAnimationFrame`
 * so `pointermove` never triggers synchronous `getBoundingClientRect()` layout recalculations.
 */
export function useMagneticHandlers(maxOffset = 8, disabled = false) {
  const ref = useRef<HTMLElement | null>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const rafRef = useRef<number | null>(null);

  const onPointerEnter = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (disabled || e.pointerType !== "mouse") return;
      rectRef.current = e.currentTarget.getBoundingClientRect();
    },
    [disabled]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (disabled || e.pointerType !== "mouse") return;
      const el = e.currentTarget;
      const clientX = e.clientX;
      const clientY = e.clientY;

      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        const rect = rectRef.current || el.getBoundingClientRect();
        rectRef.current = rect;
        if (!rect.width || !rect.height) return;

        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const nx = Math.max(-1, Math.min(1, (clientX - cx) / (rect.width / 2)));
        const ny = Math.max(
          -1,
          Math.min(1, (clientY - cy) / (rect.height / 2))
        );
        el.style.setProperty("--px", `${(nx * maxOffset).toFixed(2)}px`);
        el.style.setProperty("--py", `${(ny * maxOffset).toFixed(2)}px`);
      });
    },
    [maxOffset, disabled]
  );

  const onPointerLeave = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    rectRef.current = null;
    const el = e.currentTarget;
    el.style.setProperty("--px", "0px");
    el.style.setProperty("--py", "0px");
  }, []);

  return { ref, onPointerEnter, onPointerMove, onPointerLeave };
}

export default function Magnetic({
  children,
  maxOffset = 8,
  disabled = false,
  className = "",
}: MagneticProps) {
  const { onPointerEnter, onPointerMove, onPointerLeave } = useMagneticHandlers(
    maxOffset,
    disabled
  );

  return (
    <span
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={`magnetic-target inline-flex ${className}`}
    >
      {children}
    </span>
  );
}
