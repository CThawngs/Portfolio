import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the Notion SDK as a native Node.js module — never bundle it for
  // the browser. This is the definitive fix for "notion.databases.query is
  // not a function" caused by the SDK's Node-only APIs being webpack-bundled.
  serverExternalPackages: ["@notionhq/client"],

  images: {
    // Allow Next.js Image Optimization for all domains that Notion uses
    // to serve file attachments and S3-hosted assets.
    remotePatterns: [
      // Notion's own file hosting (file.notion.so)
      {
        protocol: "https",
        hostname: "file.notion.so",
        pathname: "/**",
      },
      // Notion's secure S3 proxy (prod-files-secure.s3.us-west-2.amazonaws.com)
      {
        protocol: "https",
        hostname: "prod-files-secure.s3.us-west-2.amazonaws.com",
        pathname: "/**",
      },
      // Generic AWS S3 buckets (*.s3.amazonaws.com)
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
        pathname: "/**",
      },
      // AWS S3 regional buckets (*.s3.*.amazonaws.com)
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
        pathname: "/**",
      },
      // Notion CDN images
      {
        protocol: "https",
        hostname: "www.notion.so",
        pathname: "/**",
      },
      // External images users might paste into Notion (e.g. lh3.googleusercontent.com)
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      // Unsplash (common for placeholder images)
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],

    // WebP is the best tradeoff for photo-heavy portfolio thumbnails.
    // AVIF gives ~30% better compression but takes longer to encode on the server.
    formats: ["image/webp"],

    // Thumbnail sizes used in the 3-column card grid + popup hero
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 480],

    // Cache optimised images for 7 days on CDN (Vercel default is 60s)
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
};

export default nextConfig;
