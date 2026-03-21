//! Native procedural audio matching the Web Audio synthesis in sound-engines.ts.
//! Uses sample-level generation: oscillators with frequency sweeps, gain envelopes,
//! filtered noise bursts, and biquad filters — played through rodio/CPAL so sound
//! continues when the WKWebView is not key.

use rodio::buffer::SamplesBuffer;
use rodio::{OutputStream, Sink};
use std::sync::atomic::{AtomicU32, AtomicBool, Ordering};
use std::sync::{Mutex, OnceLock};

// ── Channel / thread infrastructure ──────────────────────────────────────────

enum PlayCmd { Mouse(String, f32), Keyboard(String, f32) }

static PREFS: Mutex<(String, String, f32, f32)> =
    Mutex::new((String::new(), String::new(), 100.0, 100.0));
static INIT_DONE: AtomicBool = AtomicBool::new(false);
static TX: OnceLock<std::sync::mpsc::SyncSender<PlayCmd>> = OnceLock::new();

pub fn init() {
    if INIT_DONE.swap(true, Ordering::SeqCst) { return; }

    let (tx, rx) = std::sync::mpsc::sync_channel::<PlayCmd>(64);
    let _ = TX.set(tx);

    std::thread::spawn(move || {
        let Ok((_stream, handle)) = OutputStream::try_default() else {
            eprintln!("[mikebell] desktop_audio: no default output device");
            return;
        };
        while let Ok(cmd) = rx.recv() {
            let samples = match &cmd {
                PlayCmd::Mouse(id, vol) => build_mouse(id, *vol),
                PlayCmd::Keyboard(id, vol) => build_keyboard(id, *vol),
            };
            if let Some(buf) = samples {
                if let Ok(sink) = Sink::try_new(&handle) {
                    sink.append(buf);
                    sink.detach();
                }
            }
        }
    });
}

pub fn set_sound_prefs(keyboard: String, mouse: String, keyboard_volume: f32, mouse_volume: f32) {
    *PREFS.lock().unwrap() = (keyboard, mouse, keyboard_volume, mouse_volume);
}

fn prefs() -> (String, String, f32, f32) { PREFS.lock().unwrap().clone() }

pub fn try_play_mouse() {
    let Some(tx) = TX.get() else { return };
    let (_, m, _, mv) = prefs();
    if m.is_empty() || m == "off" { return; }
    let _ = tx.try_send(PlayCmd::Mouse(m, mv));
}

pub fn try_play_keyboard() {
    let Some(tx) = TX.get() else { return };
    let (k, _, kv, _) = prefs();
    if k.is_empty() || k == "off" { return; }
    let _ = tx.try_send(PlayCmd::Keyboard(k, kv));
}

// ── Synthesis primitives ─────────────────────────────────────────────────────

const SR: f32 = 44100.0;
const TAU: f32 = std::f32::consts::TAU;
static NOISE_CTR: AtomicU32 = AtomicU32::new(12345);

type WaveFn = fn(f32) -> f32;

fn wave_sine(p: f32) -> f32     { (p * TAU).sin() }
fn wave_triangle(p: f32) -> f32 { 4.0 * (p - (p + 0.5).floor()).abs() - 1.0 }
fn wave_square(p: f32) -> f32   { if p < 0.5 { 1.0 } else { -1.0 } }
fn wave_saw(p: f32) -> f32      { 2.0 * p - 1.0 }

/// Oscillator with frequency sweep and exponential gain envelope.
///   sweep: true = exponential, false = linear
///   freq ramps over `ramp_s`, then holds `end_hz`.
///   gain decays from `peak` → ~0 over `env_s`.
fn osc(
    w: WaveFn, start_hz: f32, end_hz: f32, ramp_s: f32, sweep_exp: bool,
    dur_s: f32, peak: f32, env_s: f32,
) -> Vec<f32> {
    let n = (dur_s * SR) as usize;
    let ramp_n = (ramp_s * SR).max(1.0) as usize;
    let env_n = (env_s * SR).max(1.0) as usize;
    let mut out = vec![0.0f32; n];
    let mut phase: f32 = 0.0;
    for i in 0..n {
        let freq = if i < ramp_n {
            let t = i as f32 / ramp_n as f32;
            if sweep_exp { start_hz * (end_hz / start_hz).powf(t) }
            else { start_hz + (end_hz - start_hz) * t }
        } else { end_hz };
        phase += freq / SR;
        phase -= phase.floor();
        let g = if i < env_n { peak * (0.0001f32 / peak).powf(i as f32 / env_n as f32) } else { 0.0 };
        out[i] = w(phase) * g;
    }
    out
}

