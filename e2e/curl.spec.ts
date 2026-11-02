import { expect, test } from "@playwright/test";
import { profile } from "../lib/content";

for (const agent of ["curl/8.7.1", "Wget/1.24.5", "HTTPie/3.2.4"]) {
  test(`${agent.split("/")[0]} gets a plain-text card`, async ({ request }) => {
    const response = await request.get("/", {
      headers: { "user-agent": agent },
    });
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe(
      "text/plain; charset=utf-8",
    );
    expect(response.headers()["cache-control"]).toBe("no-store");
    expect(await response.text()).toContain(profile.name);
  });
}

test("a browser still gets the page, and curl only changes /", async ({
  request,
}) => {
  const page = await request.get("/", {
    headers: { "user-agent": "Mozilla/5.0" },
  });
  expect(page.headers()["content-type"]).toContain("text/html");
  const cv = await request.get("/cv", {
    headers: { "user-agent": "curl/8.7.1" },
  });
  expect(cv.headers()["content-type"]).toContain("text/html");
});
