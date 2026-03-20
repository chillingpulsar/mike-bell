# MikeBell

Keyboard and mouse "vibes" inspired by keybell, MechVibes, and other livestream sound-effect setups.

MikeBell is a Tauri + SvelteKit app that listens for keyboard presses and mouse clicks and plays satisfying procedural sound effects (no sample packs needed). The sound library is meant to be dynamic and expand over time.

## Features

- Synthesized keyboard sounds (procedural Web Audio)
- Synthesized mouse click sounds (procedural Web Audio)
- Desktop app via Tauri

## Tech Stack

- Svelte 5 + SvelteKit
- Tauri (desktop)
- Web Audio API (sound synthesis)
- Tailwind v4

## Development

```bash
npm run dev
```

To run type checks:

```bash
npm run check
```

## License

Licensed under the GNU General Public License v3. See `LICENSE` for details.