/// White noise with exponential decay, bandpass-filtered, with gain envelope.
fn noise(dur_s: f32, peak: f32, center_hz: f32) -> Vec<f32> {
    let n = (dur_s * SR) as usize;
    let decay = (n as f32 * 0.12).max(1.0);
    let mut seed = NOISE_CTR.fetch_add(1, Ordering::Relaxed).wrapping_mul(2654435761);
    let mut buf = Vec::with_capacity(n);
    for i in 0..n {
        seed ^= seed << 13; seed ^= seed >> 17; seed ^= seed << 5;
        let r = (seed as f32 / u32::MAX as f32) * 2.0 - 1.0;
        buf.push(r * (-(i as f32) / decay).exp());
    }
    bp(&mut buf, center_hz, 0.7);
    for i in 0..n {
        buf[i] *= peak * (0.0001f32 / peak).powf(i as f32 / n as f32);
    }
    buf
}

// ── Biquad filters (Audio EQ Cookbook) ────────────────────────────────────────

fn biquad(buf: &mut [f32], b0: f32, b1: f32, b2: f32, a1: f32, a2: f32) {
    let (mut x1, mut x2, mut y1, mut y2) = (0.0f32, 0.0f32, 0.0f32, 0.0f32);
    for s in buf.iter_mut() {
        let x0 = *s;
        let y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
        x2 = x1; x1 = x0; y2 = y1; y1 = y0;
        *s = y0;
    }
}

fn bp(buf: &mut [f32], freq: f32, q: f32) {
    let w = TAU * freq / SR;
    let a = w.sin() / (2.0 * q);
    let c = w.cos();
    let a0 = 1.0 + a;
    biquad(buf, a / a0, 0.0, -a / a0, -2.0 * c / a0, (1.0 - a) / a0);
}

fn lp(buf: &mut [f32], freq: f32, q: f32) {
    let w = TAU * freq / SR;
    let a = w.sin() / (2.0 * q);
    let c = w.cos();
    let a0 = 1.0 + a;
    let half = (1.0 - c) / 2.0;
    biquad(buf, half / a0, (1.0 - c) / a0, half / a0, -2.0 * c / a0, (1.0 - a) / a0);
}

fn lp_sweep(buf: &mut [f32], start_hz: f32, end_hz: f32, ramp_s: f32, q: f32) {
    let chunk = 64;
    let (mut x1, mut x2, mut y1, mut y2) = (0.0f32, 0.0f32, 0.0f32, 0.0f32);
    for cs in (0..buf.len()).step_by(chunk) {
        let ce = (cs + chunk).min(buf.len());
        let t = (cs as f32 / SR / ramp_s).min(1.0);
        let f = start_hz * (end_hz / start_hz).powf(t);
        let w = TAU * f / SR;
        let a = w.sin() / (2.0 * q);
        let c = w.cos();
        let a0 = 1.0 + a;
        let (b0, b1, b2) = ((1.0 - c) / 2.0 / a0, (1.0 - c) / a0, (1.0 - c) / 2.0 / a0);
        let (na1, na2) = (-2.0 * c / a0, (1.0 - a) / a0);
        for i in cs..ce {
            let x0 = buf[i];
            let y0 = b0 * x0 + b1 * x1 + b2 * x2 - na1 * y1 - na2 * y2;
            x2 = x1; x1 = x0; y2 = y1; y1 = y0;
            buf[i] = y0;
        }
    }
}

// ── Mix helpers ──────────────────────────────────────────────────────────────

fn mix(a: &[f32], b: &[f32]) -> Vec<f32> {
    let n = a.len().max(b.len());
    let mut o = vec![0.0f32; n];
    for (i, &v) in a.iter().enumerate() { o[i] += v; }
    for (i, &v) in b.iter().enumerate() { o[i] += v; }
    o
}

