use serde::{Deserialize, Serialize};
use std::{
  io,
  path::{Path, PathBuf},
};

use steamlocate::SteamDir;

static GAME_ID: u32 = 1422450;

#[derive(Debug, Deserialize, Serialize)]
struct SearchPaths {
  #[serde(rename = "Game")]
  game: Vec<String>,
  #[serde(rename = "Mod")]
  mod_key: Option<String>,
  #[serde(rename = "Write")]
  write: Option<String>,
}

#[derive(Debug, Eq, PartialEq)]
pub enum SearchPathsState {
  Vanilla,
  Modded,
  Custom,
}

#[derive(Debug)]
pub enum GameError {
  CannotLocateSteam,
  CannotLocateDeadlock,
  Io(io::Error),
  Serde(Box<keyvalues_serde::error::Error>),
}

#[derive(Debug)]
pub struct CitadelGame {
  path: PathBuf,
  search_paths_state: SearchPathsState,
  addons: Option<Vec<PathBuf>>,
}

impl CitadelGame {
  pub fn new() -> Result<Self, GameError> {
    let mut steam_dir = SteamDir::locate().ok_or(GameError::CannotLocateSteam)?;

    let game_dir = steam_dir
      .app(&GAME_ID)
      .ok_or(GameError::CannotLocateDeadlock)?
      .to_owned();

    let search_paths_state = CitadelGame::check_search_paths(&game_dir.path)?;
    let addons = CitadelGame::read_addons_folder(&game_dir.path)?;

    Ok(Self {
      path: game_dir.path,
      search_paths_state,
      addons,
    })
  }

  fn check_search_paths(path: &Path) -> Result<SearchPathsState, GameError> {
    let search_paths = CitadelGame::read_search_paths(path)?;

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

  fn read_search_paths(path: &Path) -> Result<SearchPaths, GameError> {
    let game_info_path = path.join("game/citadel/gameinfo.gi");

    let content = std::fs::read_to_string(game_info_path).map_err(GameError::Io)?;

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
      .map_err(|e| GameError::Serde(Box::new(e)))?;

    Ok(search_paths)
  }

  fn write_search_paths(path: &Path, search_paths: &SearchPaths) -> Result<(), GameError> {
    let game_info_path = path.join("game/citadel/gameinfo.gi");

    let content = std::fs::read_to_string(&game_info_path).map_err(GameError::Io)?;

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
      .map_err(|e| GameError::Serde(Box::new(e)))?
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

    std::fs::write(&game_info_path, new_content).map_err(GameError::Io)?;

    Ok(())
  }

  fn read_addons_folder(path: &Path) -> Result<Option<Vec<PathBuf>>, GameError> {
    let addons_path = path.join("citadel/addons");

    if !addons_path.exists() {
      return Ok(None);
    }

    let addons = addons_path
      .read_dir()
      .map_err(GameError::Io)?
      .filter_map(|entry| {
        let entry = entry.ok()?;

        if entry.file_type().ok()?.is_file() && entry.path().extension()? == "vpk" {
          Some(entry.path())
        } else {
          None
        }
      })
      .collect();

    Ok(Some(addons))
  }

  pub fn create_addons_folder(&self) -> Result<(), GameError> {
    if self.addons.is_some() {
      return Ok(());
    }

    let addons_path = self.path.join("citadel/addons");

    if !addons_path.exists() {
      std::fs::create_dir_all(addons_path).map_err(GameError::Io)?;
    }

    Ok(())
  }

  pub fn mod_search_paths(&mut self) -> Result<(), GameError> {
    if self.search_paths_state != SearchPathsState::Vanilla {
      return Ok(());
    }

    let search_paths = SearchPaths {
      game: vec![
        "citadel/addons".to_string(),
        "citadel".to_string(),
        "core".to_string(),
      ],
      mod_key: Some("citadel".to_string()),
      write: Some("citadel".to_string()),
    };

    CitadelGame::write_search_paths(&self.path, &search_paths)?;

    self.search_paths_state = SearchPathsState::Modded;

    Ok(())
  }
}
