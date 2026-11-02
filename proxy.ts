import { NextResponse } from "next/server";
import { curlCard } from "@/lib/curl-card";
import { siteUrl } from "@/lib/site";

// `curl dipto.dev` (or wget, or HTTPie) gets a plain-text card instead of
// HTML. The matcher only lets those tools through, so browsers never run
// this and the home page stays static.
export function proxy() {
  return new NextResponse(curlCard(siteUrl.origin), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      // Never let a cache hand this text to a browser, or the page to curl.
      "cache-control": "no-store",
      vary: "user-agent",
    },
  });
}

export const config = {
  matcher: [
    {
      source: "/",
      has: [
        {
          type: "header",
          key: "user-agent",
          value: "(curl|Wget|HTTPie|xh)/.*",
        },
      ],
    },
  ],
};
