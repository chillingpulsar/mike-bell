//! System-wide keyboard and mouse listener.
//! macOS: direct CGEventTap (avoids rdev's TIS crash on modern macOS).
//! Linux/Windows: rdev.

use crate::desktop_audio;

// ---------------------------------------------------------------------------
// macOS – lightweight CGEventTap, no key-name resolution
// ---------------------------------------------------------------------------
#[cfg(target_os = "macos")]
mod platform {
    use super::desktop_audio;
    use std::os::raw::c_void;
    use std::ptr;

    // CGEventType constants
    const LEFT_MOUSE_DOWN: u32 = 1;
    const KEY_DOWN: u32 = 10;

    // CGEventField constants
    const FIELD_KEYCODE: u32 = 9;
    const FIELD_AUTOREPEAT: u32 = 8;

    // CGEventFlags modifier masks
    const FLAG_COMMAND: u64 = 1 << 20;
    const FLAG_CONTROL: u64 = 1 << 18;
    const FLAG_ALT: u64 = 1 << 19;

    // Keycodes we skip
    const TAB: i64 = 48;
    const ESCAPE: i64 = 53;

    // Event mask: only the two event types we care about
    const EVENT_MASK: u64 = (1 << LEFT_MOUSE_DOWN) | (1 << KEY_DOWN);

    type Ptr = *mut c_void;

    type TapCb = unsafe extern "C" fn(Ptr, u32, Ptr, Ptr) -> Ptr;

    #[link(name = "CoreGraphics", kind = "framework")]
    extern "C" {
        fn CGEventTapCreate(
            tap: u32,
            place: u32,
            options: u32,
            mask: u64,
            cb: TapCb,
            info: Ptr,
        ) -> Ptr;
        fn CGEventGetFlags(event: Ptr) -> u64;
        fn CGEventGetIntegerValueField(event: Ptr, field: u32) -> i64;
        fn CGEventTapEnable(tap: Ptr, enable: bool);
    }

    #[link(name = "CoreFoundation", kind = "framework")]
    extern "C" {
        fn CFMachPortCreateRunLoopSource(alloc: Ptr, port: Ptr, order: i64) -> Ptr;
        fn CFRunLoopAddSource(rl: Ptr, source: Ptr, mode: Ptr);
        fn CFRunLoopGetCurrent() -> Ptr;
        fn CFRunLoopRun();
        static kCFRunLoopCommonModes: Ptr;
    }

    unsafe extern "C" fn tap_callback(
        _proxy: Ptr,
        event_type: u32,
        event: Ptr,
        _info: Ptr,
    ) -> Ptr {
        match event_type {
            LEFT_MOUSE_DOWN => {
                desktop_audio::try_play_mouse();
            }
            KEY_DOWN => {
                if CGEventGetIntegerValueField(event, FIELD_AUTOREPEAT) != 0 {
                    return event;
                }
                let keycode = CGEventGetIntegerValueField(event, FIELD_KEYCODE);
                if keycode == TAB || keycode == ESCAPE {
                    return event;
                }
                let flags = CGEventGetFlags(event);
                if flags & (FLAG_COMMAND | FLAG_CONTROL | FLAG_ALT) != 0 {
                    return event;
                }
                desktop_audio::try_play_keyboard();
            }
            _ => {}
        }
        event
    }

    pub fn spawn() {
        std::thread::spawn(|| unsafe {
            // CGEventTapLocation::HID = 0, kCGHeadInsertEventTap = 0, ListenOnly = 1
            let tap = CGEventTapCreate(0, 0, 1, EVENT_MASK, tap_callback, ptr::null_mut());
            if tap.is_null() {
                eprintln!("[mikebell] CGEventTapCreate failed – grant Accessibility + Input Monitoring");
                return;
            }
            let source = CFMachPortCreateRunLoopSource(ptr::null_mut(), tap, 0);
            if source.is_null() {
                eprintln!("[mikebell] CFMachPortCreateRunLoopSource failed");
                return;
            }
            let rl = CFRunLoopGetCurrent();
            CFRunLoopAddSource(rl, source, kCFRunLoopCommonModes);
            CGEventTapEnable(tap, true);
            CFRunLoopRun();
        });
    }
}

// ---------------------------------------------------------------------------
// Linux / Windows – rdev
// ---------------------------------------------------------------------------
#[cfg(not(target_os = "macos"))]
mod platform {
    use super::desktop_audio;
    use rdev::{listen, Button, Event, EventType, Key};
    use std::time::{Duration, Instant};

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
            let skip = matches!(
                (self.last_key, self.last_at),
                (Some(k), Some(t)) if k == key && t.elapsed() < Duration::from_millis(35)
            );
            self.last_key = Some(key);
            self.last_at = Some(now);
            skip
        }
    }

    fn apply_modifier_key(mods: &mut ModifierState, key: Key, down: bool) -> bool {
        match key {
            Key::ControlLeft | Key::ControlRight => { mods.ctrl = down; true }
            Key::MetaLeft | Key::MetaRight => { mods.meta = down; true }
            Key::Alt | Key::AltGr => { mods.alt = down; true }
            Key::ShiftLeft | Key::ShiftRight => true,
            _ => false,
        }
    }

    fn should_play(key: Key, mods: &ModifierState, repeat: &mut RepeatFilter) -> bool {
        if matches!(key, Key::Tab | Key::Escape) { return false; }
        if mods.ctrl || mods.meta || mods.alt { return false; }
        if repeat.should_skip_repeat(key) { return false; }
        true
    }

    pub fn spawn() {
        std::thread::spawn(move || {
            let mut mods = ModifierState::default();
            let mut repeat = RepeatFilter::default();

            if let Err(e) = listen(move |event: Event| {
                match event.event_type {
                    EventType::KeyPress(key) => {
                        if apply_modifier_key(&mut mods, key, true) { return; }
                        if !should_play(key, &mods, &mut repeat) { return; }
                        desktop_audio::try_play_keyboard();
                    }
                    EventType::KeyRelease(key) => {
                        let _ = apply_modifier_key(&mut mods, key, false);
                    }
                    EventType::ButtonPress(Button::Left) => {
                        desktop_audio::try_play_mouse();
                    }
                    _ => {}
                }
            }) {
                eprintln!("[mikebell] global input listener stopped: {e:?}");
            }
        });
    }
}

pub fn spawn() {
    platform::spawn();
}
