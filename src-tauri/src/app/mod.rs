use std::path::PathBuf;

use steamlocate::SteamDir;

mod search_paths;

static GAME_ID: u32 = 1422450;

pub struct GameState {
  path: PathBuf,
  search_paths_state: search_paths::SearchPathsState,
}

fn find_game_path() -> Option<PathBuf> {
  let mut steam_dir = SteamDir::locate()?;

  let game_dir = steam_dir.app(&GAME_ID)?.to_owned();

  Some(game_dir.path)
}

pub fn init() -> Option<GameState> {
  let path = find_game_path()?;

  let search_paths_state = search_paths::check_search_paths(&path).ok()?;

  Some(GameState {
    path,
    search_paths_state,
  })
}
