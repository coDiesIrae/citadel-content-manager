use std::{io, path::Path};

use serde::{Deserialize, Serialize};

#[derive(Debug)]
pub enum SearchPathsError {
  CouldNotReadGameInfo(io::Error),
  DeserializationError(Box<keyvalues_serde::error::Error>),
}

#[derive(Debug)]
pub enum SearchPathsState {
  Vanilla,
  Modded,
  Custom,
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

pub fn check_search_paths(path: &Path) -> Result<SearchPathsState, SearchPathsError> {
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
