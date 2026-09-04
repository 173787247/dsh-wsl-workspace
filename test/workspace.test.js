import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildWorkspaceCheckAdvice,
  buildWorkspaceListAdvice,
  classifyWorkspacePath,
  format,
  parseWslListQuiet,
} from "../lib/workspace.js";

describe("classifyWorkspacePath", () => {
  it("flags Desktop on mnt and suggests home", () => {
    const info = classifyWorkspacePath("/mnt/c/Users/a/Desktop/proj", {
      home: "/home/a",
      exists: (p) => p.endsWith("/.git"),
    });
    assert.equal(info.onMnt, true);
    assert.equal(info.kind, "windows_user_folder");
    assert.equal(info.hasGit, true);
    assert.equal(info.suggestedHome, "/home/a/src/proj");
  });
});

describe("buildWorkspaceCheckAdvice", () => {
  it("links mnt_doctor", () => {
    const tips = buildWorkspaceCheckAdvice({
      exists: true,
      isDirectory: true,
      onMnt: true,
      kind: "windows_user_folder",
      hasGit: true,
      suggestedHome: "/home/a/src/x",
    });
    assert.ok(tips.some((t) => /mnt_doctor/i.test(t)));
  });
});

describe("buildWorkspaceListAdvice", () => {
  it("warns when current != default", () => {
    const tips = buildWorkspaceListAdvice({
      currentDistro: "Ubuntu-24.04",
      defaultDistro: "docker-desktop",
      distros: ["Ubuntu-24.04", "docker-desktop"],
    });
    assert.ok(tips.some((t) => /differs from default/i.test(t)));
  });
});

describe("parseWslListQuiet", () => {
  it("splits names", () => {
    assert.deepEqual(parseWslListQuiet("Ubuntu-24.04\r\ndocker-desktop\r\n"), [
      "Ubuntu-24.04",
      "docker-desktop",
    ]);
  });
});

describe("format", () => {
  it("includes kind", () => {
    assert.match(
      format({ ok: false, action: "check", kind: "mnt_other", path: "/mnt/c/x", advice: [] }),
      /kind: mnt_other/,
    );
  });
});
