use std::sync::Mutex;

use app::commands::AppState;

mod app;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_store::Builder::new().build())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_opener::init())
    .manage(AppState {
      game_path: Mutex::new(None),
    })
    .invoke_handler(tauri::generate_handler![
      app::commands::get_game_path_app,
      app::commands::validate_custom_game_path_app,
      app::commands::revalidate_custom_game_path_app,
      app::commands::set_custom_game_path_app,
      app::commands::get_storage_path_app,
      app::commands::validate_storage_path_app,
      app::commands::set_storage_path_app,
      app::commands::get_deploy_method_app,
      app::commands::validate_deploy_method_app,
      app::commands::set_deploy_method_app,
      app::commands::get_search_paths_state_app,
      app::commands::mod_search_paths_app,
      app::commands::mount_addon_app,
      app::commands::unmount_addon_app,
      app::commands::manage_addon_app,
      app::commands::delete_addon_app,
      app::commands::list_mounted_addons_app,
      app::commands::list_managed_addons_app,
    ])
    .setup(|app| {
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
    .expect("error while running tauri application");
}
