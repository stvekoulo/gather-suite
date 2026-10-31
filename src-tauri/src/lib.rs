mod mcp;

use tauri::{
  menu::{Menu, MenuItem},
  tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
  AppHandle, Emitter, Manager,
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

fn show_main(app: &AppHandle) {
  if let Some(window) = app.get_webview_window("main") {
    let _ = window.show();
    let _ = window.unminimize();
    let _ = window.set_focus();
  }
}

fn quick_capture(app: &AppHandle) {
  show_main(app);
  let _ = app.emit("quick-capture", ());
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    // Must stay first: a second launch only brings the running window forward.
    .plugin(tauri_plugin_single_instance::init(|app, _, _| show_main(app)))
    .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, None))
    .plugin(
      tauri_plugin_global_shortcut::Builder::new()
        .with_handler(|app, _, event| {
          if event.state() == ShortcutState::Pressed {
            quick_capture(app);
          }
        })
        .build(),
    )
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_process::init())
    .manage(mcp::McpState::default())
    .invoke_handler(tauri::generate_handler![mcp::mcp_start, mcp::mcp_stop, mcp::mcp_respond])
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
      // Another app may own this shortcut: Gather keeps working, only the global trigger is lost.
      let capture = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Space);
      if let Err(error) = app.global_shortcut().register(capture) {
        log::warn!("Raccourci global indisponible : {error}");
      }

      let open = MenuItem::with_id(app, "open", "Ouvrir Gather", true, None::<&str>)?;
      let capture_item = MenuItem::with_id(app, "capture", "Capture rapide", true, None::<&str>)?;
      let quit = MenuItem::with_id(app, "quit", "Quitter", true, None::<&str>)?;
      let menu = Menu::with_items(app, &[&open, &capture_item, &quit])?;
      let mut tray = TrayIconBuilder::new()
        .tooltip("Gather")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
          "open" => show_main(app),
          "capture" => quick_capture(app),
          "quit" => app.exit(0),
          _ => {}
        })
        .on_tray_icon_event(|tray, event| {
          if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event {
            show_main(tray.app_handle());
          }
        });
      if let Some(icon) = app.default_window_icon() {
        tray = tray.icon(icon.clone());
      }
      tray.build(app)?;

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

