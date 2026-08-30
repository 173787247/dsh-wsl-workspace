import { detectWsl } from "./lib/wsl-host.js";
import {
  checkPath,
  formatWorkspace,
  listDistros,
  suggestWorkspace,
} from "./lib/workspace.js";

export const name = "dsh-wsl-workspace";
export const inject = ["tools", "systemPrompt"];

export function apply(ctx, config = {}) {
  const timeoutMs = positive(config.timeoutMs, 15_000);
  const defaultBase = typeof config.defaultBase === "string" && config.defaultBase.trim()
    ? config.defaultBase.trim()
    : "~/projects";
  const wsl = detectWsl();

  ctx.systemPrompt.section({
    name: "tool:wsl_workspace",
    order: 116,
    text: [
      "Use wsl_workspace to pick or validate a Linux workspace for DSH inside WSL.",
      "Prefer Linux-home paths (e.g. ~/projects) over /mnt/c — Windows browser UI is fine,",
      "but the agent cwd should live on the Linux filesystem for git/npm speed.",
      "list_distros / check_path / suggest help choose a workspace; open a new session to switch cwd.",
    ].join(" "),
  });

  ctx.tools.register({
    name: "wsl_workspace",
    description: "List WSL distros, check a Linux path, or suggest a workspace root for DSH in WSL.",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["action"],
      properties: {
        action: {
          type: "string",
          enum: ["list_distros", "check_path", "suggest"],
          description: "list_distros | check_path | suggest",
        },
        path: {
          type: "string",
          description: "Absolute Linux path for check_path.",
        },
        base: {
          type: "string",
          description: `Optional base for suggest (default ${defaultBase}).`,
        },
      },
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: true,
        properties: {
          ok: { type: "boolean" },
          wsl: { type: "boolean" },
          action: { type: "string" },
          distros: { type: "array" },
          path: { type: "string" },
          recommended: { type: "string" },
          error: { type: "string" },
        },
      },
      render: (_args, value) => [{ type: "text", text: formatWorkspace(value) }],
    },
    timeoutMs,
    isConcurrencySafe: () => true,
    async execute(args) {
      const action = String(args?.action || "").toLowerCase();
      if (!wsl) {
        return { ok: false, wsl: false, action, error: "not running in WSL" };
      }
      if (action === "list_distros") {
        const result = await listDistros({ timeoutMs });
        return { wsl: true, action, ...result };
      }
      if (action === "check_path") {
        const result = checkPath(String(args?.path || "").trim());
        return { wsl: true, action, ...result };
      }
      if (action === "suggest") {
        const base = typeof args?.base === "string" && args.base.trim()
          ? args.base.trim()
          : defaultBase;
        const result = suggestWorkspace({ base });
        return { wsl: true, action, ...result };
      }
      return { ok: false, wsl: true, action, error: "unknown action" };
    },
    presentCall: () => ({ card: "generic", title: "WSL workspace" }),
    presentResult: (_args, result) => (
      result.isError
        ? { card: "generic", title: "WSL workspace failed", content: result.content }
        : { card: "generic", title: "WSL workspace", content: result.content }
    ),
  });
}

function positive(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
