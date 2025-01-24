use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use super::constants::GAMEINFO_RELATIVE_PATH;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SearchPaths {
  #[serde(rename = "Game")]
  pub game: Vec<String>,
  #[serde(rename = "Mod")]
  pub mod_key: Option<String>,
  #[serde(rename = "Write")]
  pub write: Option<String>,
}

pub struct ReadSearchPathsResult {
  pub lines: Vec<String>,
  pub first_line_index: usize,
  pub last_line_index: usize,
  pub ident_size: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
pub enum SearchPathsState {
  Vanilla,
  Modded,
}

#[derive(Debug, Serialize)]
#[serde(tag = "type", content = "data")]
pub enum SearchPathsError {
  Read(String),
  Write(String),
  NotFound,
  Serialize(String),
  Deserialize(String),
  AlreadyModded,
}

impl SearchPathsError {
  pub fn io_read(e: std::io::Error) -> Self {
    SearchPathsError::Read(e.to_string())
  }

  pub fn io_write(e: std::io::Error) -> Self {
    SearchPathsError::Write(e.to_string())
  }

  pub fn serialize(e: keyvalues_serde::Error) -> Self {
    SearchPathsError::Serialize(e.to_string())
  }

  pub fn deserialize(e: keyvalues_serde::Error) -> Self {
    SearchPathsError::Deserialize(e.to_string())
  }
}

impl SearchPaths {
  pub fn modded() -> Self {
    SearchPaths {
      game: vec![
        "citadel/addons".to_string(),
        "citadel".to_string(),
        "core".to_string(),
      ],
      mod_key: Some("citadel".to_string()),
      write: Some("citadel".to_string()),
    }
  }
}

pub fn get_gameinfo_path(game_path: &Path) -> PathBuf {
  game_path.join(GAMEINFO_RELATIVE_PATH)
}

pub fn read_gameinfo(game_path: &Path) -> Result<String, std::io::Error> {
  std::fs::read_to_string(get_gameinfo_path(game_path))
}

pub fn read_search_paths(game_path: &Path) -> Result<ReadSearchPathsResult, SearchPathsError> {
  let gameinfo = read_gameinfo(game_path).map_err(SearchPathsError::io_read)?;

  let mut lines = gameinfo.lines().collect::<Vec<_>>();

  let mut first_line_index = None;
  let mut last_line_index = None;

  for (i, line) in lines.iter().enumerate() {
    if first_line_index.is_some() && line.contains("}") {
      last_line_index = Some(i);

      break;
    }

    if line.contains("SearchPaths") {
      first_line_index = Some(i);
    }
  }

  let first_line_index = first_line_index.ok_or(SearchPathsError::NotFound)?;
  let last_line_index = last_line_index.ok_or(SearchPathsError::NotFound)?;

  let ident_size = lines[first_line_index].find("SearchPaths").unwrap();

  let lines = lines
    .drain(first_line_index..=last_line_index)
    .map(String::from)
    .collect();

  Ok(ReadSearchPathsResult {
    lines,
    first_line_index,
    last_line_index,
    ident_size,
  })
}

pub fn parse_search_paths(
  search_paths: &ReadSearchPathsResult,
) -> Result<SearchPaths, SearchPathsError> {
  keyvalues_serde::from_str(&search_paths.lines.join("\n")).map_err(SearchPathsError::deserialize)
}

pub fn search_paths_state(search_paths: &SearchPaths) -> SearchPathsState {
  if search_paths.mod_key.is_none()
    && search_paths.write.is_none()
    && search_paths.game.len() == 2
    && search_paths.game[0] == "citadel"
    && search_paths.game[1] == "core"
  {
    SearchPathsState::Vanilla
  } else {
    SearchPathsState::Modded
  }
}

pub fn write_search_paths(
  game_path: &Path,
  new_search_paths: &SearchPaths,
  old_search_paths: &ReadSearchPathsResult,
) -> Result<(), SearchPathsError> {
  let gameinfo = read_gameinfo(game_path).map_err(SearchPathsError::io_read)?;

  let mut gameinfo_lines = gameinfo.lines().map(String::from).collect::<Vec<_>>();

  let ident = "\t".repeat(old_search_paths.ident_size);

  let new_search_paths_lines = keyvalues_serde::to_string(new_search_paths)
    .map_err(SearchPathsError::serialize)?
    .replace('\"', "")
    .split('\n')
    .map(|line| format!("{}{}", ident, line))
    .collect::<Vec<_>>();

  gameinfo_lines.splice(
    old_search_paths.first_line_index..=old_search_paths.last_line_index,
    new_search_paths_lines,
  );

  std::fs::write(get_gameinfo_path(game_path), gameinfo_lines.join("\n"))
    .map_err(SearchPathsError::io_write)?;

  Ok(())
}
