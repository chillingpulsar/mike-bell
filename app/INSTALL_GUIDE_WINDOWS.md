# Build MikeBell on Windows

Build the app on your PC. Output is under `src-tauri\target\release\bundle\`.

## Before you start

- **[Rust](https://rustup.rs/)** — install with rustup, then open a **new** terminal and run `rustc --version` and `cargo --version`.
- **This repo** — clone or unzip and `cd` to the folder that contains `package.json`.
- **[Bun](https://bun.sh)** (easiest) **or npm** — this project runs `bun run build` by default. To use only npm, set `beforeBuildCommand` and `beforeDevCommand` in `src-tauri/tauri.conf.json` to `npm run build` and `npm run dev`.
- **Microsoft C++ Build Tools (MSVC)** and **Windows SDK** — follow the Windows section on [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/).
- **WebView2** — Windows 11 usually has it; the same Tauri page covers Windows 10.

Use **PowerShell** or **Command Prompt** for the commands below.

## Install dependencies

From the project root:

```bash
bun install
```

With npm: `npm install`.

## Build

```bash
bun run tauri build
```

Or: `npx tauri build`.

## Output

Under `src-tauri\target\release\bundle\` you should see **NSIS** and/or **MSI** folders (this project enables both in `tauri.conf.json`). Run the **`.exe`** or **`.msi`** installer.

## If something fails

| Problem                  | What to try                                                                               |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| `bun: command not found` | Install Bun, or switch Tauri to npm in `tauri.conf.json` and use `npm` / `npx`.           |
| Linker or SDK errors     | Confirm **C++ build tools** and **Windows SDK** are installed, then restart the terminal. |
| Rust errors              | From `src-tauri\`, run `cargo build` for clearer messages.                                |

More help: [Tauri 2 documentation](https://v2.tauri.app/).
