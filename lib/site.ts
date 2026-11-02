// The site's public address, used for metadata, the sitemap and canonical
// URLs. SITE_URL overrides it; on Vercel it is the project's production URL
// (www.dipto.dev), provided at build time; locally, the dev server.
const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const siteUrl = new URL(
  process.env.SITE_URL ??
    (vercel ? `https://${vercel}` : "http://localhost:3000"),
);
