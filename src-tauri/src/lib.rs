use std::{path::PathBuf, sync::Mutex};

use game::find_game_path;
use tauri::Manager;
use tauri_plugin_store::StoreExt;

mod app;
mod game;

struct AppState {
  path: Option<PathBuf>,
  install_path: Mutex<Option<PathBuf>>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let game_path = find_game_path();

  tauri::Builder::default()
    .plugin(tauri_plugin_store::Builder::new().build())
    .plugin(tauri_plugin_dialog::init())
    .manage(AppState {
      path: game_path,
      install_path: Mutex::new(None),
    })
    .invoke_handler(tauri::generate_handler![
      game::get_game_path,
      game::get_search_paths_state,
      game::mod_search_paths,
      game::reset_search_paths,
      game::get_install_path,
      game::set_install_path,
      game::list_installed_addons,
      game::list_mounted_addons,
      game::install_addon,
      game::uninstall_addon,
      game::mount_addon,
      game::unmount_addon,
      game::set_deploy_method,
      game::is_symlink_available,
      game::get_deploy_method,
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

      let config_store = app.handle().store_builder(".config").build();

      if let Some(config_install_path) =
        config_store
          .get("install_path")
          .and_then(|s| -> Option<String> {
            let str_val = s.as_str()?;

            Some(str_val.to_string())
          })
      {
        let state = app.state::<AppState>();

        let mut install_path = state.install_path.lock().unwrap();

        *install_path = Some(PathBuf::from(&config_install_path));
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
