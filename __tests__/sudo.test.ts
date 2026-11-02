import { describe, expect, test } from "vitest";
import { greeting, isEgg, isMistake, jumps, reply, tips } from "@/lib/sudo";
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
    const lines = [
      greeting,
      ...tips,
      ...commands.map(reply),
      ...["xyz", "exit", "vim", "rm", "ls -a", "cat .sudo-secrets"].map(reply),
    ];
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

  test("answers to its own name instead of calling it a mistake", () => {
    for (const command of ["sudo", "sudo rm -rf /", "SUDO ls"]) {
      expect(isMistake(command), command).toBe(false);
      expect(reply(command).text, command).toContain("That's my name");
    }
  });

  test("plays along with terminal habits", () => {
    for (const command of ["exit", "vim", "rm -rf /", "ls -a", "neofetch"]) {
      expect(isMistake(command), command).toBe(false);
      expect(reply(command), command).not.toEqual(reply("xyz"));
    }
    expect(reply("exit").command).toBe("cat contact");
    expect(jumps("rm -rf /")).toBe(true);
    expect(jumps("sudo hire muji")).toBe(true);
    expect(jumps("git log")).toBe(false);
  });

  test("welcomes the easter egg", () => {
    expect(isEgg("  Sudo   hire MUJI ")).toBe(true);
    expect(isEgg("sudo hire")).toBe(false);
    expect(isMistake("sudo hire muji")).toBe(false);
    expect(reply("sudo hire muji").text).toContain("Permission granted");
  });
});

test("answers everyday shell commands, never as mistakes, suggesting only real commands", () => {
  for (const command of [
    "pwd",
    "cd",
    "cd projects",
    "echo hi",
    "date",
    "hostname",
    "uname",
    "id",
    "history",
    "tree",
    "man ls",
    "git status",
    "git branch",
    "mkdir x",
  ]) {
    const line = reply(command);
    expect(line.text, command).not.toMatch(/not a command/);
    expect(isMistake(command), command).toBe(false);
    if (line.command) {
      expect(run(line.command).output?.type, line.command).not.toBe("error");
    }
  }
});

test("answers git push and pull in character", () => {
  expect(reply("git push").text).toMatch(/Only Muji pushes here/);
  expect(reply("git pull").command).toBe("git log --graph");
  for (const command of ["git push", "git pull", "git commit", "git diff"]) {
    expect(isMistake(command), command).toBe(false);
    expect(reply(command).text, command).not.toMatch(/not a command/);
  }
});
