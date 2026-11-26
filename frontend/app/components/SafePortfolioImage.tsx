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

interface IntrinsicPortfolioImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  onClick?: () => void;
}

/**
 * IntrinsicPortfolioImage (Frameless natural-aspect artwork for Stage & Detail Modal)
 * Renders a standalone `<img>` at its natural aspect ratio so `border-radius`
 * rounds the actual 4 corners of the artwork itself with zero outer card frame.
 */
export function IntrinsicPortfolioImage({
  src,
  alt,
  className = "",
  fallback = null,
  onClick,
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
      onError={() => setFailedSrc(src)}
      className={className}
    />
  );
}
