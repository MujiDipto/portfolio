import type { NextConfig } from "next";

// The site's public address: SITE_URL if set, else Vercel's production URL,
// else the dev server. Resolved here so `env` below bakes it into server and
// browser code alike; the browser cannot read these variables at runtime.
const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const siteUrl =
  process.env.SITE_URL ??
  (vercel ? `https://${vercel}` : "http://localhost:3000");

const isDev = process.env.NODE_ENV === "development";

// A CSP without nonces, so every page stays static (nonces need per-request
// rendering; see the Next.js CSP guide in node_modules/next/dist/docs).
// 'unsafe-inline' is for Next.js's inline page data and the two theme
// scripts in app/layout.tsx; everything else may come only from this site.
// React needs 'unsafe-eval' in development only.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // Only over HTTPS: on http://localhost it would break local builds.
  ...(siteUrl.startsWith("https:") ? ["upgrade-insecure-requests"] : []),
].join("; ");

/** Sent with every page and file (Vercel adds Strict-Transport-Security). */
export const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  env: { SITE_URL: siteUrl },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
