# dsh-wsl-workspace

DeepSeek Harness 工具：**`wsl_workspace`** — 为 DSH 选择 / 校验 **WSL 工作区**（列出发行版、检查 Linux 路径、建议根目录）。

对应社区 [6Mikao9/dsh-wsl-workspace](https://github.com/6Mikao9/dsh-wsl-workspace) 的自有实现。

属于 **[dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit)**。目录浏览请配 **[dsh-wsl-picker](https://github.com/173787247/dsh-wsl-picker)**。

[English → README.md](./README.md)

---

## 为什么需要

Windows 浏览器可以打开 DSH，但 Agent 的 cwd 应落在 **Linux 文件系统**（避免慢速 `/mnt/c`）。本工具：

- `list_distros` — `wsl.exe -l -v`
- `check_path` — 校验绝对 Linux 目录；若在 `/mnt/c` 下会警告
- `suggest` — 建议 `~/projects`（或配置的 `defaultBase`）

## 工具参数

| 参数 | 必需 | 含义 |
|------|------|------|
| `action` | 是 | `list_distros` \| `check_path` \| `suggest` |
| `path` | `check_path` | 绝对 Linux 路径 |
| `base` | 否 | 覆盖 suggest 基准目录 |

## 安装

```sh
dsh plugin --profile web add github:173787247/dsh-wsl-workspace
```

## 配置

```yaml
- id: dsh-wsl-workspace
  name: dsh-wsl-workspace
  config:
    timeoutMs: 15000
    defaultBase: ~/projects
```

## 测试

```sh
npm test
```

## 许可

MIT
