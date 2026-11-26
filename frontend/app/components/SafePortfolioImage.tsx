"use client";

import React, { useState } from "react";
import Image, { type ImageProps } from "next/image";

/**
 * Allowed widths matching `next.config.ts`:
 * imageSizes: [64, 128, 256, 384, 480]
 * deviceSizes: [640, 750, 828, 1080, 1200, 1920]
 */
export type AllowedNextImageWidth =
  | 64
  | 128
  | 256
  | 384
  | 480
  | 640
  | 750
  | 828
  | 1080
  | 1200
  | 1920;

const OPTIMIZABLE_HOST_PATTERNS = [
  /(^|\.)amazonaws\.com$/i,
  /(^|\.)notion\.so$/i,
  /(^|\.)googleusercontent\.com$/i,
  /^images\.unsplash\.com$/i,
  /^i\.imgur\.com$/i,
  /(^|\.)githubusercontent\.com$/i,
];

/**
 * Returns true if `src` can be compressed & resized into lightweight WebP
 * via Next.js `/_next/image` (matching `remotePatterns` in `next.config.ts`).
 */
export function canOptimizeWithNextImage(src: string): boolean {
  if (!src) return false;
  if (
    src.startsWith("data:") ||
    src.startsWith("blob:") ||
    /(\.gif|\.svg)(\?|$)/i.test(src)
  ) {
    return false;
  }
  if (src.startsWith("/")) {
    return !src.startsWith("/_next/");
  }
  try {
    const parsed = new URL(src);
    if (parsed.protocol !== "https:") return false;
    if (/(\.gif|\.svg)$/i.test(parsed.pathname)) return false;
    return OPTIMIZABLE_HOST_PATTERNS.some((re) => re.test(parsed.hostname));
  } catch {
    return false;
  }
}

/**
 * Builds a deterministic `/_next/image` WebP URL (~25–75 KB instead of 2–5 MB raw PNG)
 * so Grid, Stage, Detail Modal, and idle preloader share identical browser cache keys.
 */
export function getOptimizedImageUrl(
  src: string,
  width: AllowedNextImageWidth = 640
): string {
  if (!canOptimizeWithNextImage(src)) return src;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;
}

export function getOptimizedImageSrcSet(
  src: string,
  widths: AllowedNextImageWidth[]
): string | undefined {
  if (!canOptimizeWithNextImage(src)) return undefined;
  return widths
    .map((w) => `${getOptimizedImageUrl(src, w)} ${w}w`)
    .join(", ");
}

export type ImageOrientation = "landscape" | "square" | "portrait";

export function classifyAspectRatio(
  width: number,
  height: number
): ImageOrientation {
  if (!width || !height) return "landscape";
  const ratio = width / height;
  if (ratio < 0.86) return "portrait";
  if (ratio <= 1.2) return "square";
  return "landscape";
}

interface SafePortfolioImageProps extends Omit<ImageProps, "src" | "onError"> {
  src: string;
  fallback?: React.ReactNode;
}

export default function SafePortfolioImage({
  src,
  alt,
  fallback = null,
  unoptimized,
  loading,
  priority,
  ...rest
}: SafePortfolioImageProps) {
  const [useRawFallback, setUseRawFallback] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return <>{fallback}</>;
  }

  const shouldUseDirect =
    Boolean(unoptimized) ||
    !canOptimizeWithNextImage(src) ||
    useRawFallback === src;

  return (
    <Image
      {...rest}
      src={src}
      alt={alt}
      priority={priority}
      loading={priority ? undefined : loading ?? "lazy"}
      decoding="async"
      unoptimized={shouldUseDirect}
      onError={() => {
        if (!shouldUseDirect) {
          setUseRawFallback(src);
        } else {
          setFailedSrc(src);
        }
      }}
    />
  );
}

interface AdaptiveGridCoverProps {
  src?: string;
  alt: string;
  isCertificate?: boolean;
  priority?: boolean;
  fallback: React.ReactNode;
}

/**
 * AdaptiveGridCover (Lightweight Single-Image WebP Cover)
 * - Serves ~28–55 KB WebP via `/_next/image` (`384w / 640w / 828w`) with automatic
 *   raw-URL fallback if the optimizer ever errors.
 * - Zero duplicate blurred `<img>` nodes (eliminating per-card CSS blur GPU lag).
 * - Async off-main-thread bitmap decoding (`decoding="async"`) + priority loading
 *   only for above-the-fold cards.
 */
