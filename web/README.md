# Mike Bell — website

Private landing and **download** site for **[Mike Bell](https://github.com/chillingpulsar/mike-bell)** (the Tauri + SvelteKit desktop app). This repo is not the application itself; it exists so visitors can learn about Mike Bell and **get a build for their OS**—**Windows**, **macOS**, and **Linux**.

## Relationship to the app

| Repo                                                                    | Role                                                                                                                           |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| [chillingpulsar/mike-bell](https://github.com/chillingpulsar/mike-bell) | Source code, releases, and desktop binaries (e.g. via [GitHub Releases](https://github.com/chillingpulsar/mike-bell/releases)) |
| **mikebell-website** (this repo)                                        | Public site: copy, screenshots, and **platform-aware download** entry points                                                   |

Typical flow: publish installers or archives from the app repo (Tauri CI often uploads per-platform artifacts to Releases). This site either **detects the visitor’s platform** (user agent / client hints) and highlights the matching download, or shows **explicit Windows / macOS / Linux** buttons that point at the correct release asset URLs.

## Development

Dependencies and scripts expect **[Bun](https://bun.sh)**.

```sh
bun install
bun run dev
```

Open the URL Vite prints (add `--open` if your setup supports it).

```sh
bun run dev -- --open
```

## Quality checks

```sh
bun run check
bun run lint
```

## Build & preview

Production build uses the **Cloudflare** adapter (`@sveltejs/adapter-cloudflare`).

```sh
bun run build
bun run preview
```

`preview` runs the build through Wrangler against the Cloudflare output.

## Deploy

Target is **Cloudflare Pages** (see [SvelteKit adapters](https://svelte.dev/docs/kit/adapters)). Connect this repo in the Cloudflare dashboard or use your usual CI deploy step after `bun run build`.

---

## Recreate this project (maintainers)

Scaffold equivalent setup with [`sv`](https://github.com/sveltejs/cli):

```sh
bun x sv@0.12.8 create --template minimal --types ts --add prettier eslint tailwindcss="plugins:typography,forms" mcp="ide:cursor+setup:remote" sveltekit-adapter="adapter:cloudflare+cfTarget:pages" --install bun ./
```
