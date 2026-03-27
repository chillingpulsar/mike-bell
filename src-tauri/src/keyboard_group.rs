//! Physical-key → sound group (matches `src/lib/keyboard-groups.ts`).

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum KeyboardGroup {
    Letters,
    Numbers,
    FunctionKeys,
    Modifiers,
    SpaceEnter,
    TabEscape,
    Navigation,
    Punctuation,
}

// ── macOS virtual keycodes (Carbon `Events.h` / kVK_*) ───────────────────────

/// Map a `kVK_*` code from `CGEventGetIntegerValueField(..., kCGKeyboardEventKeycode)`.
pub fn from_mac_keycode(k: i64) -> KeyboardGroup {
    match k {
        // Letters (ANSI positions — same physical keys as `KeyA`…`KeyZ` in the web API)
        0x00 | 0x01 | 0x02 | 0x03 | 0x04 | 0x05 | 0x06 | 0x07 | 0x08 | 0x09 | 0x0B | 0x0C
        | 0x0D | 0x0E | 0x0F | 0x10 | 0x11 | 0x1F | 0x20 | 0x22 | 0x23 | 0x25 | 0x26 | 0x28
        | 0x2D | 0x2E => KeyboardGroup::Letters,

        // Top-row digits
        0x12 | 0x13 | 0x14 | 0x15 | 0x16 | 0x17 | 0x19 | 0x1A | 0x1C | 0x1D => {
            KeyboardGroup::Numbers
        }

        // Keypad digits & decimal
        0x41 | 0x52 | 0x53 | 0x54 | 0x55 | 0x56 | 0x57 | 0x58 | 0x59 | 0x5B | 0x5C => {
            KeyboardGroup::Numbers
        }

        // Function keys (incl. F17–F20 where present)
        0x7A | 0x78 | 0x63 | 0x76 | 0x60 | 0x61 | 0x62 | 0x64 | 0x65 | 0x6D | 0x67 | 0x6F
        | 0x69 | 0x6B | 0x71 | 0x6A | 0x40 | 0x4F | 0x50 | 0x5A => KeyboardGroup::FunctionKeys,

        // Modifiers
        0x37 | 0x36 | 0x38 | 0x3C | 0x3A | 0x3D | 0x3B | 0x3E | 0x39 | 0x3F => {
            KeyboardGroup::Modifiers
        }

        // Space, Return, keypad Enter
        0x24 | 0x31 | 0x4C => KeyboardGroup::SpaceEnter,

        // Tab, Escape
        0x30 | 0x35 => KeyboardGroup::TabEscape,

        // Navigation & editing
        0x73 | 0x77 | 0x74 | 0x79 | 0x7B | 0x7C | 0x7D | 0x7E | 0x75 | 0x33 | 0x72 => {
            KeyboardGroup::Navigation
        }

        // Keypad operators (not digits) — same bucket as punctuation in TS
        0x43 | 0x45 | 0x47 | 0x4B | 0x4E | 0x51 => KeyboardGroup::Punctuation,

        // ISO/JIS extras, media keys, unknown → safe default
        _ => KeyboardGroup::Punctuation,
    }
}

/// rdev `Key` → group (Linux / Windows global hook). Not built on macOS (no `rdev` dep).
#[cfg(not(target_os = "macos"))]
pub fn from_rdev_key(key: rdev::Key) -> KeyboardGroup {
    match key {
        Key::KeyA
        | Key::KeyB
        | Key::KeyC
        | Key::KeyD
        | Key::KeyE
        | Key::KeyF
        | Key::KeyG
        | Key::KeyH
        | Key::KeyI
        | Key::KeyJ
        | Key::KeyK
        | Key::KeyL
        | Key::KeyM
        | Key::KeyN
        | Key::KeyO
        | Key::KeyP
        | Key::KeyQ
        | Key::KeyR
        | Key::KeyS
        | Key::KeyT
        | Key::KeyU
        | Key::KeyV
        | Key::KeyW
        | Key::KeyX
        | Key::KeyY
        | Key::KeyZ => KeyboardGroup::Letters,

        Key::Num0
        | Key::Num1
        | Key::Num2
        | Key::Num3
        | Key::Num4
        | Key::Num5
        | Key::Num6
        | Key::Num7
        | Key::Num8
        | Key::Num9
        | Key::Kp0
        | Key::Kp1
        | Key::Kp2
        | Key::Kp3
        | Key::Kp4
        | Key::Kp5
        | Key::Kp6
        | Key::Kp7
        | Key::Kp8
        | Key::Kp9
        | Key::KpDelete => KeyboardGroup::Numbers,

        Key::F1
        | Key::F2
        | Key::F3
        | Key::F4
        | Key::F5
        | Key::F6
        | Key::F7
        | Key::F8
        | Key::F9
        | Key::F10
        | Key::F11
        | Key::F12 => KeyboardGroup::FunctionKeys,

        Key::Alt
        | Key::AltGr
        | Key::ControlLeft
        | Key::ControlRight
        | Key::MetaLeft
        | Key::MetaRight
        | Key::ShiftLeft
        | Key::ShiftRight
        | Key::CapsLock
        | Key::Function => KeyboardGroup::Modifiers,

        Key::Space | Key::Return | Key::KpReturn => KeyboardGroup::SpaceEnter,

        Key::Tab | Key::Escape => KeyboardGroup::TabEscape,

        Key::Backspace
        | Key::Delete
        | Key::DownArrow
        | Key::End
        | Key::Home
        | Key::LeftArrow
        | Key::PageDown
        | Key::PageUp
        | Key::RightArrow
        | Key::UpArrow
        | Key::Insert => KeyboardGroup::Navigation,

        Key::BackQuote
        | Key::Minus
        | Key::Equal
        | Key::LeftBracket
        | Key::RightBracket
        | Key::SemiColon
        | Key::Quote
        | Key::BackSlash
        | Key::IntlBackslash
        | Key::Comma
        | Key::Dot
        | Key::Slash
        | Key::KpMinus
        | Key::KpPlus
        | Key::KpMultiply
        | Key::KpDivide
        | Key::PrintScreen
        | Key::ScrollLock
        | Key::Pause
        | Key::NumLock
        | Key::Unknown(_) => KeyboardGroup::Punctuation,
    }
}
