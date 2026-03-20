//! System-wide keyboard and mouse hooks so sounds still play when the webview is unfocused.
//! macOS: grant Accessibility (and Input Monitoring if macOS prompts) for this process.

use rdev::{listen, Button, Event, EventType, Key};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};

#[derive(Default)]
struct ModifierState {
    ctrl: bool,
    meta: bool,
    alt: bool,
}

#[derive(Default)]
struct RepeatFilter {
    last_key: Option<Key>,
    last_at: Option<Instant>,
}

impl RepeatFilter {
    fn should_skip_repeat(&mut self, key: Key) -> bool {
        let now = Instant::now();
        let skip = matches!((self.last_key, self.last_at), (Some(k), Some(t)) if k == key && t.elapsed() < Duration::from_millis(35));
        self.last_key = Some(key);
        self.last_at = Some(now);
        skip
    }
}

/// Returns true when this event is a modifier key; updates `mods` on press/release.
fn apply_modifier_key(mods: &mut ModifierState, key: Key, down: bool) -> bool {
    match key {
        Key::ControlLeft | Key::ControlRight => {
            mods.ctrl = down;
            true
        }
        Key::MetaLeft | Key::MetaRight => {
            mods.meta = down;
            true
        }
        Key::Alt | Key::AltGr => {
            mods.alt = down;
            true
        }
        Key::ShiftLeft | Key::ShiftRight => true,
        _ => false,
    }
}

fn should_play_keyboard(key: Key, mods: &ModifierState, repeat: &mut RepeatFilter) -> bool {
    if matches!(key, Key::Tab | Key::Escape) {
        return false;
    }
    if mods.ctrl || mods.meta || mods.alt {
        return false;
    }
    if repeat.should_skip_repeat(key) {
        return false;
    }
    true
}

pub fn spawn(app: AppHandle) {
    std::thread::spawn(move || {
        let mut mods = ModifierState::default();
        let mut repeat = RepeatFilter::default();

        if let Err(e) = listen(move |event: Event| {
            match event.event_type {
                EventType::KeyPress(key) => {
                    if apply_modifier_key(&mut mods, key, true) {
                        return;
                    }
                    if !should_play_keyboard(key, &mods, &mut repeat) {
                        return;
                    }
                    let _ = app.emit("mikebell-keyboard", ());
                }
                EventType::KeyRelease(key) => {
                    let _ = apply_modifier_key(&mut mods, key, false);
                }
                EventType::ButtonPress(Button::Left) => {
                    let _ = app.emit("mikebell-mouse", ());
                }
                _ => {}
            }
        }) {
            eprintln!("[mikebell] global input listener stopped: {e:?}");
        }
    });
}
