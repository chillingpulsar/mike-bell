#[cfg(not(any(target_os = "android", target_os = "ios")))]
mod desktop_audio;

#[cfg(not(any(target_os = "android", target_os = "ios")))]
mod global_listen;

#[cfg(not(any(target_os = "android", target_os = "ios")))]
mod keyboard_group;

mod keyboard_prefs;

#[cfg(target_os = "macos")]
mod macos_access;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Sync sound selections from the webview into the native audio + hook layer.
#[cfg(not(any(target_os = "android", target_os = "ios")))]
#[tauri::command]
fn set_sound_prefs(
    keyboard_groups: keyboard_prefs::KeyboardGroupsPayload,
    mouse_left: String,
    mouse_right: String,
    mouse_left_volume: f32,
    mouse_right_volume: f32,
) {
    desktop_audio::set_sound_prefs(
        keyboard_groups,
        mouse_left,
        mouse_right,
        mouse_left_volume,
        mouse_right_volume,
    );
}

#[cfg(any(target_os = "android", target_os = "ios"))]
#[tauri::command]
fn set_sound_prefs(
    _keyboard_groups: keyboard_prefs::KeyboardGroupsPayload,
    _mouse_left: String,
    _mouse_right: String,
    _mouse_left_volume: f32,
    _mouse_right_volume: f32,
) {
}

/// Re-show macOS Accessibility / Input Monitoring prompts (no-op on other OS).
/// Must run on the main thread; `invoke` may call from a worker, so we always dispatch.
#[tauri::command]
fn prompt_global_input_access(app: tauri::AppHandle) {
    #[cfg(target_os = "macos")]
    {
        let _ = app.run_on_main_thread(|| {
            macos_access::request_global_input_permissions();
        });
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            prompt_global_input_access,
            set_sound_prefs
        ])
        .setup(|app| {
            #[cfg(not(any(target_os = "android", target_os = "ios")))]
            desktop_audio::init();
            // macOS: prompt for Accessibility + Input Monitoring on the main thread *before* starting
            // the CGEventTap listener. Starting rdev first often yields a tap that only sees
            // in-app events until the user toggles permissions and restarts.
            #[cfg(target_os = "macos")]
            {
                let main_scheduler = app.handle().clone();
                let _ = main_scheduler.run_on_main_thread(move || {
                    macos_access::request_global_input_permissions();
                    std::thread::spawn(move || {
                        std::thread::sleep(std::time::Duration::from_millis(500));
                        global_listen::spawn();
                    });
                });
            }
            #[cfg(all(
                not(target_os = "macos"),
                not(any(target_os = "android", target_os = "ios"))
            ))]
            global_listen::spawn();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
