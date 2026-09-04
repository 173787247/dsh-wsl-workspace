import { existsSync, realpathSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, resolve } from "node:path";
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
  return { type: "object", additionalProperties: true };
}

export function format(v) {
  const lines = [`wsl_workspace action=${v.action || "?"} ok=${v.ok}`];
  if (v.currentDistro) lines.push(`currentDistro: ${v.currentDistro}`);
  if (v.defaultDistro) lines.push(`defaultDistro: ${v.defaultDistro}`);
  if (v.distros) lines.push(`distros: ${v.distros.join(", ") || "(none)"}`);
  if (v.path) lines.push(`path: ${v.path}`);
  if (v.kind) lines.push(`kind: ${v.kind}`);
  if (v.exists != null) {
    lines.push(`exists: ${v.exists} isDirectory: ${v.isDirectory} onMnt: ${v.onMnt} hasGit: ${v.hasGit}`);
  }
  if (v.suggestedHome) lines.push(`suggestedHome: ${v.suggestedHome}`);
  for (const a of v.advice || []) lines.push(`- ${a}`);
  if (v.error) lines.push(`error: ${v.error}`);
  return lines.join("\n");
}

/** Classify workspace path (aligned with mnt_doctor tags). */
export function classifyWorkspacePath(abs, { home = "/home/user", exists = existsSync } = {}) {
  const path = String(abs || "");
  const onMnt = path === "/mnt" || path.startsWith("/mnt/");
  let kind = "linux_other";
  if (onMnt) {
    if (/\/(Desktop|Downloads|Documents)(\/|$)/i.test(path)) kind = "windows_user_folder";
    else if (path.includes("/Users/")) kind = "windows_users";
    else kind = "mnt_other";
  } else if (path === home || path.startsWith(`${home}/`)) {
    kind = "linux_home";
  }
  const gitPath = path.endsWith("/") ? `${path}.git` : `${path}/.git`;
  const hasGit = exists(gitPath);
  let suggestedHome = "";
  if (onMnt) {
    const leaf = basename(path) || "project";
    suggestedHome = `${home.replace(/\/+$/, "")}/src/${leaf}`;
  }
  return { path, onMnt, kind, hasGit, suggestedHome };
}

export function buildWorkspaceCheckAdvice(info) {
  const tips = [];
  if (!info.exists) tips.push("Path does not exist; create it with mkdir -p before opening a workspace.");
  else if (!info.isDirectory) tips.push("Path is not a directory.");
  if (info.onMnt) {
    tips.push("Workspace on /mnt is slow under WSL; prefer a path under /home — run mnt_doctor for details.");
    if (info.kind === "windows_user_folder") {
      tips.push("Desktop/Downloads/Documents: fine for opening files (dsh-wsl-open), bad as git/npm root.");
    }
    if (info.hasGit) tips.push("Detected .git on /mnt — expect slow status; move clone to Linux home.");
    if (info.suggestedHome) tips.push(`Suggested Linux path: ${info.suggestedHome}`);
    tips.push("Scripts on /mnt/c may be CRLF — encoding_doctor path=… ; convert paths with path_convert.");
  } else if (info.exists && info.isDirectory) {
    tips.push("Looks like a good Linux-side workspace root for DSH.");
    if (info.hasGit) tips.push("Git repo on Linux filesystem — good default.");
  }
  return tips;
}

export function buildWorkspaceListAdvice({ currentDistro, defaultDistro, distros } = {}) {
  const tips = [
    "Create a DSH workspace pointing at a Linux path under this distro (prefer /home/… over /mnt/c).",
    "Install companion dsh-wsl-picker to browse /mnt drives from the agent.",
    "Use distro_info for wsl -l -v details and \\\\wsl$\\ path safety.",
  ];
  if (currentDistro && defaultDistro && currentDistro !== defaultDistro) {
    tips.push(
      `Current session distro "${currentDistro}" differs from default "${defaultDistro}" — /home paths are not interchangeable.`,
    );
  }
  if (distros?.length) tips.push(`Installed: ${distros.join(", ")}`);
  return tips;
}

export function parseWslListQuiet(stdout) {
  return String(stdout || "")
    .replace(/\0/g, "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function listDistros({ execFileFn = execFileAsync } = {}) {
  try {
    const { stdout } = await execFileFn("wsl.exe", ["-l", "-q"], {
      timeout: 10_000,
      encoding: "utf16le",
      windowsHide: true,
    });
    return parseWslListQuiet(stdout);
  } catch {
    return [distroName()].filter(Boolean);
  }
}

async function defaultDistroName({ execFileFn = execFileAsync } = {}) {
  try {
    const { stdout } = await execFileFn("wsl.exe", ["-l", "-v"], {
      timeout: 10_000,
      encoding: "utf16le",
      windowsHide: true,
    });
    const text = String(stdout || "").replace(/\0/g, "");
    const m = text.match(/^\s*\*\s*(\S+)/m);
    return m ? m[1] : "";
  } catch {
    return "";
  }
}

export async function execute(args, _config = {}, deps = {}) {
  const action = args?.action === "check" ? "check" : "list";
  const currentDistro = distroName();
  const home = deps.home || homedir();
  const exists = deps.exists || existsSync;

  if (action === "list") {
    const distros = deps.listDistros
      ? await deps.listDistros()
      : await listDistros({ execFileFn: deps.execFileFn || execFileAsync });
    const defaultDistro = deps.defaultDistroName
      ? await deps.defaultDistroName()
      : await defaultDistroName({ execFileFn: deps.execFileFn || execFileAsync });
    return {
      ok: true,
      action: "list",
      currentDistro,
      defaultDistro: defaultDistro || "",
      distros,
      advice: buildWorkspaceListAdvice({ currentDistro, defaultDistro, distros }),
    };
  }

  const raw =
    typeof args?.path === "string" && args.path.trim()
      ? args.path.trim()
      : process.cwd() || home;
  const abs = raw.startsWith("~/")
    ? `${home}${raw.slice(1)}`
    : raw === "~"
      ? home
      : resolve(raw);
  if (!abs.startsWith("/")) {
    return {
      ok: false,
      action: "check",
      path: abs,
      error: "path must be absolute Linux",
      advice: [],
    };
  }

  const pathExists = exists(abs);
  let isDirectory = false;
  if (pathExists) {
    try {
      isDirectory = (deps.stat || statSync)(abs).isDirectory();
    } catch {
      isDirectory = false;
    }
  }
  const classified = classifyWorkspacePath(abs, { home, exists });
  const advice = buildWorkspaceCheckAdvice({
    ...classified,
    exists: pathExists,
    isDirectory,
  });
  let resolved = abs;
  if (pathExists) {
    try {
      resolved = (deps.realpath || realpathSync)(abs);
    } catch {
      resolved = abs;
    }
  }
  return {
    ok: pathExists && isDirectory && !classified.onMnt,
    action: "check",
    currentDistro,
    path: resolved,
    exists: pathExists,
    isDirectory,
    onMnt: classified.onMnt,
    kind: classified.kind,
    hasGit: classified.hasGit,
    suggestedHome: classified.suggestedHome || "",
    advice,
  };
}
