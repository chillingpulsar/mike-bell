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

## System permissions (desktop)

Sounds are driven from **global** keyboard and mouse hooks in the Tauri shell so they still register when another app is focused or the pointer is outside MikeBell’s window. Playback uses **native audio (rodio/CPAL)** so clicks and keys stay audible even when the WKWebView’s Web Audio stack is suspended (a common limitation when the window is not key). The web page alone cannot see those global events. OS privacy (TCC) still applies—this is separate from [Tauri IPC](https://v2.tauri.app/concept/).

- **macOS**: On launch, MikeBell calls Apple’s APIs (`AXIsProcessTrustedWithOptions` with prompt, and `CGRequestListenEventAccess` when needed) so **Accessibility** and **Input Monitoring** dialogs can appear. Enable MikeBell manually under **System Settings → Privacy & Security → Accessibility** and **Input Monitoring** if needed. Dev (`bun tauri dev`) and the shipped `.app` may appear as **separate** entries—toggle both for each if you use both. **After you turn on Input Monitoring or Accessibility, fully quit and reopen MikeBell**; macOS often will not upgrade a running app’s event tap from “in-app only” to system-wide until restart.
- **Linux**: Your user may need access to input devices (often membership in the `input` group or equivalent, depending on distro).
- **Windows**: Usually works without extra steps; if listening fails, try running as administrator only as a last resort.

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
