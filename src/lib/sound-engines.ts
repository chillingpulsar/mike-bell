/** Procedural UI sounds via Web Audio (works in Tauri webview). */

import type { SoundIds } from "$lib/types";

let audioContext: AudioContext | null = null;

function ctx(): AudioContext {
  if (!audioContext) audioContext = new AudioContext();
  if (audioContext.state === "suspended") void audioContext.resume();
  return audioContext;
}

function noiseBurst(
  c: AudioContext,
  start: number,
  durationSec: number,
  peakGain: number,
  centerHz: number,
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
  bp.type = "bandpass";
  bp.frequency.value = centerHz;
  bp.Q.value = 0.7;
  const g = c.createGain();
  g.gain.setValueAtTime(peakGain, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + durationSec);
  src.connect(bp);
  bp.connect(g);
  g.connect(c.destination);
  src.start(start);
  src.stop(start + durationSec + 0.01);
}

/** Classic mechanical-style key: body tone + short filtered click. */
export function playKeyboardClassic() {
  const c = ctx();
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(720, t);
  osc.frequency.exponentialRampToValueAtTime(180, t + 0.045);
  og.gain.setValueAtTime(0.22, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  osc.connect(og);
  og.connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.08);
  noiseBurst(c, t, 0.022, 0.09, 2400);
}

/** Softer, lower “typewriter” style hit. */
export function playKeyboardSoft() {
  const c = ctx();
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(420, t);
  osc.frequency.exponentialRampToValueAtTime(120, t + 0.06);
  og.gain.setValueAtTime(0.18, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  osc.connect(og);
  og.connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.1);
}

/** Crisp mouse button: quick tick + tiny noise. */
export function playMouseClassic() {
  const c = ctx();
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(1400, t);
  og.gain.setValueAtTime(0.06, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.018);
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 4800;
  osc.connect(filter);
  filter.connect(og);
  og.connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.025);
  noiseBurst(c, t, 0.008, 0.045, 3200);
}

/** Softer plastic-style click. */
export function playMouseSoft() {
  const c = ctx();
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(650, t);
  osc.frequency.exponentialRampToValueAtTime(320, t + 0.02);
  og.gain.setValueAtTime(0.14, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
  osc.connect(og);
  og.connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.05);
}

export function playKeyboard(id: SoundIds) {
  if (id === "off") return;
  if (id === "classic") playKeyboardClassic();
  else playKeyboardSoft();
}

export function playMouse(id: SoundIds) {
  if (id === "off") return;
  if (id === "classic") playMouseClassic();
  else playMouseSoft();
}
