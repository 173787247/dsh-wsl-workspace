import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { format } from "../lib/workspace.js";

describe("wsl_workspace", () => {
  it("formats", () => {
    assert.match(format({ ok: true }), /ok/i);
  });
});