fn mix_at(a: &[f32], b: &[f32], offset_s: f32) -> Vec<f32> {
    let off = (offset_s * SR) as usize;
    let n = a.len().max(b.len() + off);
    let mut o = vec![0.0f32; n];
    for (i, &v) in a.iter().enumerate() { o[i] += v; }
    for (i, &v) in b.iter().enumerate() { if i + off < n { o[i + off] += v; } }
    o
}

fn source(samples: Vec<f32>) -> SamplesBuffer<f32> {
    SamplesBuffer::new(1, SR as u32, samples)
}

fn apply_volume(mut samples: Vec<f32>, volume_pct: f32) -> Vec<f32> {
    let g = (volume_pct / 100.0).clamp(0.0, 1.0);
    if g < 1.0 {
        for s in &mut samples {
            *s *= g;
        }
    }
    samples
}

// ── Keyboard sound profiles ─────────────────────────────────────────────────

fn kb_classic() -> Vec<f32> {
    let tone = osc(wave_triangle, 720.0, 180.0, 0.045, true, 0.08, 0.22, 0.07);
    mix(&tone, &noise(0.022, 0.09, 2400.0))
}

fn kb_soft() -> Vec<f32> {
    osc(wave_sine, 420.0, 120.0, 0.06, true, 0.1, 0.18, 0.09)
}

fn kb_bubble() -> Vec<f32> {
    let tone = osc(wave_sine, 380.0, 920.0, 0.035, true, 0.06, 0.2, 0.055);
    mix(&tone, &noise(0.012, 0.04, 1800.0))
}

fn kb_vault() -> Vec<f32> {
    let mut tone = osc(wave_saw, 95.0, 45.0, 0.05, true, 0.13, 0.12, 0.12);
    lp_sweep(&mut tone, 420.0, 120.0, 0.08, 1.0);
    mix_at(&tone, &noise(0.018, 0.06, 600.0), 0.003)
}

fn kb_dew() -> Vec<f32> {
    let a = osc(wave_sine, 880.0, 880.0 * 0.72, 0.04, true, 0.11, 0.09, 0.1);
    let b = osc(wave_sine, 883.0, 883.0 * 0.72, 0.04, true, 0.11, 0.09, 0.1);
    mix(&a, &b)
}

fn kb_ink() -> Vec<f32> {
    osc(wave_triangle, 340.0, 95.0, 0.045, true, 0.085, 0.15, 0.08)
}

fn kb_spark() -> Vec<f32> {
    let mut tone = osc(wave_square, 1800.0, 1800.0, 0.028, true, 0.028, 0.045, 0.022);
    bp(&mut tone, 3800.0, 1.1);
    mix(&tone, &noise(0.007, 0.04, 4200.0))
}

fn kb_velvet() -> Vec<f32> {
    osc(wave_sine, 480.0, 360.0, 0.055, false, 0.09, 0.1, 0.085)
}

fn kb_wool() -> Vec<f32> {
    let mut tone = osc(wave_triangle, 228.0, 118.0, 0.055, true, 0.1, 0.14, 0.095);
    lp(&mut tone, 520.0, 0.85);
    mix_at(&tone, &noise(0.014, 0.032, 780.0), 0.004)
}

fn kb_cocoa() -> Vec<f32> {
    let mut tone = osc(wave_triangle, 300.0, 92.0, 0.048, true, 0.092, 0.15, 0.088);
    lp_sweep(&mut tone, 480.0, 160.0, 0.07, 1.0);
    mix(&tone, &noise(0.018, 0.055, 1250.0))
}

fn kb_plush() -> Vec<f32> {
    osc(wave_sine, 395.0, 302.0, 0.072, false, 0.115, 0.085, 0.11)
}

fn kb_thock() -> Vec<f32> {
    let tone = osc(wave_triangle, 168.0, 58.0, 0.052, true, 0.105, 0.17, 0.1);
    mix_at(&tone, &noise(0.021, 0.072, 1580.0), 0.001)
}

fn kb_cream() -> Vec<f32> {
    let a = osc(wave_sine, 332.0, 332.0 * 0.68, 0.042, true, 0.092, 0.078, 0.088);
    let b = osc(wave_sine, 336.5, 336.5 * 0.68, 0.042, true, 0.092, 0.078, 0.088);
    let body = mix(&a, &b);
    mix_at(&body, &noise(0.01, 0.038, 2100.0), 0.006)
}

