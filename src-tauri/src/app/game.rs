use std::path::{Path, PathBuf};

use serde::Serialize;
use steamlocate::SteamDir;

use super::{constants::DEADLOCK_APP_ID, search_paths::get_gameinfo_path};

#[derive(Debug, Serialize)]
#[serde(tag = "type", content = "data")]
pub enum InvalidGamePath {
  NoGameInfo,
}

#[derive(Debug, Serialize)]
#[serde(tag = "type", content = "data")]
pub enum GamePathError {
  SteamNotFound,
  GameNotFound,
  Invalid(InvalidGamePath),
  CreateStore(String),
}

impl From<InvalidGamePath> for GamePathError {
  fn from(e: InvalidGamePath) -> Self {
    GamePathError::Invalid(e)
  }
}

impl From<tauri_plugin_store::Error> for GamePathError {
  fn from(e: tauri_plugin_store::Error) -> Self {
    GamePathError::CreateStore(e.to_string())
  }
}

pub fn find_game_path_raw() -> Result<PathBuf, GamePathError> {
  let steam_dir = SteamDir::locate().map_err(|_| GamePathError::SteamNotFound)?;

  let (deadlock_app, lib) = steam_dir
    .find_app(DEADLOCK_APP_ID)
    .map_err(|_| GamePathError::GameNotFound)?
    .ok_or(GamePathError::GameNotFound)?;

  Ok(lib.resolve_app_dir(&deadlock_app))
}

pub fn validate_game_path(game_path: &Path) -> Result<(), InvalidGamePath> {
  if !get_gameinfo_path(game_path).exists() {
    Err(InvalidGamePath::NoGameInfo)
  } else {
    Ok(())
  }
}

pub fn find_game_path() -> Result<PathBuf, GamePathError> {
  let game_path = find_game_path_raw()?;

  validate_game_path(&game_path)?;

  Ok(game_path)
}
