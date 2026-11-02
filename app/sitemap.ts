import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// The terminal, and /cv: the same content as a plain page.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: siteUrl.href }, { url: new URL("/cv", siteUrl).href }];
}
