use std::{ffi::OsStr, path::Path};

use serde::Serialize;

use super::constants::VPK_EXTENSION;

#[derive(Debug, Serialize)]
#[serde(tag = "type", content = "data")]
pub enum StoragePathError {
  DoesNotExist,
  NotADirectory,
  NotEmpty,
  InsideGamePath,
  CreateStore(String),
}

impl From<tauri_plugin_store::Error> for StoragePathError {
  fn from(e: tauri_plugin_store::Error) -> Self {
    StoragePathError::CreateStore(e.to_string())
  }
}

pub fn validate_storage_path(
  storage_path: &Path,
  game_path: &Path,
) -> Result<(), StoragePathError> {
  if !storage_path.exists() {
    return Err(StoragePathError::DoesNotExist);
  }

  if !storage_path.is_dir() {
    return Err(StoragePathError::NotADirectory);
  }

  if storage_path.starts_with(game_path) {
    return Err(StoragePathError::InsideGamePath);
  }

  if storage_path
    .read_dir()
    .map_err(|_| StoragePathError::NotADirectory)?
    .any(|entry| match entry {
      Ok(f) => f.path().extension() != Some(OsStr::new(VPK_EXTENSION)),
      Err(_) => true,
    })
  {
    return Err(StoragePathError::NotEmpty);
  }

  Ok(())
}
