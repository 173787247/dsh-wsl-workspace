# dsh-wsl-workspace

## 兼容性

| 项 | 值 |
|----|----|
| **插件** | `dsh-wsl-workspace` **0.2.0** |
| **最低 dsh** | ≥ **0.1.2**（Windows 中继 `:3081` 一次性 `?token=`） |
| **最新验证** | 以 [dsh-wsl-kit 兼容性](https://github.com/173787247/dsh-wsl-kit#compatibility-2026-09) 为准（当前 **`0.1.5-rc.1`**）— 套件唯一真源 |
| **套件档位** | `full` 或单独安装 |
| **云端 Flash** | settings / `llm-deepseek` 使用 **`deepseek-flash`**（V4.1 Flash）；本插件不配置模型 id |
| **Agent Teams** | 上游实验包；本插件不依赖 |

套件版本地板：[`check-plugin-versions.sh`](https://github.com/173787247/dsh-wsl-kit/blob/master/scripts/check-plugin-versions.sh)。故障树：[TROUBLESHOOTING.zh.md](https://github.com/173787247/dsh-wsl-kit/blob/master/docs/TROUBLESHOOTING.zh.md)。

> **套件：** [dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit)

**`wsl_workspace`**：`list` 发行版；`check` 校验 Linux 工作区（拦 Desktop/`/mnt`，建议 `~/src`）。

```sh
dsh plugin --profile web add github:173787247/dsh-wsl-workspace
npm test
```

MIT

## 在套件里的位置

列出发行版，并检查 Linux 工作区路径是不是误放在慢速 /mnt 上。

```mermaid
flowchart LR
  agent["dsh agent"] --> tool["wsl_workspace"] --> ws["发行版与 Linux 工作区路径"]
```

整套关系图和版本快照：[dsh-wsl-kit 中文说明](https://github.com/173787247/dsh-wsl-kit/blob/master/README.zh.md)。本插件是 **0.2.0**（full）。不要把那份总表抄进本 README。

