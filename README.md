# dsh-wsl-workspace

DeepSeek Harness plugin: List WSL distros and validate a Linux workspace path for DeepSeek Harness under WSL.

Part of **[dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit)**.

[中文说明 → README.zh.md](./README.zh.md)

## Install

```sh
dsh plugin --profile web add github:173787247/dsh-wsl-workspace
# or local:
dsh plugin --profile web add /absolute/path/to/dsh-wsl-workspace
```

Restart `dsh web` and open a **new** session. Tool: `wsl_workspace`.

## License

MIT
