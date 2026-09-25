# dsh-wsl-workspace
> **kit:** [dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit)

## Compatibility

| Field | Value |
|-------|-------|
| **Plugin** | `dsh-wsl-workspace` **0.2.0** |
| **Minimum dsh** | ≥ **0.1.2** (web UI one-shot `?token=` on Windows relay `:3081`) |
| **Latest verified** | See [dsh-wsl-kit Compatibility](https://github.com/173787247/dsh-wsl-kit#compatibility-2026-09) (currently **`0.1.7-alpha.2`**) — single source of truth for the suite |
| **Kit set** | `full` or install alone |
| **Cloud Flash** | Use model id **`deepseek-flash`** (V4.1 Flash) in `~/.dsh/settings.yaml` / `llm-deepseek` — not configured by this plugin |
| **Agent Teams** | Upstream experimental; not required here |

Suite floor versions: kit [`check-plugin-versions.sh`](https://github.com/173787247/dsh-wsl-kit/blob/master/scripts/check-plugin-versions.sh). Fault tree: [TROUBLESHOOTING.md](https://github.com/173787247/dsh-wsl-kit/blob/master/docs/TROUBLESHOOTING.md).

**`wsl_workspace`**: list distros; check Linux workspace paths (/mnt hygiene, suggest ~/src).

```sh
dsh plugin --profile web add github:173787247/dsh-wsl-workspace
npm test
```

MIT

## Where it sits

Lists distros and checks that a Linux workspace path is not a slow /mnt mistake.

```mermaid
flowchart LR
  agent["dsh agent"] --> tool["wsl_workspace"] --> ws["distro and Linux workspace path"]
```

Suite diagram and version snapshot: [dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit#how-the-pieces-fit). This plugin is **0.2.0** (full). Do not copy that matrix into this README.

