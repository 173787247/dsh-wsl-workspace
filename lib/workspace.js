import { existsSync, readdirSync, realpathSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { distroName } from "./wsl-host.js";

const execFileAsync = promisify(execFile);

export function notWsl() {
  return { ok: false, error: "not running in WSL", advice: [] };
}

export function parameters() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      action: {
        type: "string",
        enum: ["list", "check"],
        description: "list = distros; check = validate a Linux workspace path.",
      },
      path: {
        type: "string",
        description: "Absolute Linux path when action=check (default: cwd or home).",
      },
    },
  };
}

export function outputSchema() {
  return {
    type: "object",
    additionalProperties: true,
    properties: {
      ok: { type: "boolean" },
      action: { type: "string" },
      currentDistro: { type: "string" },
      distros: { type: "array", items: { type: "string" } },
      path: { type: "string" },
      exists: { type: "boolean" },
      isDirectory: { type: "boolean" },
      onMnt: { type: "boolean" },
      advice: { type: "array", items: { type: "string" } },
      error: { type: "string" },
    },
  };
}

export function format(v) {
  const lines = [`wsl_workspace action=${v.action || "?"} ok=${v.ok}`];
  if (v.currentDistro) lines.push(`currentDistro: ${v.currentDistro}`);
  if (v.distros) lines.push(`distros: ${v.distros.join(", ") || "(none)"}`);
  if (v.path) lines.push(`path: ${v.path}`);
  if (v.exists != null) lines.push(`exists: ${v.exists} isDirectory: ${v.isDirectory} onMnt: ${v.onMnt}`);
  for (const a of v.advice || []) lines.push(`- ${a}`);
  if (v.error) lines.push(`error: ${v.error}`);
  return lines.join("\n");
}

async function listDistros() {
  try {
    const { stdout } = await execFileAsync("wsl.exe", ["-l", "-q"], {
      timeout: 10_000,
      encoding: "utf16le",
      windowsHide: true,
    });
    return String(stdout || "")
      .split(/\r?\n/)
      .map((s) => s.replace(/\0/g, "").trim())
      .filter(Boolean);
  } catch {
    return [distroName()];
  }
}

export async function execute(args) {
  const action = args?.action === "check" ? "check" : "list";
  const currentDistro = distroName();
  if (action === "list") {
    const distros = await listDistros();
    return {
      ok: true,
      action: "list",
      currentDistro,
      distros,
      advice: [
        "Create a DSH workspace pointing at a Linux path under this distro (prefer /home/… over /mnt/c).",
        "Install companion dsh-wsl-picker to browse /mnt drives from the agent.",
      ],
    };
  }
  const raw = typeof args?.path === "string" && args.path.trim() ? args.path.trim() : process.cwd() || homedir();
  const abs = raw.startsWith("~/") ? `${homedir()}${raw.slice(1)}` : resolve(raw);
  const advice = [];
  if (!abs.startsWith("/")) {
    return { ok: false, action: "check", path: abs, error: "path must be absolute Linux", advice };
  }
  const exists = existsSync(abs);
  let isDirectory = false;
  if (exists) {
    try {
      isDirectory = statSync(abs).isDirectory();
    } catch {
      isDirectory = false;
    }
  }
  const onMnt = abs === "/mnt" || abs.startsWith("/mnt/");
  if (!exists) advice.push("Path does not exist; create it with mkdir -p before opening a workspace.");
  else if (!isDirectory) advice.push("Path is not a directory.");
  if (onMnt) advice.push("Workspace on /mnt/c is slow under WSL; prefer a path under /home.");
  else advice.push("Looks like a good Linux-side workspace root for DSH.");
  return {
    ok: exists && isDirectory,
    action: "check",
    currentDistro,
    path: exists ? realpathSync(abs) : abs,
    exists,
    isDirectory,
    onMnt,
    advice,
  };
}
