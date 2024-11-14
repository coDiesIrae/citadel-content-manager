use serde::{ser, Deserialize, Serialize};
use serde_json::json;
use std::os::windows::fs::FileTypeExt;
use std::path::PathBuf;
use std::{io, path::Path};
use steamlocate::SteamDir;
use tauri::{AppHandle, State};
use tauri_plugin_store::StoreExt;

use crate::AppState;

static GAME_ID: u32 = 1422450;

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq)]
pub enum DeployMethod {
  Copy,
  Symlink,
}

#[derive(Debug)]
pub enum SearchPathsError {
  CouldNotReadGameInfo(io::Error),
  CouldNotWriteGameInfo(io::Error),
  DeserializationError(Box<keyvalues_serde::error::Error>),
  SerializationError(Box<keyvalues_serde::error::Error>),
  NoGamePath,
}

#[derive(Debug, Serialize)]
pub enum SearchPathsState {
  Vanilla,
  Modded,
  Custom,
}

#[derive(Debug)]
pub enum AddonError {
  NoInstallPath,
  NoGamePath,
  CouldNotCreateAddonFolder(io::Error),
  CouldNotReadInstallFolder(io::Error),
  CouldNotReadAddonFolder(io::Error),
  CouldNotWriteAddonFolder(io::Error),
  CouldNotWriteInstallFolder(io::Error),
  InvalidAddonFile,
  AddonIsNotInstalled,
  AddonAlreadyMounted,
  AddonIsNotMounted,
  CannotDeleteMountedAddon,
}

impl Serialize for SearchPathsError {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: ser::Serializer,
  {
    match self {
      SearchPathsError::CouldNotReadGameInfo(e) => {
        serializer.serialize_str(&format!("Could not read gameinfo.gi: {}", e))
      }
      SearchPathsError::CouldNotWriteGameInfo(e) => {
        serializer.serialize_str(&format!("Could not write gameinfo.gi: {}", e))
      }
      SearchPathsError::DeserializationError(e) => {
        serializer.serialize_str(&format!("Deserialization error: {}", e))
      }
      SearchPathsError::SerializationError(e) => {
        serializer.serialize_str(&format!("Serialization error: {}", e))
      }
      SearchPathsError::NoGamePath => serializer.serialize_str("Game path not found"),
    }
  }
}

impl Serialize for AddonError {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: ser::Serializer,
  {
    match self {
      AddonError::CouldNotCreateAddonFolder(e) => {
        serializer.serialize_str(&format!("Could not create addons folder: {}", e))
      }
      AddonError::NoInstallPath => serializer.serialize_str("Storage path not found"),
      AddonError::NoGamePath => serializer.serialize_str("Game path not found"),
      AddonError::CouldNotReadInstallFolder(e) => {
        serializer.serialize_str(&format!("Could not read storage path: {}", e))
      }
      AddonError::CouldNotReadAddonFolder(e) => {
        serializer.serialize_str(&format!("Could not read addons folder: {}", e))
      }
      AddonError::CouldNotWriteAddonFolder(e) => {
        serializer.serialize_str(&format!("Could not write addons folder: {}", e))
      }
      AddonError::CouldNotWriteInstallFolder(e) => {
        serializer.serialize_str(&format!("Could not write storage folder: {}", e))
      }
      AddonError::InvalidAddonFile => serializer.serialize_str("Invalid addon file"),
      AddonError::AddonIsNotInstalled => serializer.serialize_str("Addon is not stored"),
      AddonError::AddonAlreadyMounted => serializer.serialize_str("Addon is already installed"),
      AddonError::AddonIsNotMounted => serializer.serialize_str("Addon is not installed"),
      AddonError::CannotDeleteMountedAddon => {
        serializer.serialize_str("Cannot delete installed addon")
      }
    }
  }
}

