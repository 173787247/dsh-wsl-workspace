import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  checkPath,
  expandBase,
  formatWorkspace,
  isSafeLinuxPath,
  isUnderMntC,
  parseDistroList,
  suggestWorkspace,
} from "../lib/workspace.js";

describe("wsl_workspace", () => {
  it("rejects unsafe paths", () => {
    assert.equal(isSafeLinuxPath("/home/a/proj"), true);
    assert.equal(isSafeLinuxPath("relative"), false);
    assert.equal(isSafeLinuxPath("/ok//bad"), false);
    assert.equal(isSafeLinuxPath("C:\\Windows"), false);
    assert.equal(isSafeLinuxPath("/has\0nul"), false);
  });

  it("detects /mnt/c", () => {
    assert.equal(isUnderMntC("/mnt/c/Users/a"), true);
    assert.equal(isUnderMntC("/home/a"), false);
  });

  it("expands ~/projects", () => {
    assert.equal(expandBase("~/projects", { home: "/home/u" }), "/home/u/projects");
    assert.equal(expandBase("/opt/ws", { home: "/home/u" }), "/opt/ws");
  });

  it("parses wsl -l -v output", () => {
    const raw = "  NAME            STATE           VERSION\n* Ubuntu          Running         2\n  Debian          Stopped         2\n";
    const distros = parseDistroList(raw);
    assert.equal(distros.length, 2);
    assert.equal(distros[0].name, "Ubuntu");
    assert.equal(distros[0].default, true);
    assert.equal(distros[0].version, "2");
    assert.equal(distros[1].name, "Debian");
  });

  it("check_path validates directories and warns on /mnt/c", () => {
    const ok = checkPath("/home/dev/proj", {
      exists: (p) => p === "/home/dev/proj",
      stat: () => ({ isDirectory: () => true }),
    });
    assert.equal(ok.ok, true);
    assert.equal(ok.isDirectory, true);

    const bad = checkPath("/home/dev/file.txt", {
      exists: (p) => p === "/home/dev/file.txt",
      stat: () => ({ isDirectory: () => false }),
    });
    assert.equal(bad.ok, false);

    const mnt = checkPath("/mnt/c/Users/nobody-should-exist-xyz", {
      exists: () => false,
      stat: () => ({ isDirectory: () => false }),
    });
    assert.equal(mnt.underMntC, true);
    assert.match(String(mnt.warning || ""), /mnt\/c/);
  });

  it("suggest returns recommended root", () => {
    const s = suggestWorkspace({ base: "~/projects", home: "/home/dev" });
    assert.equal(s.recommended, "/home/dev/projects");
    assert.equal(s.underMntC, false);
    assert.ok(s.tips.length >= 2);
  });

  it("formats", () => {
    assert.match(
      formatWorkspace({ action: "suggest", recommended: "/home/a/projects", tips: ["prefer linux"] }),
      /recommended: \/home\/a\/projects/,
    );
  });
});
