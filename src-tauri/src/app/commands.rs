use super::addons::{
  delete_addon, list_managed_addons, list_mounted_addons, manage_addon, mount_addon, unmount_addon,
  validate_deploy_method, DeployMethod, DeployMethodError, ManageAddonError, ManageAddonOptions,
  MountAddonError, ReadManagedAddonsError, ReadMountedAddonsError,
};
use super::constants::{
  CONFIG_STORE_NAME, CUSTOM_GAME_PATH_OPTION_KEY, DEPLOY_METHOD_OPTION_KEY, STORAGE_PATH_OPTION_KEY,
};
use super::game::{find_game_path, validate_game_path, GamePathError};
use super::search_paths::{
  parse_search_paths, read_search_paths, search_paths_state, write_search_paths, SearchPaths,
  SearchPathsError, SearchPathsState,
};
use super::storage::{validate_storage_path, StoragePathError};
use serde::Serialize;
use serde_json::json;
use std::{
  path::{Path, PathBuf},
  sync::Mutex,
};
use tauri::{AppHandle, State};
use tauri_plugin_store::StoreExt;

pub struct AppState {
  pub game_path: Mutex<Option<PathBuf>>,
}

#[derive(Debug, Serialize)]
#[serde(tag = "type", content = "data")]
pub enum AppError<T: Serialize> {
  NoGamePath(GamePathError),
  NoStoragePath,
  CreateStore(String),
  Module(T),
}

impl<T> From<T> for AppError<T>
where
  T: Serialize,
{
  fn from(e: T) -> Self {
    AppError::Module(e)
  }
}

fn get_current_game_path(
  state: &AppState,
  app_handle: &AppHandle,
) -> Result<PathBuf, GamePathError> {
  let mut state_game_path = state.game_path.lock().unwrap();

  if let Some(game_path) = &*state_game_path {
    return Ok(game_path.clone());
  }

  let store = app_handle.store_builder(CONFIG_STORE_NAME).build();

  if let Some(custom_game_path) = store
    .ok()
    .and_then(|s| s.get(CUSTOM_GAME_PATH_OPTION_KEY))
    .and_then(|s| Some(PathBuf::from(s.as_str()?)))
  {
    *state_game_path = Some(custom_game_path.clone());

    return Ok(custom_game_path);
  }

  let game_path = find_game_path()?;

  *state_game_path = Some(game_path.clone());

  Ok(game_path)
}

fn revalidate_custom_game_path(state: &AppState, app_handle: &AppHandle) {
  let Ok(store) = app_handle.store_builder(CONFIG_STORE_NAME).build() else {
    return;
  };

  let custom_game_path = store
    .get(CUSTOM_GAME_PATH_OPTION_KEY)
    .and_then(|s| Some(PathBuf::from(s.as_str()?)));

  if let Some(custom_game_path) = custom_game_path {
    if validate_game_path(&custom_game_path).is_err() {
      store.delete(CUSTOM_GAME_PATH_OPTION_KEY);

      _ = store.save();

      let mut state_game_path = state.game_path.lock().unwrap();

      *state_game_path = None;
    }
  }
}

fn set_custom_game_path(
  state: &AppState,
  app_handle: &AppHandle,
  custom_game_path: &Path,
) -> Result<(), GamePathError> {
  validate_game_path(custom_game_path)?;

  let store = app_handle.store_builder(CONFIG_STORE_NAME).build()?;

  store.set(
    CUSTOM_GAME_PATH_OPTION_KEY,
    custom_game_path.to_string_lossy().to_string(),
  );

  _ = store.save();

  let mut state_game_path = state.game_path.lock().unwrap();

  *state_game_path = Some(custom_game_path.to_path_buf());

  Ok(())
}

fn get_current_storage_path(app_handle: &AppHandle) -> Option<PathBuf> {
  let store = app_handle.store_builder(CONFIG_STORE_NAME).build().ok()?;

  store
    .get(STORAGE_PATH_OPTION_KEY)
    .and_then(|s| Some(PathBuf::from(s.as_str()?)))
}

fn set_storage_path(
  app_handle: &AppHandle,
  storage_path: &Path,
  game_path: &Path,
) -> Result<(), StoragePathError> {
  validate_storage_path(storage_path, game_path)?;

  let store = app_handle.store_builder(CONFIG_STORE_NAME).build()?;

  store.set(
    STORAGE_PATH_OPTION_KEY,
    storage_path.to_string_lossy().to_string(),
  );

  _ = store.save();

  Ok(())
}

