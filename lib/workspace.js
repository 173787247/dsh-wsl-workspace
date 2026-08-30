import { existsSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { runPowerShell, runWslExe } from "./wsl-host.js";

export function isSafeLinuxPath(raw) {
  if (typeof raw !== "string") return false;
  const p = raw.trim();
  if (p.length < 1 || p.length > 1024) return false;
  if (p.includes("\0") || p.includes("\\")) return false;
  if (!p.startsWith("/")) return false;
  if (p.includes("//")) return false;
  return true;
}

export function isUnderMntC(path) {
  const p = String(path || "");
  return p === "/mnt/c" || p.startsWith("/mnt/c/");
}

export function expandBase(base, { home = homedir() } = {}) {
  const raw = String(base || "~/projects").trim() || "~/projects";
  if (raw === "~") return home;
  if (raw.startsWith("~/")) return join(home, raw.slice(2)).replace(/\\/g, "/");
  return raw.replace(/\\/g, "/");
}

export function parseDistroList(raw) {
  const text = String(raw || "")
    .replace(/^\uFEFF/, "")
    .replace(/\0/g, "");
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const distros = [];
  for (const line of lines) {
    if (/^NAME\b/i.test(line) || /^-+$/.test(line)) continue;
    const cleaned = line.replace(/^\*\s*/, "");
    const parts = cleaned.split(/\s+/).filter(Boolean);
    if (parts.length < 2) continue;
    const name = parts[0];
    let state = "";
    let version = "";
    if (parts.length >= 3 && /^\d+$/.test(parts[parts.length - 1])) {
      version = parts[parts.length - 1];
      state = parts.slice(1, -1).join(" ");
    } else {
      state = parts.slice(1).join(" ");
    }
    distros.push({
      name,
      state,
      version,
      default: /^\*/.test(line),
    });
  }
  return distros;
}

export async function listDistros({ timeoutMs = 15_000, runPs = runPowerShell, runWsl = runWslExe } = {}) {
  try {
    const { stdout } = await runWsl(["-l", "-v"], { timeoutMs });
    const distros = parseDistroList(stdout);
    if (distros.length) return { ok: true, distros, source: "wsl.exe" };
  } catch {
    // fall through to PowerShell
  }
  try {
    const { stdout } = await runPs("& wsl.exe -l -v | Out-String", { timeoutMs });
    return { ok: true, distros: parseDistroList(stdout), source: "powershell" };
  } catch (err) {
    return {
      ok: false,
      distros: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function checkPath(path, { exists = existsSync, stat = statSync } = {}) {
  if (!isSafeLinuxPath(path)) {
    return { ok: false, path, error: "unsafe or non-absolute path" };
  }
  const p = path.trim();
  if (!exists(p)) {
    return {
      ok: false,
      path: p,
      exists: false,
      isDirectory: false,
      underMntC: isUnderMntC(p),
      warning: isUnderMntC(p) ? "path is under /mnt/c (slow 9p mount)" : undefined,
      error: "path does not exist",
    };
  }
  let isDirectory = false;
  try {
    isDirectory = stat(p).isDirectory();
  } catch (err) {
    return {
      ok: false,
      path: p,
      exists: true,
      error: err instanceof Error ? err.message : String(err),
    };
  }
  const underMntC = isUnderMntC(p);
  return {
    ok: isDirectory,
    path: p,
    exists: true,
    isDirectory,
    underMntC,
    warning: underMntC
      ? "path is under /mnt/c — prefer a Linux filesystem (~/...) for git/npm (slow 9p mount)"
      : undefined,
    error: isDirectory ? undefined : "not a directory",
  };
}

export function suggestWorkspace({ base, home = homedir() } = {}) {
  const root = expandBase(base, { home });
  const underMntC = isUnderMntC(root);
  return {
    ok: true,
    base: root,
    recommended: root,
    home,
    underMntC,
    tips: [
      "Prefer a Linux-home workspace (e.g. ~/projects) over /mnt/c for git and npm performance.",
      "DSH sessions pin cwd at start; create/open a new session from the chosen Linux path.",
      underMntC
        ? "Current suggestion is under /mnt/c (slow). Consider ~/projects instead."
        : "Suggested root is on the Linux filesystem.",
    ],
  };
}

export function formatWorkspace(value) {
  if (value?.error && value.ok === false && !value.distros && !value.recommended && value.exists === undefined) {
    return `wsl_workspace failed: ${value.error}`;
  }
  const action = value.action || "result";
  const lines = [`wsl_workspace ${action}`];
  if (value.error) lines.push(`error: ${value.error}`);
  if (Array.isArray(value.distros)) {
    lines.push(`distros: ${value.distros.length}`);
    for (const d of value.distros) {
      const mark = d.default ? "*" : " ";
      lines.push(`${mark} ${d.name}  ${d.state || "-"}  ${d.version || ""}`.trimEnd());
    }
  }
  if (value.path) {
    lines.push(`path: ${value.path}`);
    if (value.exists !== undefined) lines.push(`exists: ${value.exists}`);
    if (value.isDirectory !== undefined) lines.push(`isDirectory: ${value.isDirectory}`);
    if (value.underMntC !== undefined) lines.push(`underMntC: ${value.underMntC}`);
  }
  if (value.recommended) lines.push(`recommended: ${value.recommended}`);
  if (value.warning) lines.push(`warning: ${value.warning}`);
  for (const tip of value.tips || []) lines.push(`- ${tip}`);
  return lines.join("\n");
}
