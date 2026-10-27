use tauri::WebviewWindow;

#[tauri::command]
fn minimize_window(window: WebviewWindow) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
fn toggle_maximize(window: WebviewWindow) -> Result<bool, String> {
    let is_max = window.is_maximized().map_err(|e| e.to_string())?;
    if is_max {
        window.unmaximize().map_err(|e| e.to_string())?;
        Ok(false)
    } else {
        window.maximize().map_err(|e| e.to_string())?;
        Ok(true)
    }
}

#[tauri::command]
fn is_window_maximized(window: WebviewWindow) -> Result<bool, String> {
    window.is_maximized().map_err(|e| e.to_string())
}

#[tauri::command]
fn toggle_fullscreen(window: WebviewWindow) -> Result<bool, String> {
    let is_fs = window.is_fullscreen().map_err(|e| e.to_string())?;
    window.set_fullscreen(!is_fs).map_err(|e| e.to_string())?;
    Ok(!is_fs)
}

#[tauri::command]
fn is_window_fullscreen(window: WebviewWindow) -> Result<bool, String> {
    window.is_fullscreen().map_err(|e| e.to_string())
}

#[tauri::command]
fn close_window(window: WebviewWindow) -> Result<(), String> {
    window.close().map_err(|e| e.to_string())
}

#[tauri::command]
fn set_always_on_top(window: WebviewWindow, always_on_top: bool) -> Result<bool, String> {
    window.set_always_on_top(always_on_top).map_err(|e| e.to_string())?;
    Ok(always_on_top)
}

#[tauri::command]
fn set_compact_mode(window: WebviewWindow, compact: bool) -> Result<(), String> {
    if compact {
        let size = tauri::LogicalSize::new(360.0, 620.0);
        window.set_size(tauri::Size::Logical(size)).map_err(|e| e.to_string())?;
    } else {
        let size = tauri::LogicalSize::new(1120.0, 750.0);
        window.set_size(tauri::Size::Logical(size)).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            minimize_window,
            toggle_maximize,
            is_window_maximized,
            toggle_fullscreen,
            is_window_fullscreen,
            close_window,
            set_always_on_top,
            set_compact_mode
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
