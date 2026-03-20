//! Native output via CPAL/rodio so UI sounds play while another app is focused.
//! Web Audio in the WKWebView is often suspended when the window is not key.

use rodio::source::{SineWave, Source};
use rodio::{OutputStream, Sink};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Mutex, OnceLock};
use std::time::Duration;

enum PlayCmd {
    Mouse(String),
    Keyboard(String),
}

static PREFS: Mutex<(String, String)> = Mutex::new((String::new(), String::new()));

static INIT_DONE: AtomicBool = AtomicBool::new(false);

static TX: OnceLock<std::sync::mpsc::SyncSender<PlayCmd>> = OnceLock::new();

/// Call once from `setup` after the app can spawn threads.
pub fn init() {
    if INIT_DONE.swap(true, Ordering::SeqCst) {
        return;
    }

    let (tx, rx) = std::sync::mpsc::sync_channel::<PlayCmd>(64);
    let _ = TX.set(tx);

    std::thread::spawn(move || {
        let Ok((_stream, handle)) = OutputStream::try_default() else {
            eprintln!("[mikebell] desktop_audio: no default output device");
            return;
        };

        while let Ok(cmd) = rx.recv() {
            let Ok(sink) = Sink::try_new(&handle) else {
                continue;
            };
            match cmd {
                PlayCmd::Mouse(id) => append_mouse(&sink, &id),
                PlayCmd::Keyboard(id) => append_keyboard(&sink, &id),
            }
            sink.detach();
        }
    });
}

pub fn set_sound_prefs(keyboard: String, mouse: String) {
    let mut g = PREFS.lock().unwrap();
    *g = (keyboard, mouse);
}

fn prefs_snapshot() -> (String, String) {
    PREFS.lock().unwrap().clone()
}

pub fn try_play_mouse() {
    let Some(tx) = TX.get() else {
        return;
    };
    let (_, m) = prefs_snapshot();
    if m.is_empty() || m == "off" {
        return;
    }
    let _ = tx.try_send(PlayCmd::Mouse(m));
}

pub fn try_play_keyboard() {
    let Some(tx) = TX.get() else {
        return;
    };
    let (k, _) = prefs_snapshot();
    if k.is_empty() || k == "off" {
        return;
    }
    let _ = tx.try_send(PlayCmd::Keyboard(k));
}

fn append_mouse(sink: &Sink, id: &str) {
    match id {
        "classic" => {
            sink.append(
                SineWave::new(1400.0)
                    .take_duration(Duration::from_millis(18))
                    .amplify(0.12),
            );
        }
        "soft" => {
            sink.append(
                SineWave::new(650.0)
                    .take_duration(Duration::from_millis(40))
                    .amplify(0.18),
            );
        }
        "bubble" => {
            sink.append(
                SineWave::new(700.0)
                    .take_duration(Duration::from_millis(35))
                    .amplify(0.16),
            );
        }
        "vault" => {
            sink.append(
                SineWave::new(130.0)
                    .take_duration(Duration::from_millis(45))
                    .amplify(0.2),
            );
        }
        "dew" => {
            sink.append(
                SineWave::new(1600.0)
                    .take_duration(Duration::from_millis(45))
                    .amplify(0.14),
            );
        }
        "ink" => {
            sink.append(
                SineWave::new(340.0)
                    .take_duration(Duration::from_millis(55))
                    .amplify(0.18),
            );
        }
        "spark" => {
            sink.append(
                SineWave::new(2200.0)
                    .take_duration(Duration::from_millis(14))
                    .amplify(0.08),
            );
        }
        "velvet" => {
            sink.append(
                SineWave::new(480.0)
                    .take_duration(Duration::from_millis(70))
                    .amplify(0.1),
            );
        }
        _ => {}
    }
}

fn append_keyboard(sink: &Sink, id: &str) {
    match id {
        "classic" => {
            sink.append(
                SineWave::new(520.0)
                    .take_duration(Duration::from_millis(70))
                    .amplify(0.2),
            );
        }
        "soft" => {
            sink.append(
                SineWave::new(420.0)
                    .take_duration(Duration::from_millis(90))
                    .amplify(0.16),
            );
        }
        "bubble" => {
            sink.append(
                SineWave::new(620.0)
                    .take_duration(Duration::from_millis(55))
                    .amplify(0.18),
            );
        }
        "vault" => {
            sink.append(
                SineWave::new(120.0)
                    .take_duration(Duration::from_millis(120))
                    .amplify(0.14),
            );
        }
        "dew" => {
            sink.append(
                SineWave::new(880.0)
                    .take_duration(Duration::from_millis(100))
                    .amplify(0.1),
            );
        }
        "ink" => {
            sink.append(
                SineWave::new(340.0)
                    .take_duration(Duration::from_millis(85))
                    .amplify(0.15),
            );
        }
        "spark" => {
            sink.append(
                SineWave::new(1800.0)
                    .take_duration(Duration::from_millis(22))
                    .amplify(0.07),
            );
        }
        "velvet" => {
            sink.append(
                SineWave::new(480.0)
                    .take_duration(Duration::from_millis(85))
                    .amplify(0.1),
            );
        }
        _ => {}
    }
}
