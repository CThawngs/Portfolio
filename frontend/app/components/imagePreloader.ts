"use client";

/**
 * Client-side Image Preloader & Bitmap Decoder Cache
 * Keeps decoded HTMLImageElement references alive in memory so switching
 * Stage items or Grid pagination pages renders in 0ms without blank flashes.
 */

const decodedCache = new Map<string, HTMLImageElement>();
const inflightMap = new Map<string, Promise<void>>();
const backgroundQueue: string[] = [];
let activeWorkers = 0;
const MAX_CONCURRENT_BG = 5;

function isPreloadableUrl(url: string): boolean {
  if (!url || typeof window === "undefined") return false;
  if (url.startsWith("data:")) return false;
  return true;
}

function loadAndDecodeSingle(
  url: string,
  highPriority: boolean
): Promise<void> {
  if (!isPreloadableUrl(url) || decodedCache.has(url)) {
    return Promise.resolve();
  }
  const existing = inflightMap.get(url);
  if (existing) return existing;

  const promise = new Promise<void>((resolve) => {
    const img = new window.Image();
    img.decoding = "async";
    if (highPriority && "fetchPriority" in img) {
      (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority =
        "high";
    }
    const finish = () => {
      decodedCache.set(url, img);
      inflightMap.delete(url);
      resolve();
    };
    img.onload = () => {
      if (typeof img.decode === "function") {
        img.decode().then(finish).catch(finish);
      } else {
        finish();
      }
    };
    img.onerror = () => {
      inflightMap.delete(url);
      resolve();
    };
    img.src = url;
  });

  inflightMap.set(url, promise);
  return promise;
}

function pumpBackgroundQueue(): void {
  while (activeWorkers < MAX_CONCURRENT_BG && backgroundQueue.length > 0) {
    const nextUrl = backgroundQueue.shift();
    if (!nextUrl || decodedCache.has(nextUrl) || inflightMap.has(nextUrl)) {
      continue;
    }
    activeWorkers += 1;
    loadAndDecodeSingle(nextUrl, false).finally(() => {
      activeWorkers -= 1;
      pumpBackgroundQueue();
    });
  }
}

/**
 * Immediately fetches and GPU-decodes high-priority URLs (next/prev Stage items,
 * current & adjacent Grid pages, or hovered items).
 */
export function preloadImagesPriority(urls: string[]): void {
  if (typeof window === "undefined") return;
  for (const url of urls) {
    if (isPreloadableUrl(url)) {
      void loadAndDecodeSingle(url, true);
    }
  }
}

/**
 * Enqueues remaining portfolio images into a polite background worker pool
 * so all pages and Stage items warm into browser memory shortly after first paint.
 */
export function preloadImagesBackground(urls: string[]): void {
  if (typeof window === "undefined") return;
  for (const url of urls) {
    if (
      isPreloadableUrl(url) &&
      !decodedCache.has(url) &&
      !inflightMap.has(url) &&
      !backgroundQueue.includes(url)
    ) {
      backgroundQueue.push(url);
    }
  }
  pumpBackgroundQueue();
}

export function isImageDecoded(url: string): boolean {
  return decodedCache.has(url);
}
