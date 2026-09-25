import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the Notion SDK as a native Node.js module — never bundle it for
  // the browser. This is the definitive fix for "notion.databases.query is
  // not a function" caused by the SDK's Node-only APIs being webpack-bundled.
  serverExternalPackages: ["@notionhq/client"],

  images: {
    remotePatterns: [
      // Notion's own file hosting
      { protocol: "https", hostname: "file.notion.so", pathname: "/**" },
      // Notion's S3 proxy & AWS S3 buckets (using ** for multi-level subdomains)
      { protocol: "https", hostname: "**.amazonaws.com", pathname: "/**" },
      // Notion CDN & domains
      { protocol: "https", hostname: "www.notion.so", pathname: "/**" },
      { protocol: "https", hostname: "notion.so", pathname: "/**" },
      // Google-hosted images
      { protocol: "https", hostname: "**.googleusercontent.com", pathname: "/**" },
      // Unsplash
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      // Imgur
      { protocol: "https", hostname: "i.imgur.com", pathname: "/**" },
      // GitHub hosted assets / avatars
      { protocol: "https", hostname: "**.githubusercontent.com", pathname: "/**" },
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
