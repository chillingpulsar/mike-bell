# Build MikeBell on Linux

Build the app on your machine. Installers land in `src-tauri/target/release/bundle/`.

## Before you start

- **[Rust](https://rustup.rs/)** — install with rustup, then open a **new** terminal and run `rustc --version` and `cargo --version`.
- **This repo** — clone or unzip and `cd` to the folder that contains `package.json`.
- **[Bun](https://bun.sh)** (easiest) **or npm** — this project runs `bun run build` by default. To use only npm, set `beforeBuildCommand` and `beforeDevCommand` in `src-tauri/tauri.conf.json` to `npm run build` and `npm run dev`.
- **Packages for your distro** (WebKitGTK, etc.) — [Tauri Linux prerequisites](https://v2.tauri.app/start/prerequisites/).

MikeBell listens to keyboard and mouse globally. If input does not work, see [README.md — System permissions](README.md) (for example the `input` group on some distros).

## Install dependencies

From the project root:

```bash
bun install
```

With npm (after pointing Tauri at npm as above): `npm install`.

## Build

```bash
bun run tauri build
```

With npm: `npx tauri build`.

## Output

Look in `src-tauri/target/release/bundle/` for `.deb`, `.rpm`, and/or `.AppImage`. For an AppImage:

```bash
chmod +x mikebell_*_.AppImage
./mikebell_*_.AppImage
```

(The exact name includes version and arch.)

## Development

```bash
bun run tauri dev
```

With npm: `npx tauri dev`.

## If something fails

| Problem                  | What to try                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| `bun: command not found` | Install Bun, or switch Tauri to npm in `tauri.conf.json` and use `npm` / `npx`.            |
| Missing libraries        | Re-check [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your distro. |
| Rust errors              | From `src-tauri/`, run `cargo build` for clearer messages.                                 |

More help: [Tauri 2 documentation](https://v2.tauri.app/).
