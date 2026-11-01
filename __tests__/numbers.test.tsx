import { render } from "@testing-library/react";
import { expect, test } from "vitest";
import { Numbers } from "@/components/Numbers";

test("wraps each number in a highlighted span and keeps the text intact", () => {
  const text =
    "Cut data-refresh time by 77%, from 2 hours to 28 minutes for 15,000 packages and 960+ hours.";
  const { container } = render(<Numbers text={text} />);

  expect(container.textContent).toBe(text);
  expect(
    [...container.querySelectorAll("span.text-number")].map(
      (s) => s.textContent,
    ),
  ).toEqual(["77%", "2", "28", "15,000", "960+"]);
});

test("leaves text without numbers as plain text", () => {
  const { container } = render(<Numbers text="Java/Micronaut and Python" />);
  expect(container.querySelectorAll("span")).toHaveLength(0);
  expect(container.textContent).toBe("Java/Micronaut and Python");
});
