use serde::{ser, Deserialize, Serialize};
use serde_json::json;
use std::path::PathBuf;
use std::{io, path::Path};
use steamlocate::SteamDir;
use tauri::{AppHandle, State};
use tauri_plugin_store::StoreExt;

use crate::AppState;

static GAME_ID: u32 = 1422450;

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
      AddonError::NoInstallPath => serializer.serialize_str("Install path not found"),
      AddonError::NoGamePath => serializer.serialize_str("Game path not found"),
      AddonError::CouldNotReadInstallFolder(e) => {
        serializer.serialize_str(&format!("Could not read install path: {}", e))
      }
      AddonError::CouldNotReadAddonFolder(e) => {
        serializer.serialize_str(&format!("Could not read addons folder: {}", e))
      }
      AddonError::CouldNotWriteAddonFolder(e) => {
        serializer.serialize_str(&format!("Could not write addons folder: {}", e))
      }
      AddonError::CouldNotWriteInstallFolder(e) => {
        serializer.serialize_str(&format!("Could not write install folder: {}", e))
      }
      AddonError::InvalidAddonFile => serializer.serialize_str("Invalid addon file"),
      AddonError::AddonIsNotInstalled => serializer.serialize_str("Addon is not installed"),
      AddonError::AddonAlreadyMounted => serializer.serialize_str("Addon is already mounted"),
      AddonError::AddonIsNotMounted => serializer.serialize_str("Addon is not mounted"),
      AddonError::CannotDeleteMountedAddon => {
        serializer.serialize_str("Cannot delete mounted addon")
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
  let mut state = state.install_path.lock().unwrap();

  let old_install_path = state.clone();

  *state = Some(PathBuf::from(&install_path));

  let config_store = app_handle.store_builder(".config").build();

  config_store.set("install_path", json!(install_path));

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

              let destination = state.as_ref().unwrap().join(&file_name);

              let _ = std::fs::copy(entry.path(), &destination);
              let _ = std::fs::remove_file(entry.path());
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
pub fn install_addon(state: State<AppState>, file_path: String) -> Result<(), AddonError> {
  let install_folder_path = state
    .install_path
    .lock()
    .unwrap()
    .clone()
    .ok_or(AddonError::NoInstallPath)?;

  let file_path = PathBuf::from(file_path);

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

  let file_name = file_path
    .file_name()
    .ok_or(AddonError::InvalidAddonFile)?
    .to_string_lossy()
    .to_string();

  let destination = install_folder_path.join(file_name);

  std::fs::copy(&file_path, &destination).map_err(AddonError::CouldNotWriteInstallFolder)?;

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
pub fn mount_addon(state: State<AppState>, addon_file_name: String) -> Result<(), AddonError> {
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

  std::fs::copy(&addon_install_path, &addon_game_path)
    .map_err(AddonError::CouldNotWriteAddonFolder)?;

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