fn kb_flannel() -> Vec<f32> {
    let mut tone = osc(wave_triangle, 360.0, 155.0, 0.04, true, 0.08, 0.12, 0.075);
    bp(&mut tone, 1400.0, 0.9);
    mix(&tone, &noise(0.016, 0.048, 950.0))
}

fn kb_ember() -> Vec<f32> {
    let root = osc(wave_sine, 275.0, 118.0, 0.05, true, 0.095, 0.13, 0.09);
    let harm = osc(wave_sine, 550.0, 236.0, 0.04, true, 0.06, 0.035, 0.055);
    let body = mix(&root, &harm);
    mix_at(&body, &noise(0.012, 0.04, 1400.0), 0.002)
}

fn kb_honey() -> Vec<f32> {
    let tone = osc(wave_sine, 455.0, 268.0, 0.065, false, 0.105, 0.11, 0.1);
    mix_at(&tone, &noise(0.011, 0.034, 1650.0), 0.008)
}

fn kb_cashmere() -> Vec<f32> {
    let tone = osc(wave_sine, 545.0, 368.0, 0.038, true, 0.082, 0.1, 0.078);
    mix(&tone, &noise(0.006, 0.026, 3400.0))
}

fn kb_moss() -> Vec<f32> {
    let mut tone = osc(wave_triangle, 215.0, 78.0, 0.046, true, 0.115, 0.14, 0.11);
    lp_sweep(&mut tone, 340.0, 95.0, 0.085, 1.0);
    mix_at(&tone, &noise(0.017, 0.052, 620.0), 0.003)
}

// ── Mouse sound profiles ────────────────────────────────────────────────────

fn ms_classic() -> Vec<f32> {
    let mut tone = osc(wave_square, 1400.0, 1400.0, 0.025, true, 0.025, 0.06, 0.018);
    lp(&mut tone, 4800.0, 1.0);
    mix(&tone, &noise(0.008, 0.045, 3200.0))
}

fn ms_soft() -> Vec<f32> {
    osc(wave_sine, 650.0, 320.0, 0.02, true, 0.05, 0.14, 0.04)
}

fn ms_bubble() -> Vec<f32> {
    let tone = osc(wave_sine, 520.0, 1100.0, 0.022, true, 0.04, 0.15, 0.038);
    mix(&tone, &noise(0.006, 0.028, 2200.0))
}

fn ms_vault() -> Vec<f32> {
    let mut tone = osc(wave_triangle, 130.0, 55.0, 0.024, true, 0.05, 0.14, 0.045);
    lp(&mut tone, 380.0, 1.0);
    mix(&tone, &noise(0.01, 0.05, 900.0))
}

fn ms_dew() -> Vec<f32> {
    let tone = osc(wave_sine, 1600.0, 1100.0, 0.018, true, 0.05, 0.11, 0.045);
    mix(&tone, &noise(0.006, 0.022, 4500.0))
}

fn ms_ink() -> Vec<f32> {
    osc(wave_triangle, 340.0, 95.0, 0.028, true, 0.06, 0.16, 0.055)
}

fn ms_spark() -> Vec<f32> {
    let mut tone = osc(wave_square, 2200.0, 2200.0, 0.015, true, 0.015, 0.035, 0.012);
    bp(&mut tone, 4200.0, 1.2);
    mix(&tone, &noise(0.005, 0.03, 5000.0))
}

fn ms_velvet() -> Vec<f32> {
    osc(wave_sine, 480.0, 380.0, 0.045, false, 0.075, 0.09, 0.07)
}

fn ms_wool() -> Vec<f32> {
    let mut tone = osc(wave_triangle, 310.0, 165.0, 0.032, true, 0.062, 0.11, 0.058);
    lp(&mut tone, 640.0, 1.0);
    mix_at(&tone, &noise(0.009, 0.024, 920.0), 0.002)
}

fn ms_cocoa() -> Vec<f32> {
    let mut tone = osc(wave_triangle, 380.0, 145.0, 0.028, true, 0.055, 0.13, 0.052);
    lp_sweep(&mut tone, 620.0, 240.0, 0.038, 1.0);
    mix(&tone, &noise(0.011, 0.042, 1600.0))
}