export function AdaptiveGridCover({
  src = "",
  alt,
  isCertificate = false,
  priority = false,
  fallback,
}: AdaptiveGridCoverProps) {
  const [rawFallbackFor, setRawFallbackFor] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [measuredRatio, setMeasuredRatio] = useState<{
    src: string;
    ratio: number;
  } | null>(null);

  if (!src || failedSrc === src) {
    return <>{fallback}</>;
  }

  const ratio =
    measuredRatio && measuredRatio.src === src ? measuredRatio.ratio : null;

  const useContainMatte =
    isCertificate || (ratio !== null && (ratio < 1.22 || ratio > 2.25));

  const usingRaw = rawFallbackFor === src || !canOptimizeWithNextImage(src);
  const resolvedSrc = usingRaw ? src : getOptimizedImageUrl(src, 640);
  const resolvedSrcSet = usingRaw
    ? undefined
    : getOptimizedImageSrcSet(src, [384, 640, 828]);
  const isLoaded = loadedSrc === src;

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${
        useContainMatte ? "apple-contain-matte" : "bg-[var(--surface-elevated)]"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={(node) => {
          if (node && node.complete && node.naturalWidth > 0 && loadedSrc !== src) {
            setLoadedSrc(src);
            if (!measuredRatio || measuredRatio.src !== src) {
              setMeasuredRatio({
                src,
                ratio: node.naturalWidth / node.naturalHeight,
              });
            }
          }
        }}
        src={resolvedSrc}
        srcSet={resolvedSrcSet}
        sizes="(max-width: 639px) 92vw, (max-width: 1023px) 46vw, 384px"
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        onLoad={(e) => {
          const img = e.currentTarget;
          setLoadedSrc(src);
          if (img.naturalWidth && img.naturalHeight) {
            setMeasuredRatio({
              src,
              ratio: img.naturalWidth / img.naturalHeight,
            });
          }
        }}
        onError={() => {
          if (!usingRaw) {
            setRawFallbackFor(src);
          } else {
            setFailedSrc(src);
          }
        }}
        className={`relative z-10 h-full w-full transition-[opacity,transform] duration-300 group-hover:scale-[1.025] ${
          isLoaded ? "opacity-100" : "opacity-0"
        } ${
          useContainMatte ? "object-contain p-2" : "object-cover object-top"
        }`}
      />
    </div>
  );
}

interface IntrinsicPortfolioImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  onClick?: () => void;
  onDimensionsDetected?: (width: number, height: number) => void;
}

/**
 * IntrinsicPortfolioImage (Frameless natural-aspect WebP artwork for Stage showcase)
 */
export function IntrinsicPortfolioImage({
  src,
  alt,
  className = "",
  fallback = null,
  onClick,
  onDimensionsDetected,
}: IntrinsicPortfolioImageProps) {
  const [rawFallbackFor, setRawFallbackFor] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return <>{fallback}</>;
  }

  const usingRaw = rawFallbackFor === src || !canOptimizeWithNextImage(src);
  const resolvedSrc = usingRaw ? src : getOptimizedImageUrl(src, 1080);
  const resolvedSrcSet = usingRaw
    ? undefined
    : getOptimizedImageSrcSet(src, [640, 828, 1080]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolvedSrc}
      srcSet={resolvedSrcSet}
      sizes="(max-width: 639px) 94vw, (max-width: 1023px) 82vw, 750px"
      alt={alt}
      loading="eager"
      decoding="async"
      fetchPriority="high"
      data-cursor={onClick ? "view" : undefined}
      onClick={onClick}
      onLoad={(e) => {
        if (onDimensionsDetected) {
          const img = e.currentTarget;
          if (img.naturalWidth && img.naturalHeight) {
            onDimensionsDetected(img.naturalWidth, img.naturalHeight);
          }
        }
      }}
      onError={() => {
        if (!usingRaw) {
          setRawFallbackFor(src);
        } else {
          setFailedSrc(src);
        }
      }}
      className={className}
    />
  );
}
