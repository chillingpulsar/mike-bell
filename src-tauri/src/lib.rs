#[cfg(not(any(target_os = "android", target_os = "ios")))]
mod global_listen;

#[cfg(target_os = "macos")]
mod macos_access;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
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
        .invoke_handler(tauri::generate_handler![greet, prompt_global_input_access])
        .setup(|app| {
            #[cfg(target_os = "macos")]
            {
                let handle = app.handle().clone();
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(800));
                    let _ = handle.run_on_main_thread(|| {
                        macos_access::request_global_input_permissions();
                    });
                });
            }
            #[cfg(not(any(target_os = "android", target_os = "ios")))]
            global_listen::spawn(app.handle().clone());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