fn ms_plush() -> Vec<f32> {
    osc(wave_sine, 505.0, 395.0, 0.048, false, 0.082, 0.072, 0.078)
}

fn ms_thock() -> Vec<f32> {
    let tone = osc(wave_triangle, 205.0, 72.0, 0.03, true, 0.062, 0.15, 0.058);
    mix(&tone, &noise(0.014, 0.058, 1750.0))
}

fn ms_cream() -> Vec<f32> {
    let a = osc(wave_sine, 588.0, 588.0 * 0.75, 0.022, true, 0.052, 0.065, 0.048);
    let b = osc(wave_sine, 593.0, 593.0 * 0.75, 0.022, true, 0.052, 0.065, 0.048);
    let body = mix(&a, &b);
    mix_at(&body, &noise(0.006, 0.028, 2600.0), 0.003)
}

fn ms_flannel() -> Vec<f32> {
    let mut tone = osc(wave_triangle, 455.0, 220.0, 0.024, true, 0.048, 0.1, 0.045);
    bp(&mut tone, 1900.0, 1.0);
    mix(&tone, &noise(0.01, 0.036, 1300.0))
}

fn ms_ember() -> Vec<f32> {
    let root = osc(wave_sine, 410.0, 195.0, 0.028, true, 0.055, 0.1, 0.05);
    let harm = osc(wave_sine, 820.0, 390.0, 0.022, true, 0.045, 0.028, 0.04);
    let body = mix(&root, &harm);
    mix_at(&body, &noise(0.008, 0.032, 2000.0), 0.0)
}

fn ms_honey() -> Vec<f32> {
    let tone = osc(wave_sine, 685.0, 455.0, 0.038, false, 0.066, 0.09, 0.062);
    mix_at(&tone, &noise(0.007, 0.026, 2400.0), 0.004)
}

fn ms_cashmere() -> Vec<f32> {
    let tone = osc(wave_sine, 885.0, 615.0, 0.02, true, 0.052, 0.088, 0.048);
    mix(&tone, &noise(0.0045, 0.022, 4100.0))
}

fn ms_moss() -> Vec<f32> {
    let mut tone = osc(wave_triangle, 275.0, 105.0, 0.028, true, 0.058, 0.12, 0.055);
    lp_sweep(&mut tone, 420.0, 155.0, 0.042, 1.0);
    mix_at(&tone, &noise(0.012, 0.044, 880.0), 0.001)
}

// ── Dispatchers ──────────────────────────────────────────────────────────────

fn build_keyboard(id: &str, volume_pct: f32) -> Option<SamplesBuffer<f32>> {
    let s = match id {
        "classic" => kb_classic(),
        "soft"    => kb_soft(),
        "bubble"  => kb_bubble(),
        "vault"   => kb_vault(),
        "dew"     => kb_dew(),
        "ink"     => kb_ink(),
        "spark"   => kb_spark(),
        "velvet"  => kb_velvet(),
        "wool"     => kb_wool(),
        "cocoa"    => kb_cocoa(),
        "plush"    => kb_plush(),
        "thock"    => kb_thock(),
        "cream"    => kb_cream(),
        "flannel"  => kb_flannel(),
        "ember"    => kb_ember(),
        "honey"    => kb_honey(),
        "cashmere" => kb_cashmere(),
        "moss"     => kb_moss(),
        _ => return None,
    };
    Some(source(apply_volume(s, volume_pct)))
}

fn build_mouse(id: &str, volume_pct: f32) -> Option<SamplesBuffer<f32>> {
    let s = match id {
        "classic" => ms_classic(),
        "soft"    => ms_soft(),
        "bubble"  => ms_bubble(),
        "vault"   => ms_vault(),
        "dew"     => ms_dew(),
        "ink"     => ms_ink(),
        "spark"   => ms_spark(),
        "velvet"  => ms_velvet(),
        "wool"     => ms_wool(),
        "cocoa"    => ms_cocoa(),
        "plush"    => ms_plush(),
        "thock"    => ms_thock(),
        "cream"    => ms_cream(),
        "flannel"  => ms_flannel(),
        "ember"    => ms_ember(),
        "honey"    => ms_honey(),
        "cashmere" => ms_cashmere(),
        "moss"     => ms_moss(),
        _ => return None,
    };
    Some(source(apply_volume(s, volume_pct)))
}
