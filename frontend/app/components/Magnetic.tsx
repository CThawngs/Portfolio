"use client";

import React, { useRef, useCallback } from "react";

interface MagneticProps {
  children: React.ReactElement;
  maxOffset?: number;
  disabled?: boolean;
  className?: string;
}

export function useMagneticHandlers(maxOffset = 8, disabled = false) {
  const ref = useRef<HTMLElement | null>(null);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (disabled || e.pointerType !== "mouse") return;
      if (
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return;
      }
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const nx = Math.max(-1, Math.min(1, (e.clientX - cx) / (rect.width / 2)));
      const ny = Math.max(-1, Math.min(1, (e.clientY - cy) / (rect.height / 2)));
      el.style.setProperty("--px", `${(nx * maxOffset).toFixed(2)}px`);
      el.style.setProperty("--py", `${(ny * maxOffset).toFixed(2)}px`);
    },
    [maxOffset, disabled]
  );

  const onPointerLeave = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    el.style.setProperty("--px", "0px");
    el.style.setProperty("--py", "0px");
  }, []);

  return { ref, onPointerMove, onPointerLeave };
}

export default function Magnetic({
  children,
  maxOffset = 8,
  disabled = false,
  className = "",
}: MagneticProps) {
  const { onPointerMove, onPointerLeave } = useMagneticHandlers(maxOffset, disabled);

  return (
    <span
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={`magnetic-target inline-flex ${className}`}
    >
      {children}
    </span>
  );
}