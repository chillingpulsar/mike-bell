# Adding a New Sound

All sound definitions live in **`app/src/lib/shared/sound-profiles.json`**. This is the single source of truth consumed by both:

- **TypeScript** (`app/src/lib/sound-engines.ts`) — Web Audio engine for browser/Tauri webview
- **Rust** (`app/src-tauri/src/desktop_audio.rs`) — native rodio engine for macOS/Linux/Windows

## Steps

1. **Edit `sound-profiles.json`** — Add a new entry under `keyboard` and/or `mouse` with the sound name as key.

2. **Add the sound ID to `app/src/lib/types.ts`** — Add the new name to the `BuiltinSoundIds` union.

3. **Update `soundList` in `+page.svelte`** — Add `{ id: 'yourSound', name: 'Your Sound' }` to the `builtinSoundList` array.

4. **Update the Rust dispatcher** — Add a match arm in `build_keyboard` and/or `build_mouse` in `desktop_audio.rs`.

## Sound Profile Format

Each sound is defined as a JSON object with two arrays:

```json
{
	"oscillators": [
		{
			"wave": "triangle", // sine | triangle | square | sawtooth
			"start_hz": 720, // starting frequency
			"end_hz": 180, // ending frequency after ramp
			"ramp_s": 0.045, // seconds to ramp from start to end frequency
			"exp": true, // true = exponential sweep, false = linear
			"dur_s": 0.08, // total oscillator duration in seconds
			"peak": 0.22, // peak gain (0.0 to 1.0)
			"env_s": 0.07, // gain envelope decay time (peak → ~0)
			"filter": {
				// optional biquad filter
				"type": "lp", // lp | bp | lp_sweep
				"freq": 520, // filter frequency (for lp, bp)
				"q": 0.85 // filter Q/resonance
			}
		}
	],
	"noise_bursts": [
		{
			"offset_s": 0, // delay from start before noise plays
			"dur_s": 0.022, // noise burst duration
			"peak": 0.09, // noise peak gain
			"center_hz": 2400 // bandpass filter center frequency
		}
	]
}
```

Multiple oscillators are summed together. Noise bursts are bandpass-filtered white noise with exponential decay.
