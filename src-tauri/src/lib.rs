use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_sql::Builder::default().build())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_notification::init())
    .setup(|app| {
      // Use physical pixels here so display scaling cannot leave the initial
      // window larger than the available desktop on small/high-DPI monitors.
      if let Some(window) = app.get_webview_window("main") {
        if let Some(monitor) = window.current_monitor()? {
          let area = monitor.work_area();
          let size = window.outer_size()?;
          if size.width > area.size.width || size.height > area.size.height {
            window.set_size(tauri::PhysicalSize::new(
              size.width.min(area.size.width),
              size.height.min(area.size.height),
            ))?;
            window.set_position(area.position)?;
          }
        }
      }
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}