fn get_deploy_method(app_handle: &AppHandle) -> DeployMethod {
  let Ok(store) = app_handle.store_builder(CONFIG_STORE_NAME).build() else {
    return DeployMethod::Copy;
  };

  store
    .get(DEPLOY_METHOD_OPTION_KEY)
    .and_then(|v| serde_json::from_value::<DeployMethod>(v).ok())
    .unwrap_or(DeployMethod::Copy)
}

fn set_deploy_method(
  app_state: &AppState,
  app_handle: &AppHandle,
  deploy_method: DeployMethod,
) -> Result<(), AppError<DeployMethodError>> {
  let game_path = get_current_game_path(app_state, app_handle).map_err(AppError::NoGamePath)?;
  let storage_path = get_current_storage_path(app_handle).ok_or(AppError::NoStoragePath)?;

  validate_deploy_method(deploy_method, &game_path, &storage_path)?;

  let store = app_handle
    .store_builder(CONFIG_STORE_NAME)
    .build()
    .map_err(|e| AppError::CreateStore(e.to_string()))?;

  store.set(DEPLOY_METHOD_OPTION_KEY, json!(deploy_method));

  _ = store.save();

  Ok(())
}

fn get_search_paths_state(
  app_state: &AppState,
  app_handle: &AppHandle,
) -> Result<SearchPathsState, AppError<SearchPathsError>> {
  let game_path = get_current_game_path(app_state, app_handle).map_err(AppError::NoGamePath)?;

  let search_paths = read_search_paths(&game_path)?;

  let search_paths = parse_search_paths(&search_paths)?;

  Ok(search_paths_state(&search_paths))
}

fn mod_search_paths(
  app_state: &AppState,
  app_handle: &AppHandle,
) -> Result<(), AppError<SearchPathsError>> {
  let game_path = get_current_game_path(app_state, app_handle).map_err(AppError::NoGamePath)?;

  let search_paths_result = read_search_paths(&game_path)?;

  let search_paths = parse_search_paths(&search_paths_result)?;

  if search_paths_state(&search_paths) == SearchPathsState::Modded {
    return Err(SearchPathsError::AlreadyModded.into());
  }

  write_search_paths(&game_path, &SearchPaths::modded(), &search_paths_result)?;

  Ok(())
}

#[tauri::command]
pub fn get_game_path_app(
  app_state: State<AppState>,
  app_handle: AppHandle,
) -> Result<PathBuf, AppError<GamePathError>> {
  get_current_game_path(&app_state, &app_handle).map_err(AppError::NoGamePath)
}

#[tauri::command]
pub fn validate_custom_game_path_app(custom_game_path: String) -> Result<(), GamePathError> {
  validate_game_path(Path::new(&custom_game_path)).map_err(GamePathError::Invalid)
}

#[tauri::command]
pub fn revalidate_custom_game_path_app(app_state: State<AppState>, app_handle: AppHandle) {
  revalidate_custom_game_path(&app_state, &app_handle);
}

#[tauri::command]
pub fn set_custom_game_path_app(
  app_state: State<AppState>,
  app_handle: AppHandle,
  custom_game_path: String,
) -> Result<(), AppError<GamePathError>> {
  set_custom_game_path(&app_state, &app_handle, Path::new(&custom_game_path))
    .map_err(AppError::Module)
}

#[tauri::command]
pub fn get_storage_path_app(app_handle: AppHandle) -> Option<PathBuf> {
  get_current_storage_path(&app_handle)
}

#[tauri::command]
pub fn validate_storage_path_app(
  app_state: State<AppState>,
  app_handle: AppHandle,
  storage_path: String,
) -> Result<(), AppError<StoragePathError>> {
  let game_path = get_current_game_path(&app_state, &app_handle).map_err(AppError::NoGamePath)?;

  validate_storage_path(Path::new(&storage_path), &game_path).map_err(AppError::Module)
}

#[tauri::command]
pub fn set_storage_path_app(
  app_state: State<AppState>,
  app_handle: AppHandle,
  storage_path: String,
) -> Result<(), AppError<StoragePathError>> {
  let game_path = get_current_game_path(&app_state, &app_handle).map_err(AppError::NoGamePath)?;

  set_storage_path(&app_handle, Path::new(&storage_path), &game_path).map_err(AppError::Module)
}

