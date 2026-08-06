import type { NextConfig } from "next";

const staticExport = process.env.STATIC_EXPORT === "1";
const basePath = staticExport
  ? process.env.NEXT_PUBLIC_BASE_PATH || "/IF_life_path"
  : "";

const nextConfig: NextConfig = {
  ...(staticExport ? { output: "export" as const } : {}),
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: staticExport,
  images: { unoptimized: staticExport },
  env: {
    NEXT_PUBLIC_STATIC_EXPORT: staticExport ? "true" : "false",
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
