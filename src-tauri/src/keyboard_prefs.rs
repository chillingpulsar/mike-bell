//! Keyboard group prefs synced from the webview (see `src/lib/keyboard-groups.ts`).

use serde::Deserialize;

#[derive(Deserialize, Clone)]
pub struct KeyboardSoundBinding {
    pub sound: String,
    pub volume: f32,
}

#[derive(Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct KeyboardGroupsPayload {
    pub letters: KeyboardSoundBinding,
    pub numbers: KeyboardSoundBinding,
    pub function_keys: KeyboardSoundBinding,
    pub modifiers: KeyboardSoundBinding,
    pub space_enter: KeyboardSoundBinding,
    pub tab_escape: KeyboardSoundBinding,
    pub navigation: KeyboardSoundBinding,
    pub punctuation: KeyboardSoundBinding,
}

impl KeyboardGroupsPayload {
    pub const fn default_off() -> Self {
        Self {
            letters: KeyboardSoundBinding {
                sound: String::new(),
                volume: 80.0,
            },
            numbers: KeyboardSoundBinding {
                sound: String::new(),
                volume: 80.0,
            },
            function_keys: KeyboardSoundBinding {
                sound: String::new(),
                volume: 80.0,
            },
            modifiers: KeyboardSoundBinding {
                sound: String::new(),
                volume: 80.0,
            },
            space_enter: KeyboardSoundBinding {
                sound: String::new(),
                volume: 80.0,
            },
            tab_escape: KeyboardSoundBinding {
                sound: String::new(),
                volume: 80.0,
            },
            navigation: KeyboardSoundBinding {
                sound: String::new(),
                volume: 80.0,
            },
            punctuation: KeyboardSoundBinding {
                sound: String::new(),
                volume: 80.0,
            },
        }
    }
}