#[derive(Debug, Deserialize, Serialize)]
struct SearchPaths {
  #[serde(rename = "Game")]
  game: Vec<String>,
  #[serde(rename = "Mod")]
  mod_key: Option<String>,
  #[serde(rename = "Write")]
  write: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct InstallAddonInfo {
  #[serde(rename = "filePath")]
  file_path: String,
  #[serde(rename = "fileName")]
  file_name: Option<String>,
  #[serde(rename = "displayName")]
  display_name: Option<String>,
}

fn read_search_paths(path: &Path) -> Result<SearchPaths, SearchPathsError> {
  let game_info_path = path.join("game/citadel/gameinfo.gi");

  let content =
    std::fs::read_to_string(game_info_path).map_err(SearchPathsError::CouldNotReadGameInfo)?;

  let lines = content.lines().collect::<Vec<_>>();

  let mut search_paths = vec![];

  for i in 0..lines.len() {
    let line = lines[i];

    if line.contains("SearchPaths") {
      search_paths.push(i);

      let mut j = i + 1;
      loop {
        search_paths.push(j);

        if lines[j].contains("}") {
          break;
        }

        j += 1;
      }
    }
  }

  let search_paths = search_paths
    .iter()
    .map(|&i| lines[i])
    .collect::<Vec<_>>()
    .join("\n");

  let search_paths = keyvalues_serde::from_str::<SearchPaths>(&search_paths)
    .map_err(|e| SearchPathsError::DeserializationError(Box::new(e)))?;

  Ok(search_paths)
}

fn write_search_paths(path: &Path, search_paths: &SearchPaths) -> Result<(), SearchPathsError> {
  let game_info_path = path.join("game/citadel/gameinfo.gi");

  let content =
    std::fs::read_to_string(&game_info_path).map_err(SearchPathsError::CouldNotReadGameInfo)?;

  let lines = content.lines().collect::<Vec<_>>();

  let mut search_paths_lines = vec![];

  let mut tab_level = 0;

  for i in 0..lines.len() {
    let line = lines[i];

    if line.contains("SearchPaths") {
      search_paths_lines.push(i);

      tab_level = line.chars().take_while(|&c| c == '\t').count();

      let mut j = i + 1;
      loop {
        search_paths_lines.push(j);

        if lines[j].contains("}") {
          break;
        }

        j += 1;
      }
    }
  }

  let new_search_paths = keyvalues_serde::to_string(search_paths)
    .map_err(|e| SearchPathsError::SerializationError(Box::new(e)))?
    .replace('\"', "")
    .split('\n')
    .map(|line| {
      let tabs = "\t".repeat(tab_level);
      format!("{}{}", tabs, line)
    })
    .collect::<Vec<_>>()
    .join("\n");

  let mut new_lines = vec![];

  for (i, line) in lines.iter().enumerate() {
    if i == search_paths_lines[0] {
      new_lines.push(new_search_paths.as_str());
    } else if !search_paths_lines.contains(&i) {
      new_lines.push(line);
    }
  }

  let new_content = new_lines.join("\n");

  std::fs::write(&game_info_path, new_content).map_err(SearchPathsError::CouldNotWriteGameInfo)?;

  Ok(())
}

pub fn find_game_path() -> Option<PathBuf> {
  let mut steam_dir = SteamDir::locate()?;

  let game_dir = steam_dir.app(&GAME_ID)?.to_owned();

  Some(game_dir.path)
}

pub fn create_addons_folder_if_not_exists(path: &Path) -> Result<PathBuf, io::Error> {
  let addons_path = path.join("game/citadel/addons");

  if !addons_path.exists() {
    std::fs::create_dir_all(&addons_path)?;
  }

  Ok(addons_path)
}

#[tauri::command]
pub fn get_game_path(state: State<AppState>) -> Option<PathBuf> {
  state.path.clone()
}

#[tauri::command]
pub fn get_search_paths_state(
  state: State<AppState>,
) -> Result<SearchPathsState, SearchPathsError> {
  let path = state.path.as_ref().ok_or(SearchPathsError::NoGamePath)?;

  let search_paths = read_search_paths(path)?;

  match (
    search_paths.mod_key,
    search_paths.write,
    search_paths.game.len(),
  ) {
    (None, None, 2) => {
      if search_paths.game[0] == "citadel" && search_paths.game[1] == "core" {
        return Ok(SearchPathsState::Vanilla);
      }
    }
    (Some(mod_key), Some(write), 3) => {
      if search_paths.game[0] == "citadel/addons"
        && search_paths.game[1] == "citadel"
        && search_paths.game[2] == "core"
        && mod_key == "citadel"
        && write == "citadel"
      {
        return Ok(SearchPathsState::Modded);
      }
    }
    _ => {}
  };

  Ok(SearchPathsState::Custom)
}

#[tauri::command]
pub fn mod_search_paths(state: State<AppState>) -> Result<(), SearchPathsError> {
  let path = state.path.as_ref().ok_or(SearchPathsError::NoGamePath)?;

  let search_paths = SearchPaths {
    game: vec![
      "citadel/addons".to_string(),
      "citadel".to_string(),
      "core".to_string(),
    ],
    mod_key: Some("citadel".to_string()),
    write: Some("citadel".to_string()),
  };

  write_search_paths(path, &search_paths)?;

  Ok(())
}

#[tauri::command]
pub fn reset_search_paths(state: State<AppState>) -> Result<(), SearchPathsError> {
  let path = state.path.as_ref().ok_or(SearchPathsError::NoGamePath)?;

  let search_paths = SearchPaths {
    game: vec!["citadel".to_string(), "core".to_string()],
    mod_key: None,
    write: None,
  };

  write_search_paths(path, &search_paths)?;

  Ok(())
}

#[tauri::command]
pub fn get_install_path(state: State<AppState>) -> Option<PathBuf> {
  let state = state.install_path.lock().unwrap();

  state.clone()
}

#[tauri::command]
pub fn set_install_path(
  state: State<AppState>,
  install_path: String,
  app_handle: AppHandle,
) -> Result<(), String> {
  let mut install_path_state = state.install_path.lock().unwrap();

  let old_install_path = install_path_state.clone();

  let new_install_path = PathBuf::from(install_path);

  if let Some(old_install_path) = old_install_path.clone() {
    if old_install_path == new_install_path {
      return Ok(());
    }
  }

  let game_path = state.path.as_ref().ok_or("Game path not found")?;

  if new_install_path.starts_with(game_path) {
    return Err("Addon storage path cannot be inside the game path.".to_string());
  }

  if !new_install_path.exists() {
    return Err("Addon storage path does not exist.".to_string());
  }

  *install_path_state = Some(new_install_path.clone());

  let config_store = app_handle.store_builder(".config").build();

  config_store.set("install_path", json!(new_install_path.clone()));

  config_store.save().map_err(|e| e.to_string())?;

  if let Some(old_install_path) = old_install_path {
    if let Ok(entries) = std::fs::read_dir(&old_install_path) {
      for entry in entries.flatten() {
        if let Ok(file_type) = entry.file_type() {
          if file_type.is_file() {
            let extension = entry
              .path()
              .extension()
              .map(|ext| ext.to_string_lossy().to_string());

            if let Some("vpk") = extension.as_deref() {
              let file_name = entry.file_name().into_string().unwrap();

              let destination = install_path_state.as_ref().unwrap().join(&file_name);

              let _ = std::fs::copy(entry.path(), &destination);
            }
          }
        }
      }
    }
  }

  Ok(())
}

#[tauri::command]
pub fn list_installed_addons(state: State<AppState>) -> Result<Vec<String>, AddonError> {
  let install_folder_path = state
    .install_path
    .lock()
    .unwrap()
    .clone()
    .ok_or(AddonError::NoInstallPath)?;

  let mut addons = vec![];

  for entry in
    std::fs::read_dir(install_folder_path).map_err(AddonError::CouldNotReadInstallFolder)?
  {
    let entry = entry.map_err(AddonError::CouldNotReadInstallFolder)?;

    let file_type = entry
      .file_type()
      .map_err(AddonError::CouldNotReadInstallFolder)?;

    if file_type.is_file() {
      let extension = entry
        .path()
        .extension()
        .map(|ext| ext.to_string_lossy().to_string());

      if let Some("vpk") = extension.as_deref() {
        if let Ok(addon_name) = entry.file_name().into_string() {
          addons.push(addon_name);
        }
      }
    }
  }

  Ok(addons)
}

#[tauri::command]
pub fn list_mounted_addons(state: State<AppState>) -> Result<Vec<String>, AddonError> {
  let addons_game_folder =
    create_addons_folder_if_not_exists(state.path.as_ref().ok_or(AddonError::NoGamePath)?)
      .map_err(AddonError::CouldNotCreateAddonFolder)?;

  let mut addons = vec![];

  for entry in std::fs::read_dir(addons_game_folder).map_err(AddonError::CouldNotReadAddonFolder)? {
    let entry = entry.map_err(AddonError::CouldNotReadAddonFolder)?;

    let file_type = entry
      .file_type()
      .map_err(AddonError::CouldNotReadAddonFolder)?;

    if file_type.is_file() || file_type.is_symlink_file() {
      let extension = entry
        .path()
        .extension()
        .map(|ext| ext.to_string_lossy().to_string());

      if let Some("vpk") = extension.as_deref() {
        if let Ok(addon_name) = entry.file_name().into_string() {
          addons.push(addon_name);
        }
      }
    }
  }

  Ok(addons)
}

#[tauri::command]
pub fn install_addon(
  state: State<AppState>,
  input: InstallAddonInfo,
  app_handle: AppHandle,
) -> Result<(), AddonError> {
  let install_folder_path = state
    .install_path
    .lock()
    .unwrap()
    .clone()
    .ok_or(AddonError::NoInstallPath)?;

  let file_path = PathBuf::from(input.file_path);

  if !file_path.exists() {
    return Err(AddonError::InvalidAddonFile);
  }

  let extension = file_path
    .extension()
    .ok_or(AddonError::InvalidAddonFile)?
    .to_string_lossy();

  if extension != "vpk" {
    return Err(AddonError::InvalidAddonFile);
  }

  let file_name = {
    if let Some(file_name) = input.file_name {
      file_name
    } else {
      file_path
        .file_name()
        .ok_or(AddonError::InvalidAddonFile)?
        .to_string_lossy()
        .to_string()
    }
  };

  let destination = install_folder_path.join(&file_name);

  std::fs::copy(&file_path, &destination).map_err(AddonError::CouldNotWriteInstallFolder)?;

  if let Some(display_name) = input.display_name {
    let config_store = app_handle.store_builder(".config").build();

    if !config_store.has("addons") {
      config_store.set("addons", json!({}));
    }

    if let Some(mut current_addons) = config_store.get("addons") {
      if let Some(addons_object) = current_addons.as_object_mut() {
        addons_object.insert(
          file_name.clone(),
          json!(
            {
              "displayName": display_name
            }
          ),
        );

        config_store.set("addons", current_addons);

        _ = config_store.save();
      }
    }
  }

  Ok(())
}

#[tauri::command]
pub fn uninstall_addon(state: State<AppState>, addon_file_name: String) -> Result<(), AddonError> {
  let install_folder_path = state
    .install_path
    .lock()
    .unwrap()
    .clone()
    .ok_or(AddonError::NoInstallPath)?;

  let addon_game_folder_path = state
    .path
    .as_ref()
    .ok_or(AddonError::NoGamePath)?
    .join("game/citadel/addons")
    .join(&addon_file_name);

  let addon_install_path = install_folder_path.join(&addon_file_name);

  if !addon_install_path.exists() {
    return Err(AddonError::AddonIsNotInstalled);
  }

  if addon_game_folder_path.exists() {
    return Err(AddonError::CannotDeleteMountedAddon);
  }

  std::fs::remove_file(&addon_install_path).map_err(AddonError::CouldNotWriteInstallFolder)?;

  Ok(())
}

#[tauri::command]
pub fn mount_addon(
  state: State<AppState>,
  addon_file_name: String,
  app_handle: AppHandle,
) -> Result<(), AddonError> {
  let addons_game_folder_path =
    create_addons_folder_if_not_exists(state.path.as_ref().ok_or(AddonError::NoGamePath)?)
      .map_err(AddonError::CouldNotCreateAddonFolder)?;

  let addon_game_path = addons_game_folder_path.join(&addon_file_name);

  let addon_install_path = state
    .install_path
    .lock()
    .unwrap()
    .clone()
    .ok_or(AddonError::NoInstallPath)?
    .join(&addon_file_name);

  if !addon_install_path.exists() {
    return Err(AddonError::AddonIsNotInstalled);
  }

  if addon_game_path.exists() {
    return Err(AddonError::AddonAlreadyMounted);
  }

  let config_store = app_handle.store_builder(".config").build();

  let deploy_method = config_store
    .get("deploy_method")
    .and_then(|s| -> Option<DeployMethod> { DeployMethod::deserialize(s).ok() })
    .unwrap_or(DeployMethod::Copy);

  if deploy_method == DeployMethod::Symlink && is_symlink_available(state.clone()) {
    std::os::windows::fs::symlink_file(&addon_install_path, &addon_game_path)
      .map_err(AddonError::CouldNotWriteAddonFolder)?;
  } else {
    std::fs::copy(&addon_install_path, &addon_game_path)
      .map_err(AddonError::CouldNotWriteAddonFolder)?;
  }

  Ok(())
}

#[tauri::command]
pub fn unmount_addon(state: State<AppState>, addon_file_name: String) -> Result<(), AddonError> {
  let addons_game_folder_path =
    create_addons_folder_if_not_exists(state.path.as_ref().ok_or(AddonError::NoGamePath)?)
      .map_err(AddonError::CouldNotCreateAddonFolder)?;

  let addon_game_path = addons_game_folder_path.join(&addon_file_name);
  let addon_install_path = state
    .install_path
    .lock()
    .unwrap()
    .clone()
    .ok_or(AddonError::NoInstallPath)?
    .join(&addon_file_name);

  if !addon_game_path.exists() {
    return Err(AddonError::AddonIsNotMounted);
  }

  if !addon_install_path.exists() {
    let _ = std::fs::copy(&addon_game_path, &addon_install_path);
  }

  std::fs::remove_file(&addon_game_path).map_err(AddonError::CouldNotWriteAddonFolder)?;

  Ok(())
}

#[tauri::command]
pub fn set_deploy_method(
  state: State<AppState>,
  deploy_method: DeployMethod,
  app_handle: AppHandle,
) -> Result<(), AddonError> {
  let mounted_addons = list_mounted_addons(state.clone())?;

  for addon in mounted_addons.iter() {
    unmount_addon(state.clone(), addon.to_owned())?;
  }

  let config_store = app_handle.store_builder(".config").build();

  config_store.set("deploy_method", json!(deploy_method));

  _ = config_store.save();

  for addon in mounted_addons.iter() {
    mount_addon(state.clone(), addon.to_owned(), app_handle.clone())?;
  }

  Ok(())
}

#[tauri::command]
pub fn is_symlink_available(state: State<AppState>) -> bool {
  let install_path = state.install_path.lock().unwrap();

  if let Some(game_path) = state.path.as_ref() {
    if let Some(install_path) = install_path.as_ref() {
      let game_path_drive = game_path.components().next().unwrap().as_os_str();
      let install_path_drive = install_path.components().next().unwrap().as_os_str();

      return game_path_drive == install_path_drive;
    }
  }

  false
}

#[tauri::command]
pub fn get_deploy_method(app_handle: AppHandle) -> DeployMethod {
  let config_store = app_handle.store_builder(".config").build();

  config_store
    .get("deploy_method")
    .and_then(|s| -> Option<DeployMethod> { DeployMethod::deserialize(s).ok() })
    .unwrap_or(DeployMethod::Copy)
}
