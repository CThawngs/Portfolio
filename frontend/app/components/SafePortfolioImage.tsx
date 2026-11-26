"use client";

import React, { useState } from "react";
import Image, { type ImageProps } from "next/image";

const ALLOWED_EXACT_HOSTS = new Set([
  "file.notion.so",
  "www.notion.so",
  "notion.so",
  "images.unsplash.com",
  "i.imgur.com",
]);

const ALLOWED_SUFFIX_HOSTS = [
  ".amazonaws.com",
  ".googleusercontent.com",
  ".githubusercontent.com",
];

export function shouldBypassNextImageOptimizer(src: string): boolean {
  if (!src) return true;
  if (
    src.startsWith("data:") ||
    src.startsWith("blob:") ||
    /(\.gif|\.svg)(\?|$)/i.test(src)
  ) {
    return true;
  }

  if (src.startsWith("http://") || src.startsWith("https://")) {
    try {
      const { protocol, hostname } = new URL(src);
      if (protocol !== "https:") return true;
      const lower = hostname.toLowerCase();
      if (ALLOWED_EXACT_HOSTS.has(lower)) return false;
      if (ALLOWED_SUFFIX_HOSTS.some((suffix) => lower.endsWith(suffix))) {
        return false;
      }
      return true;
    } catch {
      return true;
    }
  }

  return false;
}

interface SafePortfolioImageProps extends Omit<ImageProps, "src" | "onError"> {
  src: string;
  fallback?: React.ReactNode;
}

/**
 * SafePortfolioImage
 * Wraps `next/image` so unconfigured external hostnames never throw runtime errors,
 * retries direct loading if `/_next/image` fails, and falls back to studio artwork
 * placeholder instead of a broken image icon if a Notion S3 URL expires.
 */
export default function SafePortfolioImage({
  src,
  alt,
  fallback = null,
  unoptimized,
  ...rest
}: SafePortfolioImageProps) {
  const [errState, setErrState] = useState<{
    retryDirectSrc: string | null;
    failedSrc: string | null;
  }>({
    retryDirectSrc: null,
    failedSrc: null,
  });

  if (!src || errState.failedSrc === src) {
    return <>{fallback}</>;
  }

  const useDirect =
    Boolean(unoptimized) ||
    shouldBypassNextImageOptimizer(src) ||
    errState.retryDirectSrc === src;

  return (
    <Image
      {...rest}
      src={src}
      alt={alt}
      unoptimized={useDirect}
      onError={() => {
        if (!useDirect) {
          setErrState((prev) => ({ ...prev, retryDirectSrc: src }));
        } else {
          setErrState((prev) => ({ ...prev, failedSrc: src }));
        }
      }}
    />
  );
}
