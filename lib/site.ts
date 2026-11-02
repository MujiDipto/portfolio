// The site's public address: the one setting to change for muji.dev (set
// SITE_URL). On Vercel it falls back to the project's production URL, which
// Vercel provides at build time; locally, to the dev server.
const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const siteUrl = new URL(
  process.env.SITE_URL ??
    (vercel ? `https://${vercel}` : "http://localhost:3000"),
);
