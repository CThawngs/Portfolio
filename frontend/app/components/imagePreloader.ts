"use client";

import {
  getOptimizedImageUrl,
  recordLoadedBitmap,
  type AllowedNextImageWidth,
} from "./SafePortfolioImage";

/**
 * Lightweight Polite Image Prefetcher & Decoder
 * - Warms compressed WebP thumbnails (~30–75 KB via `/_next/image`) ONLY for adjacent
 *   pagination / Stage items and hovered cards instead of downloading 60+ raw PNGs.
 * - Pre-decodes bitmaps off the main thread (`img.decode()`) and registers exact `currentSrc`
 *   in `loadedBitmapCache` so opening `ProjectDetailModal` displays the image in 0ms.
 */

const warmedUrls = new Set<string>();
const inflightMap = new Map<string, Promise<void>>();
const idleQueue: string[] = [];
let activeWorkers = 0;
const MAX_CONCURRENT_IDLE = 2;

function shouldSkipPrefetch(): boolean {
  if (typeof navigator === "undefined") return false;
  const conn = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  if (!conn) return false;
  if (conn.saveData) return true;
  if (conn.effectiveType === "slow-2g" || conn.effectiveType === "2g") {
    return true;
  }
  return false;
}

function scheduleIdle(cb: () => void): void {
  if (typeof window === "undefined") return;
  const win = window as Window & {
    requestIdleCallback?: (
      fn: () => void,
      opts?: { timeout: number }
    ) => number;
  };
  if (typeof win.requestIdleCallback === "function") {
    win.requestIdleCallback(cb, { timeout: 1200 });
  } else {
    window.setTimeout(cb, 320);
  }
}

function warmSingle(
  rawUrl: string,
  width: AllowedNextImageWidth,
  highPriority: boolean
): Promise<void> {
  if (!rawUrl || typeof window === "undefined" || rawUrl.startsWith("data:")) {
    return Promise.resolve();
  }
  const targetUrl = getOptimizedImageUrl(rawUrl, width);
  if (warmedUrls.has(targetUrl)) return Promise.resolve();

  const existing = inflightMap.get(targetUrl);
  if (existing) return existing;

  const promise = new Promise<void>((resolve) => {
    const img = new window.Image();
    img.decoding = "async";
    if ("fetchPriority" in img) {
      (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority =
        highPriority ? "high" : "low";
    }
    const finish = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        recordLoadedBitmap(
          rawUrl,
          img.currentSrc || img.src || targetUrl,
          img.naturalWidth,
          img.naturalHeight
        );
      }
      warmedUrls.add(targetUrl);
      inflightMap.delete(targetUrl);
      resolve();
    };
    img.onload = () => {
      if (typeof img.decode === "function") {
        img.decode().then(finish, finish);
      } else {
        finish();
      }
    };
    img.onerror = () => {
      inflightMap.delete(targetUrl);
      resolve();
    };
    img.src = targetUrl;
  });

  inflightMap.set(targetUrl, promise);
  return promise;
}

function pumpIdleQueue(width: AllowedNextImageWidth): void {
  while (activeWorkers < MAX_CONCURRENT_IDLE && idleQueue.length > 0) {
    const nextRaw = idleQueue.shift();
    if (!nextRaw) continue;
    const targetUrl = getOptimizedImageUrl(nextRaw, width);
    if (warmedUrls.has(targetUrl) || inflightMap.has(targetUrl)) continue;

    activeWorkers += 1;
    warmSingle(nextRaw, width, false).finally(() => {
      activeWorkers -= 1;
      scheduleIdle(() => pumpIdleQueue(width));
    });
  }
}

export function preloadImagesPriority(
  urls: string[],
  width: AllowedNextImageWidth = 1080
): void {
  if (typeof window === "undefined" || shouldSkipPrefetch()) return;
  for (const url of urls.slice(0, 6)) {
    if (url) void warmSingle(url, width, true);
  }
}

export function preloadImagesBackground(
  urls: string[],
  width: AllowedNextImageWidth = 640
): void {
  if (typeof window === "undefined" || shouldSkipPrefetch()) return;
  scheduleIdle(() => {
    for (const url of urls) {
      if (!url || url.startsWith("data:")) continue;
      const targetUrl = getOptimizedImageUrl(url, width);
      if (
        !warmedUrls.has(targetUrl) &&
        !inflightMap.has(targetUrl) &&
        !idleQueue.includes(url)
      ) {
        idleQueue.push(url);
      }
    }
    pumpIdleQueue(width);
  });
}
