use tauri::{Emitter, Manager};

#[cfg(not(any(target_os = "android", target_os = "ios")))]
mod desktop_audio;

#[cfg(not(any(target_os = "android", target_os = "ios")))]
mod global_listen;

#[cfg(not(any(target_os = "android", target_os = "ios")))]
mod keyboard_group;

mod keyboard_prefs;

#[cfg(target_os = "macos")]
mod macos_access;

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

/// Save an uploaded custom sound file to the app's data directory.
/// Returns the sound id (filename without extension) on success.
#[tauri::command]
fn upload_custom_sound(app: tauri::AppHandle, name: String, data: Vec<u8>) -> Result<String, String> {
    let allowed = [".wav", ".mp3", ".ogg"];
    let lower = name.to_lowercase();
    if !allowed.iter().any(|ext| lower.ends_with(ext)) {
        return Err("Unsupported format. Use WAV, MP3, or OGG.".into());
    }
    if data.len() > 5 * 1024 * 1024 {
        return Err("File too large. Maximum size is 5MB.".into());
    }

    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?.join("custom_sounds");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    let safe_name = name.replace(['/', '\\'], "_").replace("..", "_");
    let path = dir.join(&safe_name);
    std::fs::write(&path, data).map_err(|e| e.to_string())?;

    // Return the id (filename without extension)
    let id = safe_name
        .rsplit_once('.')
        .map(|(stem, _)| stem.to_string())
        .unwrap_or(safe_name);
    Ok(id)
}

/// List all custom sound files in the app's data directory.
#[tauri::command]
fn list_custom_sounds(app: tauri::AppHandle) -> Result<Vec<String>, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?.join("custom_sounds");
    if !dir.exists() {
        return Ok(vec![]);
    }
    let entries = std::fs::read_dir(&dir).map_err(|e| e.to_string())?;
    let mut sounds = vec![];
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.is_file() {
            let name = path.file_name().unwrap().to_string_lossy().to_string();
            let lower = name.to_lowercase();
            if lower.ends_with(".wav") || lower.ends_with(".mp3") || lower.ends_with(".ogg") {
                sounds.push(name);
            }
        }
    }
    sounds.sort();
    Ok(sounds)
}

/// Get the full path to a custom sound file (for loading in the webview).
#[tauri::command]
fn get_custom_sound_path(app: tauri::AppHandle, filename: String) -> Result<String, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?.join("custom_sounds");
    let path = dir.join(&filename);
    if path.exists() {
        Ok(path.to_string_lossy().to_string())
    } else {
        Err(format!("Custom sound not found: {}", filename))
    }
}

/// Delete a custom sound file.
#[tauri::command]
fn delete_custom_sound(app: tauri::AppHandle, filename: String) -> Result<(), String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?.join("custom_sounds");
    let path = dir.join(&filename);
    if path.exists() {
        std::fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Toggle auto-start on login.
#[tauri::command]
fn set_autostart(app: tauri::AppHandle, enabled: bool) {
    use tauri_plugin_autostart::ManagerExt;
    let autostart_manager = app.autolaunch();
    if enabled {
        let _ = autostart_manager.enable();
    } else {
        let _ = autostart_manager.disable();
    }
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
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .invoke_handler(tauri::generate_handler![
            prompt_global_input_access,
            set_sound_prefs,
            set_autostart,
            upload_custom_sound,
            list_custom_sounds,
            delete_custom_sound,
            get_custom_sound_path
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

            // --- System Tray ---
            setup_tray(app)?;

            // Hide window on close instead of quitting
            if let Some(window) = app.get_webview_window("main") {
                let window_clone = window.clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = window_clone.hide();
                    }
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn setup_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri::menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem};
    use tauri::tray::TrayIconBuilder;

    let show_item = MenuItemBuilder::with_id("show", "Show Window").build(app)?;
    let mute_item = MenuItemBuilder::with_id("mute", "Mute").build(app)?;
    let quit_item = MenuItemBuilder::with_id("quit", "Quit").build(app)?;

    let menu = MenuBuilder::new(app)
        .item(&show_item)
        .item(&PredefinedMenuItem::separator(app)?)
        .item(&mute_item)
        .item(&PredefinedMenuItem::separator(app)?)
        .item(&quit_item)
        .build()?;

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .on_menu_event(move |app, event| {
            match event.id().as_ref() {
                "show" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "mute" => {
                    // Toggle mute via a Tauri event to the webview
                    let _ = app.emit("tray-toggle-mute", ());
                }
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let tauri::tray::TrayIconEvent::DoubleClick { .. } = event {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}