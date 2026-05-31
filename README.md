# Mike Bell

Give your clicks character.

Mike Bell is a lightweight, open-source desktop app that adds keyboard and mouse sound effects ("vibes") to your typing and clicking. Inspired by [keybell](https://github.com/nicholasbalasus/keybell), [MechVibes](https://mechvibes.com), and other livestream sound-effect setups. Built with [Tauri](https://tauri.app) and [Svelte](https://svelte.dev) for native performance with a modern web UI.

## Features

- Keyboard and mouse sound effects in real time
- Cross-platform: **macOS**, **Windows**, and **Linux**
- Lightweight and close to native performance (powered by Tauri)
- Customizable sound profiles
- Simple, clean interface

## Downloads

Visit the [Mike Bell website](https://mikebell.dev) for platform-specific install guides, or check the [GitHub Releases](https://github.com/chillingpulsar/mike-bell/releases) page.

| Platform | Installer Formats        |
| -------- | ------------------------ |
| macOS    | `.app`, `.dmg`           |
| Windows  | NSIS, MSI                |
| Linux    | `.deb`, `.rpm`, AppImage |

## Project Structure

| Directory | Description                                                       |
| --------- | ----------------------------------------------------------------- |
| `app/`    | Desktop application (Tauri + SvelteKit)                           |
| `web/`    | Landing & download site (SvelteKit, deployed on Cloudflare Pages) |

## Development

### Desktop App (`app/`)

Requires [Bun](https://bun.sh) and [Rust](https://www.rust-lang.org/tools/install).

```sh
cd app
bun install
bun run tauri dev
```

### Website (`web/`)

```sh
cd web
bun install
bun run dev
```

## Contributing

Contributions are welcome! Please open an issue or pull request on [GitHub](https://github.com/chillingpulsar/mike-bell).

## License

This project is licensed under the **GNU General Public License v3.0** with a **commercial use restriction**.

You may use, study, share, and modify this software freely. However, **commercial use—including selling, sublicensing, or incorporating this software into a product or service offered for monetary gain—requires explicit written permission from the copyright holder, Mike Bell.**

See [LICENSE](./LICENSE) for full details.
