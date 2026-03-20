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

/** Rising “pop” with a little air — playful key. */
export function playKeyboardBubble() {
  const c = ctx();
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(380, t);
  osc.frequency.exponentialRampToValueAtTime(920, t + 0.035);
  og.gain.setValueAtTime(0.2, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);
  osc.connect(og);
  og.connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.06);
  noiseBurst(c, t, 0.012, 0.04, 1800);
}

/** Short bubble chirp for clicks. */
export function playMouseBubble() {
  const c = ctx();
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(520, t);
  osc.frequency.exponentialRampToValueAtTime(1100, t + 0.022);
  og.gain.setValueAtTime(0.15, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.038);
  osc.connect(og);
  og.connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.04);
  noiseBurst(c, t, 0.006, 0.028, 2200);
}

/** Low filtered thump — heavy switch. */
export function playKeyboardVault() {
  const c = ctx();
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(95, t);
  osc.frequency.exponentialRampToValueAtTime(45, t + 0.05);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(420, t);
  lp.frequency.exponentialRampToValueAtTime(120, t + 0.08);
  osc.connect(lp);
  lp.connect(og);
  og.gain.setValueAtTime(0.12, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  osc.start(t);
  osc.stop(t + 0.13);
  noiseBurst(c, t + 0.003, 0.018, 0.06, 600);
}

/** Tight low knock for mouse. */
export function playMouseVault() {
  const c = ctx();
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(130, t);
  osc.frequency.exponentialRampToValueAtTime(55, t + 0.024);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 380;
  osc.connect(lp);
  lp.connect(og);
  og.gain.setValueAtTime(0.14, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
  osc.start(t);
  osc.stop(t + 0.05);
  noiseBurst(c, t, 0.01, 0.05, 900);
}

/** Glassy dual-tone ping. */
export function playKeyboardDew() {
  const c = ctx();
  const t = c.currentTime;
  for (const hz of [880, 883]) {
    const osc = c.createOscillator();
    const og = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(hz, t);
    osc.frequency.exponentialRampToValueAtTime(hz * 0.72, t + 0.04);
    og.gain.setValueAtTime(0.09, t);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    osc.connect(og);
    og.connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.11);
  }
}

/** Tiny crystalline click. */
export function playMouseDew() {
  const c = ctx();
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(1600, t);
  osc.frequency.exponentialRampToValueAtTime(1100, t + 0.018);
  og.gain.setValueAtTime(0.11, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
  osc.connect(og);
  og.connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.05);
  noiseBurst(c, t, 0.006, 0.022, 4500);
}

/** Damped thunk — keyboard-sized. */
export function playKeyboardInk() {
  const c = ctx();
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(340, t);
  osc.frequency.exponentialRampToValueAtTime(95, t + 0.045);
  og.gain.setValueAtTime(0.15, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
  osc.connect(og);
  og.connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.085);
}

/** Damped thunk for mouse. */
export function playMouseInk() {
  const c = ctx();
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(340, t);
  osc.frequency.exponentialRampToValueAtTime(95, t + 0.028);
  og.gain.setValueAtTime(0.16, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);
  osc.connect(og);
  og.connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.06);
}

/** Bright micro-tick for keys. */
export function playKeyboardSpark() {
  const c = ctx();
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(1800, t);
  og.gain.setValueAtTime(0.045, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.022);
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = 3800;
  f.Q.value = 1.1;
  osc.connect(f);
  f.connect(og);
  og.connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.028);
  noiseBurst(c, t, 0.007, 0.04, 4200);
}

/** Sharp bright click. */
export function playMouseSpark() {
  const c = ctx();
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(2200, t);
  og.gain.setValueAtTime(0.035, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.012);
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = 4200;
  f.Q.value = 1.2;
  osc.connect(f);
  f.connect(og);
  og.connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.015);
  noiseBurst(c, t, 0.005, 0.03, 5000);
}

/** Very soft rounded key. */
export function playKeyboardVelvet() {
  const c = ctx();
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(480, t);
  osc.frequency.linearRampToValueAtTime(360, t + 0.055);
  og.gain.setValueAtTime(0.1, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.085);
  osc.connect(og);
  og.connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.09);
}

/** Ultra-soft bump. */
export function playMouseVelvet() {
  const c = ctx();
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(480, t);
  osc.frequency.linearRampToValueAtTime(380, t + 0.045);
  og.gain.setValueAtTime(0.09, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  osc.connect(og);
  og.connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.075);
}

export function playKeyboard(id: SoundIds) {
  if (id === "off") return;
  switch (id) {
    case "classic":
      playKeyboardClassic();
      break;
    case "soft":
      playKeyboardSoft();
      break;
    case "bubble":
      playKeyboardBubble();
      break;
    case "vault":
      playKeyboardVault();
      break;
    case "dew":
      playKeyboardDew();
      break;
    case "ink":
      playKeyboardInk();
      break;
    case "spark":
      playKeyboardSpark();
      break;
    case "velvet":
      playKeyboardVelvet();
      break;
  }
}

export function playMouse(id: SoundIds) {
  if (id === "off") return;
  switch (id) {
    case "classic":
      playMouseClassic();
      break;
    case "soft":
      playMouseSoft();
      break;
    case "bubble":
      playMouseBubble();
      break;
    case "vault":
      playMouseVault();
      break;
    case "dew":
      playMouseDew();
      break;
    case "ink":
      playMouseInk();
      break;
    case "spark":
      playMouseSpark();
      break;
    case "velvet":
      playMouseVelvet();
      break;
  }
}