#[tauri::command]
pub fn get_deploy_method_app(app_handle: AppHandle) -> DeployMethod {
  get_deploy_method(&app_handle)
}

#[tauri::command]
pub fn validate_deploy_method_app(
  app_state: State<AppState>,
  app_handle: AppHandle,
  deploy_method: DeployMethod,
) -> Result<(), AppError<DeployMethodError>> {
  let game_path = get_current_game_path(&app_state, &app_handle).map_err(AppError::NoGamePath)?;
  let storage_path = get_current_storage_path(&app_handle).ok_or(AppError::NoStoragePath)?;

  validate_deploy_method(deploy_method, &game_path, &storage_path).map_err(AppError::Module)
}

#[tauri::command]
pub fn set_deploy_method_app(
  app_state: State<AppState>,
  app_handle: AppHandle,
  deploy_method: DeployMethod,
) -> Result<(), AppError<DeployMethodError>> {
  set_deploy_method(&app_state, &app_handle, deploy_method)
}

#[tauri::command]
pub fn get_search_paths_state_app(
  app_state: State<AppState>,
  app_handle: AppHandle,
) -> Result<SearchPathsState, AppError<SearchPathsError>> {
  get_search_paths_state(&app_state, &app_handle)
}

#[tauri::command]
pub fn mod_search_paths_app(
  app_state: State<AppState>,
  app_handle: AppHandle,
) -> Result<(), AppError<SearchPathsError>> {
  mod_search_paths(&app_state, &app_handle)
}

#[tauri::command]
pub fn mount_addon_app(
  app_state: State<AppState>,
  app_handle: AppHandle,
  addon_name: String,
) -> Result<(), AppError<MountAddonError>> {
  let game_path = get_current_game_path(&app_state, &app_handle).map_err(AppError::NoGamePath)?;
  let storage_path = get_current_storage_path(&app_handle).ok_or(AppError::NoStoragePath)?;

  mount_addon(
    &game_path,
    &storage_path,
    &addon_name,
    get_deploy_method(&app_handle),
  )
  .map_err(AppError::Module)
}

#[tauri::command]
pub fn unmount_addon_app(
  app_state: State<AppState>,
  app_handle: AppHandle,
  addon_name: String,
) -> Result<(), AppError<MountAddonError>> {
  let game_path = get_current_game_path(&app_state, &app_handle).map_err(AppError::NoGamePath)?;
  let storage_path = get_current_storage_path(&app_handle).ok_or(AppError::NoStoragePath)?;

  unmount_addon(&game_path, &storage_path, &addon_name).map_err(AppError::Module)
}

#[tauri::command]
pub fn manage_addon_app(
  app_handle: AppHandle,
  options: ManageAddonOptions,
) -> Result<(), AppError<ManageAddonError>> {
  let storage_path = get_current_storage_path(&app_handle).ok_or(AppError::NoStoragePath)?;

  manage_addon(&storage_path, options).map_err(AppError::Module)
}

#[tauri::command]
pub fn delete_addon_app(
  app_state: State<AppState>,
  app_handle: AppHandle,
  addon_name: String,
) -> Result<(), AppError<ManageAddonError>> {
  let game_path = get_current_game_path(&app_state, &app_handle).map_err(AppError::NoGamePath)?;
  let storage_path = get_current_storage_path(&app_handle).ok_or(AppError::NoStoragePath)?;

  delete_addon(&game_path, &storage_path, &addon_name).map_err(AppError::Module)
}

#[tauri::command]
pub fn list_mounted_addons_app(
  app_state: State<AppState>,
  app_handle: AppHandle,
) -> Result<Vec<String>, AppError<ReadMountedAddonsError>> {
  let game_path = get_current_game_path(&app_state, &app_handle).map_err(AppError::NoGamePath)?;

  list_mounted_addons(&game_path).map_err(AppError::Module)
}

#[tauri::command]
pub fn list_managed_addons_app(
  app_handle: AppHandle,
) -> Result<Vec<String>, AppError<ReadManagedAddonsError>> {
  let storage_path = get_current_storage_path(&app_handle).ok_or(AppError::NoStoragePath)?;

  list_managed_addons(&storage_path).map_err(AppError::Module)
}
