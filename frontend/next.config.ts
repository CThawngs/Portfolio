import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the Notion SDK as a native Node.js module — never bundle it for
  // the browser. This is the definitive fix for "notion.databases.query is
  // not a function" caused by the SDK's Node-only APIs being webpack-bundled.
  serverExternalPackages: ["@notionhq/client"],

  images: {
    // Explicit hostname list — Next.js does NOT support multi-level wildcards
    // like *.s3.*.amazonaws.com (that pattern caused the build crash).
    // We enumerate the real hosts Notion uses instead.
    remotePatterns: [
      // Notion's own file hosting
      { protocol: "https", hostname: "file.notion.so", pathname: "/**" },
      // Notion's primary S3 proxy (most file uploads go here)
      { protocol: "https", hostname: "prod-files-secure.s3.us-west-2.amazonaws.com", pathname: "/**" },
      // Notion CDN
      { protocol: "https", hostname: "www.notion.so", pathname: "/**" },
      { protocol: "https", hostname: "notion.so", pathname: "/**" },
      // Google-hosted images (profile photos pasted from Google)
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "lh4.googleusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "lh5.googleusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "lh6.googleusercontent.com", pathname: "/**" },
      // Unsplash
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      // Imgur
      { protocol: "https", hostname: "i.imgur.com", pathname: "/**" },
    ],

    // WebP gives ~30% smaller files vs JPEG with no visible quality loss
    formats: ["image/webp"],

    // Sizes tuned for the 3-column card grid and popup hero image
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [64, 128, 256, 384, 480],

    // Cache optimised images for 7 days on Vercel's CDN edge
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
};

export default nextConfig;
