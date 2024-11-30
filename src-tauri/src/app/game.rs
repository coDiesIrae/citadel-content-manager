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
}

impl From<InvalidGamePath> for GamePathError {
  fn from(e: InvalidGamePath) -> Self {
    GamePathError::Invalid(e)
  }
}

pub fn find_game_path_raw() -> Result<PathBuf, GamePathError> {
  let mut steam_dir = SteamDir::locate().ok_or(GamePathError::SteamNotFound)?;

  let game_dir = steam_dir
    .app(&DEADLOCK_APP_ID)
    .ok_or(GamePathError::GameNotFound)?;

  Ok(game_dir.path.clone())
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
