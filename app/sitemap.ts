import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// The whole site is one page; every command's output is on it.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: siteUrl.href }];
}
