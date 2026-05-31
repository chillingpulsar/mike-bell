# Build MikeBell on macOS

Build the app on your Mac. Output is under `src-tauri/target/release/bundle/macos/`.

## Before you start

- **[Rust](https://rustup.rs/)** — install with rustup, then open a **new** terminal and run `rustc --version` and `cargo --version`.
- **This repo** — clone or unzip and `cd` to the folder that contains `package.json`.
- **[Bun](https://bun.sh)** (easiest) **or npm** — this project runs `bun run build` by default. To use only npm, set `beforeBuildCommand` and `beforeDevCommand` in `src-tauri/tauri.conf.json` to `npm run build` and `npm run dev`.
- **Xcode Command Line Tools:**

  ```bash
  xcode-select --install
  ```

- Anything else listed for macOS on [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/).

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

With npm: `npx tauri build`. The first run can take several minutes while dependencies download.

## Output

Open `src-tauri/target/release/bundle/macos/` for **`mikebell.app`** and often a **`.dmg`**. Drag the app to Applications or run the `.app` directly.

**Apple Silicon vs Intel:** The build matches the Mac you build on. Someone on the other architecture should build there, or you need a release setup (universal binary or two builds).

**Gatekeeper:** A build you make is not automatically trusted on another Mac when sent over the internet. Wider distribution usually means code signing and notarization.

## Development

```bash
bun run tauri dev
```

With npm: `npx tauri dev`.
