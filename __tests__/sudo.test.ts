import { describe, expect, test } from "vitest";
import { greeting, isMistake, reply, tips } from "@/lib/sudo";
import { helpEntries, run } from "@/lib/terminal";

const commands = helpEntries.map((e) =>
  e.command.replace("dark|light", "dark"),
);

describe("Sudo", () => {
  test("has a next step for every command in help", () => {
    for (const command of commands) {
      expect(reply(command), command).not.toEqual(reply("xyz"));
    }
  });

  test("only ever suggests commands that work", () => {
    const lines = [greeting, ...tips, ...commands.map(reply), reply("xyz")];
    for (const line of lines) {
      if (line.command) {
        expect(run(line.command).output?.type, line.command).not.toBe("error");
      }
    }
  });

  test("points mistakes to help", () => {
    expect(isMistake("xyz")).toBe(true);
    expect(isMistake("git log")).toBe(false);
    expect(reply("xyz").command).toBe("help");
  });

  test("offers the way back after a theme change", () => {
    expect(reply("theme light").command).toBe("theme dark");
    expect(reply("theme dark").command).toBe("theme light");
  });

  test("welcomes the easter egg", () => {
    expect(isMistake("sudo hire muji")).toBe(false);
    expect(reply("sudo hire muji").text).toContain("Permission granted");
  });
});
