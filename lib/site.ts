// The site's public address, used for metadata, the sitemap, canonical URLs,
// the curl card and Sudo's tip. next.config.ts resolves it at build time
// (SITE_URL, else Vercel's production URL) and inlines it everywhere; tests,
// which skip next.config.ts, fall back to the dev server.
export const siteUrl = new URL(process.env.SITE_URL ?? "http://localhost:3000");
