import type { NextConfig } from "next";

// The site's public address: SITE_URL if set, else Vercel's production URL,
// else the dev server. Resolved here so `env` below bakes it into server and
// browser code alike; the browser cannot read these variables at runtime.
const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const siteUrl =
  process.env.SITE_URL ??
  (vercel ? `https://${vercel}` : "http://localhost:3000");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  env: { SITE_URL: siteUrl },
};

export default nextConfig;
