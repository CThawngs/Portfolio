import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the Notion SDK as a native Node.js module — never bundle it for
  // the browser. This is the definitive fix for "notion.databases.query is
  // not a function" caused by the SDK's Node-only APIs being webpack-bundled.
  serverExternalPackages: ["@notionhq/client"],
};

export default nextConfig;
