import { expect, test } from "vitest";
import { tenure } from "@/components/terminal/Outputs";
import { experience } from "@/lib/content";

const org = (start: string, end: string) => ({
  name: "Example",
  roles: [{ title: "Engineer", start, end, highlights: [] }],
});

test("counts both the first and last month", () => {
  expect(tenure(org("Jan 2022", "Oct 2026"))).toBe("4 yrs 10 mos");
  expect(tenure(org("Jan 2022", "Dec 2022"))).toBe("1 yr");
  expect(tenure(org("Jan 2022", "Jan 2023"))).toBe("1 yr 1 mo");
  expect(tenure(org("Mar 2024", "Aug 2024"))).toBe("6 mos");
});

test("spans every role at an organisation", () => {
  const oracle = experience.find((o) => o.name === "Oracle")!;
  expect(tenure(oracle)).toBe("4 yrs 10 mos");
});
