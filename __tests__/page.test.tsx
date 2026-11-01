import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import Home from "@/app/page";

test("home page renders the name as the main heading", () => {
  render(<Home />);
  expect(
    screen.getByRole("heading", { level: 1, name: "Muji Dipto" }),
  ).toBeDefined();
});
