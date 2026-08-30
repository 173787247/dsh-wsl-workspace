# dsh-wsl-workspace

DeepSeek Harness tool: **`wsl_workspace`** â€?help pick or create **WSL workspace facts** for DSH (list distros, check Linux paths, suggest a root).

Counterpart (own implementation) to community [6Mikao9/dsh-wsl-workspace](https://github.com/6Mikao9/dsh-wsl-workspace).

Part of **[dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit)**. Pair with **[dsh-wsl-picker](https://github.com/173787247/dsh-wsl-picker)** to browse directories.

[ä¸­æ–‡è¯´æ˜Ž â†?README.zh.md](./README.zh.md)

---

## Why

The Windows browser UI can open DSH, but the agent should use a **Linux filesystem** cwd (not slow `/mnt/c`). This tool:

- `list_distros` â€?`wsl.exe -l -v`
- `check_path` â€?verify an absolute Linux directory; warn if under `/mnt/c`
- `suggest` â€?recommend `~/projects` (or your `defaultBase`)

## Tool

| Arg | Required | Meaning |
|-----|----------|---------|
| `action` | yes | `list_distros` \| `check_path` \| `suggest` |
| `path` | for `check_path` | Absolute Linux path |
| `base` | no | Override suggest base (default `~/projects`) |

## Install

```sh
dsh plugin --profile web add github:173787247/dsh-wsl-workspace
```

## Config

```yaml
- id: dsh-wsl-workspace
  name: dsh-wsl-workspace
  config:
    timeoutMs: 15000
    defaultBase: ~/projects
```

| Key | Default | Meaning |
|-----|---------|---------|
| `timeoutMs` | `15000` | Tool timeout |
| `defaultBase` | `~/projects` | Suggest base when `base` omitted |

## Test

```sh
npm test
```

## License

MIT

Restart `dsh web` after installing so Tools lists the new plugin.
