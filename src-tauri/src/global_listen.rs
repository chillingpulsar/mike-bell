//! System-wide keyboard and mouse listener.
//! macOS: direct CGEventTap (avoids rdev's TIS crash on modern macOS).
//! Linux/Windows: rdev.

// ---------------------------------------------------------------------------
// macOS – lightweight CGEventTap, no key-name resolution
// ---------------------------------------------------------------------------
#[cfg(target_os = "macos")]
mod platform {
    use crate::desktop_audio;
    use crate::keyboard_group;
    use std::os::raw::c_void;
    use std::ptr;

    // CGEventType constants
    const LEFT_MOUSE_DOWN: u32 = 1;
    const RIGHT_MOUSE_DOWN: u32 = 3;
    const KEY_DOWN: u32 = 10;

    // CGEventField constants
    const FIELD_KEYCODE: u32 = 9;
    const FIELD_AUTOREPEAT: u32 = 8;

    // CGEventFlags modifier masks
    const FLAG_COMMAND: u64 = 1 << 20;
    const FLAG_CONTROL: u64 = 1 << 18;
    const FLAG_ALT: u64 = 1 << 19;

    // Event mask: mouse buttons + key down
    const EVENT_MASK: u64 =
        (1 << LEFT_MOUSE_DOWN) | (1 << RIGHT_MOUSE_DOWN) | (1 << KEY_DOWN);

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
                desktop_audio::try_play_mouse(desktop_audio::MouseSide::Left);
            }
            RIGHT_MOUSE_DOWN => {
                desktop_audio::try_play_mouse(desktop_audio::MouseSide::Right);
            }
            KEY_DOWN => {
                if CGEventGetIntegerValueField(event, FIELD_AUTOREPEAT) != 0 {
                    return event;
                }
                let keycode = CGEventGetIntegerValueField(event, FIELD_KEYCODE);
                let group = keyboard_group::from_mac_keycode(keycode);
                let flags = CGEventGetFlags(event);
                if group != keyboard_group::KeyboardGroup::Modifiers
                    && flags & (FLAG_COMMAND | FLAG_CONTROL | FLAG_ALT) != 0
                {
                    return event;
                }
                desktop_audio::try_play_keyboard(group);
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
    use crate::desktop_audio;
    use crate::keyboard_group;
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

    fn apply_modifier_key(mods: &mut ModifierState, key: Key, down: bool) {
        match key {
            Key::ControlLeft | Key::ControlRight => mods.ctrl = down,
            Key::MetaLeft | Key::MetaRight => mods.meta = down,
            Key::Alt | Key::AltGr => mods.alt = down,
            Key::ShiftLeft | Key::ShiftRight => {}
            _ => {}
        }
    }

    fn should_play(key: Key, mods: &ModifierState, repeat: &mut RepeatFilter) -> bool {
        if repeat.should_skip_repeat(key) {
            return false;
        }
        let group = keyboard_group::from_rdev_key(key);
        if group != keyboard_group::KeyboardGroup::Modifiers && (mods.ctrl || mods.meta || mods.alt)
        {
            return false;
        }
        true
    }

    pub fn spawn() {
        std::thread::spawn(move || {
            let mut mods = ModifierState::default();
            let mut repeat = RepeatFilter::default();

            if let Err(e) = listen(move |event: Event| {
                match event.event_type {
                    EventType::KeyPress(key) => {
                        apply_modifier_key(&mut mods, key, true);
                        if !should_play(key, &mods, &mut repeat) {
                            return;
                        }
                        desktop_audio::try_play_keyboard(keyboard_group::from_rdev_key(key));
                    }
                    EventType::KeyRelease(key) => {
                        apply_modifier_key(&mut mods, key, false);
                    }
                    EventType::ButtonPress(Button::Left) => {
                        desktop_audio::try_play_mouse(desktop_audio::MouseSide::Left);
                    }
                    EventType::ButtonPress(Button::Right) => {
                        desktop_audio::try_play_mouse(desktop_audio::MouseSide::Right);
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
