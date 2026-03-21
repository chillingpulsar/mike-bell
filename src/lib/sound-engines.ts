/** Procedural UI sounds via Web Audio (works in Tauri webview). */

import type { SoundIds } from "$lib/types";

let audioContext: AudioContext | null = null;

function ctx(): AudioContext {
  if (!audioContext) audioContext = new AudioContext();
  if (audioContext.state === "suspended") void audioContext.resume();
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

function noiseBurst(
  c: AudioContext,
  start: number,
  durationSec: number,
  peakGain: number,
  centerHz: number,
  out: AudioNode,
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
  g.connect(out);
  src.start(start);
  src.stop(start + durationSec + 0.01);
}

/** Classic mechanical-style key: body tone + short filtered click. */
export function playKeyboardClassic(volumePct = 100) {
  const c = ctx();
  const out = volumeOut(c, volumePct);
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(720, t);
  osc.frequency.exponentialRampToValueAtTime(180, t + 0.045);
  og.gain.setValueAtTime(0.22, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  osc.connect(og);
  og.connect(out);
  osc.start(t);
  osc.stop(t + 0.08);
  noiseBurst(c, t, 0.022, 0.09, 2400, out);
}

/** Softer, lower “typewriter” style hit. */
export function playKeyboardSoft(volumePct = 100) {
  const c = ctx();
  const out = volumeOut(c, volumePct);
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(420, t);
  osc.frequency.exponentialRampToValueAtTime(120, t + 0.06);
  og.gain.setValueAtTime(0.18, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  osc.connect(og);
  og.connect(out);
  osc.start(t);
  osc.stop(t + 0.1);
}

/** Crisp mouse button: quick tick + tiny noise. */
export function playMouseClassic(volumePct = 100) {
  const c = ctx();
  const out = volumeOut(c, volumePct);
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
  og.connect(out);
  osc.start(t);
  osc.stop(t + 0.025);
  noiseBurst(c, t, 0.008, 0.045, 3200, out);
}

/** Softer plastic-style click. */
export function playMouseSoft(volumePct = 100) {
  const c = ctx();
  const out = volumeOut(c, volumePct);
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(650, t);
  osc.frequency.exponentialRampToValueAtTime(320, t + 0.02);
  og.gain.setValueAtTime(0.14, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
  osc.connect(og);
  og.connect(out);
  osc.start(t);
  osc.stop(t + 0.05);
}

/** Rising “pop” with a little air — playful key. */
export function playKeyboardBubble(volumePct = 100) {
  const c = ctx();
  const out = volumeOut(c, volumePct);
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(380, t);
  osc.frequency.exponentialRampToValueAtTime(920, t + 0.035);
  og.gain.setValueAtTime(0.2, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);
  osc.connect(og);
  og.connect(out);
  osc.start(t);
  osc.stop(t + 0.06);
  noiseBurst(c, t, 0.012, 0.04, 1800, out);
}

/** Short bubble chirp for clicks. */
export function playMouseBubble(volumePct = 100) {
  const c = ctx();
  const out = volumeOut(c, volumePct);
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(520, t);
  osc.frequency.exponentialRampToValueAtTime(1100, t + 0.022);
  og.gain.setValueAtTime(0.15, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.038);
  osc.connect(og);
  og.connect(out);
  osc.start(t);
  osc.stop(t + 0.04);
  noiseBurst(c, t, 0.006, 0.028, 2200, out);
}

/** Low filtered thump — heavy switch. */
export function playKeyboardVault(volumePct = 100) {
  const c = ctx();
  const out = volumeOut(c, volumePct);
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
  og.connect(out);
  osc.start(t);
  osc.stop(t + 0.13);
  noiseBurst(c, t + 0.003, 0.018, 0.06, 600, out);
}

/** Tight low knock for mouse. */
export function playMouseVault(volumePct = 100) {
  const c = ctx();
  const out = volumeOut(c, volumePct);
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
  og.connect(out);
  osc.start(t);
  osc.stop(t + 0.05);
  noiseBurst(c, t, 0.01, 0.05, 900, out);
}

/** Glassy dual-tone ping. */
export function playKeyboardDew(volumePct = 100) {
  const c = ctx();
  const out = volumeOut(c, volumePct);
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
    og.connect(out);
    osc.start(t);
    osc.stop(t + 0.11);
  }
}

/** Tiny crystalline click. */
export function playMouseDew(volumePct = 100) {
  const c = ctx();
  const out = volumeOut(c, volumePct);
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(1600, t);
  osc.frequency.exponentialRampToValueAtTime(1100, t + 0.018);
  og.gain.setValueAtTime(0.11, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
  osc.connect(og);
  og.connect(out);
  osc.start(t);
  osc.stop(t + 0.05);
  noiseBurst(c, t, 0.006, 0.022, 4500, out);
}

/** Damped thunk — keyboard-sized. */
export function playKeyboardInk(volumePct = 100) {
  const c = ctx();
  const out = volumeOut(c, volumePct);
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(340, t);
  osc.frequency.exponentialRampToValueAtTime(95, t + 0.045);
  og.gain.setValueAtTime(0.15, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
  osc.connect(og);
  og.connect(out);
  osc.start(t);
  osc.stop(t + 0.085);
}

/** Damped thunk for mouse. */
export function playMouseInk(volumePct = 100) {
  const c = ctx();
  const out = volumeOut(c, volumePct);
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(340, t);
  osc.frequency.exponentialRampToValueAtTime(95, t + 0.028);
  og.gain.setValueAtTime(0.16, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);
  osc.connect(og);
  og.connect(out);
  osc.start(t);
  osc.stop(t + 0.06);
}

/** Bright micro-tick for keys. */
export function playKeyboardSpark(volumePct = 100) {
  const c = ctx();
  const out = volumeOut(c, volumePct);
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
  og.connect(out);
  osc.start(t);
  osc.stop(t + 0.028);
  noiseBurst(c, t, 0.007, 0.04, 4200, out);
}

/** Sharp bright click. */
export function playMouseSpark(volumePct = 100) {
  const c = ctx();
  const out = volumeOut(c, volumePct);
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
  og.connect(out);
  osc.start(t);
  osc.stop(t + 0.015);
  noiseBurst(c, t, 0.005, 0.03, 5000, out);
}

/** Very soft rounded key. */
export function playKeyboardVelvet(volumePct = 100) {
  const c = ctx();
  const out = volumeOut(c, volumePct);
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(480, t);
  osc.frequency.linearRampToValueAtTime(360, t + 0.055);
  og.gain.setValueAtTime(0.1, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.085);
  osc.connect(og);
  og.connect(out);
  osc.start(t);
  osc.stop(t + 0.09);
}

/** Ultra-soft bump. */
export function playMouseVelvet(volumePct = 100) {
  const c = ctx();
  const out = volumeOut(c, volumePct);
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(480, t);
  osc.frequency.linearRampToValueAtTime(380, t + 0.045);
  og.gain.setValueAtTime(0.09, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  osc.connect(og);
  og.connect(out);
  osc.start(t);
  osc.stop(t + 0.075);
}

/** Muffled sweater-thock — deep body, barely-there stem. */
export function playKeyboardWool(volumePct = 100) {
  const c = ctx();
  const out = volumeOut(c, volumePct);
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 520;
  lp.Q.value = 0.85;
  osc.type = "triangle";
  osc.frequency.setValueAtTime(228, t);
  osc.frequency.exponentialRampToValueAtTime(118, t + 0.055);
  og.gain.setValueAtTime(0.14, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.095);
  osc.connect(lp);
  lp.connect(og);
  og.connect(out);
  osc.start(t);
  osc.stop(t + 0.1);
  noiseBurst(c, t + 0.004, 0.014, 0.032, 780, out);
}

/** Soft padded micro-thud. */
export function playMouseWool(volumePct = 100) {
  const c = ctx();
  const out = volumeOut(c, volumePct);
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 640;
  osc.type = "triangle";
  osc.frequency.setValueAtTime(310, t);
  osc.frequency.exponentialRampToValueAtTime(165, t + 0.032);
  og.gain.setValueAtTime(0.11, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.058);
  osc.connect(lp);
  lp.connect(og);
  og.connect(out);
  osc.start(t);
  osc.stop(t + 0.062);
  noiseBurst(c, t + 0.002, 0.009, 0.024, 920, out);
}

/** Warm chocolatey down-stroke — cozy café board. */
export function playKeyboardCocoa(volumePct = 100) {
  const c = ctx();
  const out = volumeOut(c, volumePct);
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(480, t);
  lp.frequency.exponentialRampToValueAtTime(160, t + 0.07);
  osc.type = "triangle";
  osc.frequency.setValueAtTime(300, t);
  osc.frequency.exponentialRampToValueAtTime(92, t + 0.048);
  og.gain.setValueAtTime(0.15, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.088);
  osc.connect(lp);
  lp.connect(og);
  og.connect(out);
  osc.start(t);
  osc.stop(t + 0.092);
  noiseBurst(c, t, 0.018, 0.055, 1250, out);
}

export function playMouseCocoa(volumePct = 100) {
  const c = ctx();
  const out = volumeOut(c, volumePct);
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(620, t);
  lp.frequency.exponentialRampToValueAtTime(240, t + 0.038);
  osc.type = "triangle";
  osc.frequency.setValueAtTime(380, t);
  osc.frequency.exponentialRampToValueAtTime(145, t + 0.028);
  og.gain.setValueAtTime(0.13, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.052);
  osc.connect(lp);
  lp.connect(og);
  og.connect(out);
  osc.start(t);
  osc.stop(t + 0.055);
  noiseBurst(c, t, 0.011, 0.042, 1600, out);
}

/** Ultra-gentle rounded pillow-strike. */
export function playKeyboardPlush(volumePct = 100) {
  const c = ctx();
  const out = volumeOut(c, volumePct);
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(395, t);
  osc.frequency.linearRampToValueAtTime(302, t + 0.072);
  og.gain.setValueAtTime(0.085, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
  osc.connect(og);
  og.connect(out);
  osc.start(t);
  osc.stop(t + 0.115);
}

export function playMousePlush(volumePct = 100) {
  const c = ctx();
  const out = volumeOut(c, volumePct);
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(505, t);
  osc.frequency.linearRampToValueAtTime(395, t + 0.048);
  og.gain.setValueAtTime(0.072, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.078);
  osc.connect(og);
  og.connect(out);
  osc.start(t);
  osc.stop(t + 0.082);
}

/** Deep mechanical housing + stem tick — the cozy thock archetype. */
export function playKeyboardThock(volumePct = 100) {
  const c = ctx();
  const out = volumeOut(c, volumePct);
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(168, t);
  osc.frequency.exponentialRampToValueAtTime(58, t + 0.052);
  og.gain.setValueAtTime(0.17, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
  osc.connect(og);
  og.connect(out);
  osc.start(t);
  osc.stop(t + 0.105);
  noiseBurst(c, t + 0.001, 0.021, 0.072, 1580, out);
}

export function playMouseThock(volumePct = 100) {
  const c = ctx();
  const out = volumeOut(c, volumePct);
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(205, t);
  osc.frequency.exponentialRampToValueAtTime(72, t + 0.03);
  og.gain.setValueAtTime(0.15, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.058);
  osc.connect(og);
  og.connect(out);
  osc.start(t);
  osc.stop(t + 0.062);
  noiseBurst(c, t, 0.014, 0.058, 1750, out);
}

/** Silky dual-tone warmth — barely perceptible chorus. */
export function playKeyboardCream(volumePct = 100) {
  const c = ctx();
  const out = volumeOut(c, volumePct);
  const t = c.currentTime;
  for (const hz of [332, 336.5]) {
    const osc = c.createOscillator();
    const og = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(hz, t);
    osc.frequency.exponentialRampToValueAtTime(hz * 0.68, t + 0.042);
    og.gain.setValueAtTime(0.078, t);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.088);
    osc.connect(og);
    og.connect(out);
    osc.start(t);
    osc.stop(t + 0.092);
  }
  noiseBurst(c, t + 0.006, 0.01, 0.038, 2100, out);
}

export function playMouseCream(volumePct = 100) {
  const c = ctx();
  const out = volumeOut(c, volumePct);
  const t = c.currentTime;
  for (const hz of [588, 593]) {
    const osc = c.createOscillator();
    const og = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(hz, t);
    osc.frequency.exponentialRampToValueAtTime(hz * 0.75, t + 0.022);
    og.gain.setValueAtTime(0.065, t);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.048);
    osc.connect(og);
    og.connect(out);
    osc.start(t);
    osc.stop(t + 0.052);
  }
  noiseBurst(c, t + 0.003, 0.006, 0.028, 2600, out);
}

/** Textured cozy click — soft body + fabric-y noise. */
export function playKeyboardFlannel(volumePct = 100) {
  const c = ctx();
  const out = volumeOut(c, volumePct);
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = 1400;
  f.Q.value = 0.9;
  osc.type = "triangle";
  osc.frequency.setValueAtTime(360, t);
  osc.frequency.exponentialRampToValueAtTime(155, t + 0.04);
  og.gain.setValueAtTime(0.12, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.075);
  osc.connect(f);
  f.connect(og);
  og.connect(out);
  osc.start(t);
  osc.stop(t + 0.08);
  noiseBurst(c, t, 0.016, 0.048, 950, out);
}

export function playMouseFlannel(volumePct = 100) {
  const c = ctx();
  const out = volumeOut(c, volumePct);
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = 1900;
  f.Q.value = 1.0;
  osc.type = "triangle";
  osc.frequency.setValueAtTime(455, t);
  osc.frequency.exponentialRampToValueAtTime(220, t + 0.024);
  og.gain.setValueAtTime(0.1, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
  osc.connect(f);
  f.connect(og);
  og.connect(out);
  osc.start(t);
  osc.stop(t + 0.048);
  noiseBurst(c, t, 0.01, 0.036, 1300, out);
}

/** Warm hearth glow — fundamental + soft second partial. */
export function playKeyboardEmber(volumePct = 100) {
  const c = ctx();
  const out = volumeOut(c, volumePct);
  const t = c.currentTime;
  const root = c.createOscillator();
  const rg = c.createGain();
  root.type = "sine";
  root.frequency.setValueAtTime(275, t);
  root.frequency.exponentialRampToValueAtTime(118, t + 0.05);
  rg.gain.setValueAtTime(0.13, t);
  rg.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  root.connect(rg);
  rg.connect(out);
  root.start(t);
  root.stop(t + 0.095);
  const harm = c.createOscillator();
  const hg = c.createGain();
  harm.type = "sine";
  harm.frequency.setValueAtTime(550, t);
  harm.frequency.exponentialRampToValueAtTime(236, t + 0.04);
  hg.gain.setValueAtTime(0.035, t);
  hg.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);
  harm.connect(hg);
  hg.connect(out);
  harm.start(t);
  harm.stop(t + 0.06);
  noiseBurst(c, t + 0.002, 0.012, 0.04, 1400, out);
}

export function playMouseEmber(volumePct = 100) {
  const c = ctx();
  const out = volumeOut(c, volumePct);
  const t = c.currentTime;
  const root = c.createOscillator();
  const rg = c.createGain();
  root.type = "sine";
  root.frequency.setValueAtTime(410, t);
  root.frequency.exponentialRampToValueAtTime(195, t + 0.028);
  rg.gain.setValueAtTime(0.1, t);
  rg.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  root.connect(rg);
  rg.connect(out);
  root.start(t);
  root.stop(t + 0.055);
  const harm = c.createOscillator();
  const hg = c.createGain();
  harm.type = "sine";
  harm.frequency.setValueAtTime(820, t);
  harm.frequency.exponentialRampToValueAtTime(390, t + 0.022);
  hg.gain.setValueAtTime(0.028, t);
  hg.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
  harm.connect(hg);
  hg.connect(out);
  harm.start(t);
  harm.stop(t + 0.045);
  noiseBurst(c, t, 0.008, 0.032, 2000, out);
}

/** Slow-viscous rounded attack — like thick syrup. */
export function playKeyboardHoney(volumePct = 100) {
  const c = ctx();
  const out = volumeOut(c, volumePct);
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(455, t);
  osc.frequency.linearRampToValueAtTime(268, t + 0.065);
  og.gain.setValueAtTime(0.11, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
  osc.connect(og);
  og.connect(out);
  osc.start(t);
  osc.stop(t + 0.105);
  noiseBurst(c, t + 0.008, 0.011, 0.034, 1650, out);
}

export function playMouseHoney(volumePct = 100) {
  const c = ctx();
  const out = volumeOut(c, volumePct);
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(685, t);
  osc.frequency.linearRampToValueAtTime(455, t + 0.038);
  og.gain.setValueAtTime(0.09, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.062);
  osc.connect(og);
  og.connect(out);
  osc.start(t);
  osc.stop(t + 0.066);
  noiseBurst(c, t + 0.004, 0.007, 0.026, 2400, out);
}

/** Luxurious soft strike with a hint of sparkle. */
export function playKeyboardCashmere(volumePct = 100) {
  const c = ctx();
  const out = volumeOut(c, volumePct);
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(545, t);
  osc.frequency.exponentialRampToValueAtTime(368, t + 0.038);
  og.gain.setValueAtTime(0.1, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.078);
  osc.connect(og);
  og.connect(out);
  osc.start(t);
  osc.stop(t + 0.082);
  noiseBurst(c, t, 0.006, 0.026, 3400, out);
}

export function playMouseCashmere(volumePct = 100) {
  const c = ctx();
  const out = volumeOut(c, volumePct);
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(885, t);
  osc.frequency.exponentialRampToValueAtTime(615, t + 0.02);
  og.gain.setValueAtTime(0.088, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.048);
  osc.connect(og);
  og.connect(out);
  osc.start(t);
  osc.stop(t + 0.052);
  noiseBurst(c, t, 0.0045, 0.022, 4100, out);
}

/** Earthy damped forest-floor thud. */
export function playKeyboardMoss(volumePct = 100) {
  const c = ctx();
  const out = volumeOut(c, volumePct);
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(340, t);
  lp.frequency.exponentialRampToValueAtTime(95, t + 0.085);
  osc.type = "triangle";
  osc.frequency.setValueAtTime(215, t);
  osc.frequency.exponentialRampToValueAtTime(78, t + 0.046);
  og.gain.setValueAtTime(0.14, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
  osc.connect(lp);
  lp.connect(og);
  og.connect(out);
  osc.start(t);
  osc.stop(t + 0.115);
  noiseBurst(c, t + 0.003, 0.017, 0.052, 620, out);
}

export function playMouseMoss(volumePct = 100) {
  const c = ctx();
  const out = volumeOut(c, volumePct);
  const t = c.currentTime;
  const osc = c.createOscillator();
  const og = c.createGain();
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(420, t);
  lp.frequency.exponentialRampToValueAtTime(155, t + 0.042);
  osc.type = "triangle";
  osc.frequency.setValueAtTime(275, t);
  osc.frequency.exponentialRampToValueAtTime(105, t + 0.028);
  og.gain.setValueAtTime(0.12, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);
  osc.connect(lp);
  lp.connect(og);
  og.connect(out);
  osc.start(t);
  osc.stop(t + 0.058);
  noiseBurst(c, t + 0.001, 0.012, 0.044, 880, out);
}

export function playKeyboard(id: SoundIds, volumePct = 100) {
  if (id === "off") return;
  switch (id) {
    case "classic":
      playKeyboardClassic(volumePct);
      break;
    case "soft":
      playKeyboardSoft(volumePct);
      break;
    case "bubble":
      playKeyboardBubble(volumePct);
      break;
    case "vault":
      playKeyboardVault(volumePct);
      break;
    case "dew":
      playKeyboardDew(volumePct);
      break;
    case "ink":
      playKeyboardInk(volumePct);
      break;
    case "spark":
      playKeyboardSpark(volumePct);
      break;
    case "velvet":
      playKeyboardVelvet(volumePct);
      break;
    case "wool":
      playKeyboardWool(volumePct);
      break;
    case "cocoa":
      playKeyboardCocoa(volumePct);
      break;
    case "plush":
      playKeyboardPlush(volumePct);
      break;
    case "thock":
      playKeyboardThock(volumePct);
      break;
    case "cream":
      playKeyboardCream(volumePct);
      break;
    case "flannel":
      playKeyboardFlannel(volumePct);
      break;
    case "ember":
      playKeyboardEmber(volumePct);
      break;
    case "honey":
      playKeyboardHoney(volumePct);
      break;
    case "cashmere":
      playKeyboardCashmere(volumePct);
      break;
    case "moss":
      playKeyboardMoss(volumePct);
      break;
  }
}

export function playMouse(id: SoundIds, volumePct = 100) {
  if (id === "off") return;
  switch (id) {
    case "classic":
      playMouseClassic(volumePct);
      break;
    case "soft":
      playMouseSoft(volumePct);
      break;
    case "bubble":
      playMouseBubble(volumePct);
      break;
    case "vault":
      playMouseVault(volumePct);
      break;
    case "dew":
      playMouseDew(volumePct);
      break;
    case "ink":
      playMouseInk(volumePct);
      break;
    case "spark":
      playMouseSpark(volumePct);
      break;
    case "velvet":
      playMouseVelvet(volumePct);
      break;
    case "wool":
      playMouseWool(volumePct);
      break;
    case "cocoa":
      playMouseCocoa(volumePct);
      break;
    case "plush":
      playMousePlush(volumePct);
      break;
    case "thock":
      playMouseThock(volumePct);
      break;
    case "cream":
      playMouseCream(volumePct);
      break;
    case "flannel":
      playMouseFlannel(volumePct);
      break;
    case "ember":
      playMouseEmber(volumePct);
      break;
    case "honey":
      playMouseHoney(volumePct);
      break;
    case "cashmere":
      playMouseCashmere(volumePct);
      break;
    case "moss":
      playMouseMoss(volumePct);
      break;
  }
}
