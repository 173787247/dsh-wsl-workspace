import { detectWsl } from "./lib/wsl-host.js";
import * as core from "./lib/workspace.js";

export const name = "dsh-wsl-workspace";
export const inject = ["tools", "systemPrompt"];

export function apply(ctx, config = {}) {
  const timeoutMs = positive(config.timeoutMs, 15_000);
  const wsl = detectWsl();

  ctx.systemPrompt.section({
    name: "tool:wsl_workspace",
    order: 110,
    text: "Use wsl_workspace to list distros or check a Linux workspace path (flag /mnt Desktop, .git, suggest ~/src). Pair with mnt_doctor / distro_info / path_convert.",
  });

  ctx.tools.register({
    name: "wsl_workspace",
    description:
      "List WSL distros (current vs default) or validate a Linux workspace path for DSH (/mnt hygiene).",
    parameters: core.parameters(config),
    output: {
      schema: core.outputSchema(),
      render: (_args, value) => [{ type: "text", text: core.format(value) }],
    },
    timeoutMs,
    isConcurrencySafe: () => true,
    async execute(args) {
      if (!wsl) return core.notWsl ? core.notWsl() : { ok: false, error: "not running in WSL" };
      return core.execute(args, config);
    },
    presentCall: () => ({ card: "generic", title: "wsl_workspace" }),
    presentResult: (_args, result) => (
      result.isError
        ? { card: "generic", title: "wsl_workspace failed", content: result.content }
        : { card: "generic", title: "wsl_workspace", content: result.content }
    ),
  });
}

function positive(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
