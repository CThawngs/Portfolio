"use client";

import React, { useState } from "react";
import Image, { type ImageProps } from "next/image";

/**
 * Bypass `/_next/image` server-side re-encoding for external URLs (especially
 * Notion S3 signed URLs whose query signatures rotate hourly and cause slow
 * cold-proxy fetches on pagination/Stage switches), loading directly from CDN edge
 * so client-side preloaded bitmaps hit browser memory cache in 0ms.
 */
export function shouldBypassNextImageOptimizer(src: string): boolean {
  if (!src) return true;
  if (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("data:") ||
    src.startsWith("blob:") ||
    /(\.gif|\.svg)(\?|$)/i.test(src)
  ) {
    return true;
  }
  return false;
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

/**
 * SafePortfolioImage (Fill / Grid cover mode)
 * Loads pre-warmed CDN URLs directly with eager decoding and graceful fallback.
 */
export default function SafePortfolioImage({
  src,
  alt,
  fallback = null,
  unoptimized,
  loading,
  priority,
  ...rest
}: SafePortfolioImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return <>{fallback}</>;
  }

  const useDirect =
    Boolean(unoptimized) || shouldBypassNextImageOptimizer(src);

  return (
    <Image
      {...rest}
      src={src}
      alt={alt}
      priority={priority}
      loading={priority ? undefined : loading ?? "eager"}
      decoding="async"
      unoptimized={useDirect}
      onError={() => {
        setFailedSrc(src);
      }}
    />
  );
}

interface AdaptiveGridCoverProps {
  src?: string;
  alt: string;
  isCertificate?: boolean;
  fallback: React.ReactNode;
}

/**
 * AdaptiveGridCover
 * Flexibly displays Portrait, Square, Landscape, and No-Image items inside Grid cards:
 * - Standard landscape project screenshots fill edge-to-edge cleanly.
 * - Portrait, square, ultra-wide, and certificate images render 100% uncropped (`object-contain`)
 *   over a soft full-bleed ambient echo of the artwork itself so nothing is ever cut off.
 * - Missing or broken images render the bespoke editorial fallback poster.
 */
export function AdaptiveGridCover({
  src = "",
  alt,
  isCertificate = false,
  fallback,
}: AdaptiveGridCoverProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [measuredRatio, setMeasuredRatio] = useState<{
    src: string;
    ratio: number;
  } | null>(null);

  if (!src || failedSrc === src) {
    return <>{fallback}</>;
  }

  const ratio =
    measuredRatio && measuredRatio.src === src ? measuredRatio.ratio : null;

  // Use uncropped full-image presentation with full-bleed ambient echo for certificates,
  // portrait screenshots, square artwork, or ultra-wide banners.
  const useContainWithEcho =
    isCertificate ||
    (ratio !== null && (ratio < 1.22 || ratio > 2.25));

  return (
    <div className="relative h-full w-full overflow-hidden bg-[var(--surface-elevated)]">
      {useContainWithEcho && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          className="pointer-events-none select-none absolute inset-0 h-full w-full object-cover scale-125 blur-xl opacity-45 dark:opacity-40 saturate-125"
        />
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="eager"
        decoding="sync"
        onLoad={(e) => {
          const img = e.currentTarget;
          if (img.naturalWidth && img.naturalHeight) {
            setMeasuredRatio({
              src,
              ratio: img.naturalWidth / img.naturalHeight,
            });
          }
        }}
        onError={() => setFailedSrc(src)}
        className={`relative z-10 h-full w-full transition-transform duration-500 group-hover:scale-[1.03] ${
          useContainWithEcho
            ? "object-contain p-2"
            : "object-cover object-top"
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
 * IntrinsicPortfolioImage (Frameless natural-aspect artwork for Stage showcase)
 * Renders a standalone `<img>` at its natural aspect ratio so `border-radius`
 * rounds the actual 4 corners of the artwork itself with zero outer card frame.
 */
export function IntrinsicPortfolioImage({
  src,
  alt,
  className = "",
  fallback = null,
  onClick,
  onDimensionsDetected,
}: IntrinsicPortfolioImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return <>{fallback}</>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="eager"
      decoding="sync"
      fetchPriority="high"
      onClick={onClick}
      onLoad={(e) => {
        if (onDimensionsDetected) {
          const img = e.currentTarget;
          if (img.naturalWidth && img.naturalHeight) {
            onDimensionsDetected(img.naturalWidth, img.naturalHeight);
          }
        }
      }}
      onError={() => setFailedSrc(src)}
      className={className}
    />
  );
}
