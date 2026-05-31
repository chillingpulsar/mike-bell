/**
 * Procedural UI sounds via Web Audio (works in Tauri webview).
 *
 * Sound definitions are loaded from shared/sound-profiles.json — the single
 * source of truth also consumed by the Rust native audio engine
 * (desktop_audio.rs). Adding a new sound only requires editing the JSON.
 */

import type { SoundIds } from '$lib/types';
import profilesJson from '$lib/shared/sound-profiles.json';

let audioContext: AudioContext | null = null;

function ctx(): AudioContext {
	if (!audioContext) audioContext = new AudioContext();
	if (audioContext.state === 'suspended') void audioContext.resume();
	return audioContext;
}

function clampVolumePct(v: number): number {
	if (Number.isNaN(v)) return 100;
	return Math.min(100, Math.max(0, v));
}

/** Linear 0–100% master gain into the destination. */
function volumeOut(c: AudioContext, volumePct: number): GainNode {
	const g = c.createGain();
	g.gain.value = clampVolumePct(volumePct) / 100;
	g.connect(c.destination);
	return g;
}

// ── Profile-driven synthesis ────────────────────────────────────────────────

interface OscDef {
	wave: string;
	start_hz: number;
	end_hz: number;
	ramp_s: number;
	exp: boolean;
	dur_s: number;
	peak: number;
	env_s: number;
	filter?: {
		type: string;
		freq?: number;
		q?: number;
		start_hz?: number;
		end_hz?: number;
		ramp_s?: number;
	};
}

interface NoiseDef {
	offset_s: number;
	dur_s: number;
	peak: number;
	center_hz: number;
}

interface SoundProfile {
	oscillators: OscDef[];
	noise_bursts: NoiseDef[];
}

const PROFILES = profilesJson as {
	keyboard: Record<string, SoundProfile>;
	mouse: Record<string, SoundProfile>;
};

function noiseBurst(
	c: AudioContext,
	start: number,
	durationSec: number,
	peakGain: number,
	centerHz: number,
	out: AudioNode
) {
	const n = Math.floor(c.sampleRate * durationSec);
	const buf = c.createBuffer(1, n, c.sampleRate);
	const ch = buf.getChannelData(0);
	for (let i = 0; i < n; i++) {
		ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / (n * 0.12));
	}
	const src = c.createBufferSource();
	src.buffer = buf;
	const bp = c.createBiquadFilter();
	bp.type = 'bandpass';
	bp.frequency.value = centerHz;
	bp.Q.value = 0.7;
	const g = c.createGain();
	g.gain.setValueAtTime(peakGain, start);
	g.gain.exponentialRampToValueAtTime(0.0001, start + durationSec);
	src.connect(bp);
	bp.connect(g);
	g.connect(out);
	src.start(start);
	src.stop(start + durationSec + 0.01);
}

function waveType(w: string): OscillatorType {
	switch (w) {
		case 'sine':
			return 'sine';
		case 'triangle':
			return 'triangle';
		case 'square':
			return 'square';
		case 'sawtooth':
			return 'sawtooth';
		default:
			return 'sine';
	}
}

function renderOscillator(c: AudioContext, def: OscDef, out: AudioNode) {
	const t = c.currentTime;
	const osc = c.createOscillator();
	const og = c.createGain();
	osc.type = waveType(def.wave);
	osc.frequency.setValueAtTime(def.start_hz, t);
	if (def.exp) {
		osc.frequency.exponentialRampToValueAtTime(Math.max(def.end_hz, 0.01), t + def.ramp_s);
	} else {
		osc.frequency.linearRampToValueAtTime(def.end_hz, t + def.ramp_s);
	}
	og.gain.setValueAtTime(def.peak, t);
	og.gain.exponentialRampToValueAtTime(0.0001, t + def.env_s);

	if (def.filter) {
		const f = c.createBiquadFilter();
		if (def.filter.type === 'lp') {
			f.type = 'lowpass';
			f.frequency.value = def.filter.freq ?? 1000;
			f.Q.value = def.filter.q ?? 1.0;
			osc.connect(f);
			f.connect(og);
		} else if (def.filter.type === 'bp') {
			f.type = 'bandpass';
			f.frequency.value = def.filter.freq ?? 1000;
			f.Q.value = def.filter.q ?? 1.0;
			osc.connect(f);
			f.connect(og);
		} else if (def.filter.type === 'lp_sweep') {
			// Lowpass with frequency sweep — use a separate approach
			f.type = 'lowpass';
			f.frequency.setValueAtTime(def.filter.start_hz ?? 1000, t);
			f.frequency.exponentialRampToValueAtTime(
				Math.max(def.filter.end_hz ?? 100, 0.01),
				t + (def.filter.ramp_s ?? def.ramp_s)
			);
			f.Q.value = def.filter.q ?? 1.0;
			osc.connect(f);
			f.connect(og);
		} else {
			osc.connect(og);
		}
	} else {
		osc.connect(og);
	}

	og.connect(out);
	osc.start(t);
	osc.stop(t + def.dur_s + 0.01);
}

function renderProfile(c: AudioContext, profile: SoundProfile, out: AudioNode) {
	for (const oscDef of profile.oscillators) {
		renderOscillator(c, oscDef, out);
	}
	for (const noiseDef of profile.noise_bursts) {
		noiseBurst(
			c,
			c.currentTime + noiseDef.offset_s,
			noiseDef.dur_s,
			noiseDef.peak,
			noiseDef.center_hz,
			out
		);
	}
}

// ── Public API ──────────────────────────────────────────────────────────────

export function playKeyboard(id: SoundIds, volumePct = 100) {
	if (id === 'off') return;
	if (typeof id === 'string' && id.startsWith('custom:')) {
		void playCustomSound(id.slice(7), volumePct);
		return;
	}
	const profile = PROFILES.keyboard[id as string];
	if (!profile) return;
	const c = ctx();
	const out = volumeOut(c, volumePct);
	renderProfile(c, profile, out);
}

export function playMouse(id: SoundIds, volumePct = 100) {
	if (id === 'off') return;
	if (typeof id === 'string' && id.startsWith('custom:')) {
		void playCustomSound(id.slice(7), volumePct);
		return;
	}
	const profile = PROFILES.mouse[id as string];
	if (!profile) return;
	const c = ctx();
	const out = volumeOut(c, volumePct);
	renderProfile(c, profile, out);
}

/** Play a custom sound file by its filename. Loads via Tauri IPC. */
async function playCustomSound(filename: string, volumePct: number) {
	const c = ctx();
	try {
		const { invoke } = await import('@tauri-apps/api/core');
		const filePath: string = await invoke('get_custom_sound_path', { filename });
		const response = await fetch(`asset://localhost/${encodeURI(filePath)}`);
		const arrayBuffer = await response.arrayBuffer();
		const audioBuffer = await c.decodeAudioData(arrayBuffer);
		const src = c.createBufferSource();
		src.buffer = audioBuffer;
		const g = c.createGain();
		g.gain.value = clampVolumePct(volumePct) / 100;
		src.connect(g);
		g.connect(c.destination);
		src.start();
	} catch (e) {
		console.error('Failed to play custom sound:', e);
	}
}
