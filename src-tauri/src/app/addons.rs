use std::{
  ffi::OsStr,
  path::{Path, PathBuf},
};

use serde::{Deserialize, Serialize};

use super::constants::{ADDON_MOUNT_PATH, VPK_EXTENSION};

#[derive(Debug, Serialize, Deserialize)]
pub struct ManageAddonOptions {
  #[serde(rename = "addonPath")]
  pub addon_path: PathBuf,
  pub rename: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
pub enum DeployMethod {
  Copy,
  Symlink,
}

#[derive(Debug, Serialize)]
#[serde(tag = "type", content = "data")]
pub enum DeployMethodNotAvailable {
  DifferentDrives,
}

#[derive(Debug, Serialize)]
#[serde(tag = "type", content = "data")]
pub enum DeployMethodError {
  NotAvailable(DeployMethodNotAvailable),
  InvalidGamePath,
  InvalidStoragePath,
}

#[derive(Debug, Serialize)]
#[serde(tag = "type", content = "data")]
pub enum MountAddonError {
  NotManaged,
  NotMounted,
  AlreadyMounted,
  Write(String),
}

#[derive(Debug, Serialize)]
#[serde(tag = "type", content = "data")]
pub enum ManageAddonError {
  InvalidPath,
  NotAVPK,
  Write(String),
  NotManaged,
  Mounted,
}

#[derive(Debug, Serialize)]
#[serde(tag = "type", content = "data")]
pub enum ReadMountedAddonsError {
  Read(String),
}

#[derive(Debug, Serialize)]
#[serde(tag = "type", content = "data")]
pub enum ReadManagedAddonsError {
  Read(String),
}

pub fn validate_deploy_method(
  deploy_method: DeployMethod,
  game_path: &Path,
  storage_path: &Path,
) -> Result<(), DeployMethodError> {
  match deploy_method {
    DeployMethod::Copy => Ok(()),
    DeployMethod::Symlink => {
      let game_drive = game_path
        .components()
        .next()
        .ok_or(DeployMethodError::InvalidGamePath)?;
      let storage_drive = storage_path
        .components()
        .next()
        .ok_or(DeployMethodError::InvalidStoragePath)?;

      if game_drive != storage_drive {
        return Err(DeployMethodError::NotAvailable(
          DeployMethodNotAvailable::DifferentDrives,
        ));
      }

      Ok(())
    }
  }
}

pub fn mount_addon(
  game_path: &Path,
  storage_path: &Path,
  addon_name: &str,
  deploy_method: DeployMethod,
) -> Result<(), MountAddonError> {
  let addon_storage_path = storage_path.join(addon_name);
  let addon_mount_path = game_path.join(ADDON_MOUNT_PATH).join(addon_name);

  if !addon_storage_path.exists() {
    return Err(MountAddonError::NotManaged);
  }

  if addon_mount_path.exists() {
    return Err(MountAddonError::AlreadyMounted);
  }

  std::fs::create_dir_all(&addon_mount_path).map_err(|e| MountAddonError::Write(e.to_string()))?;

  match deploy_method {
    DeployMethod::Copy => {
      std::fs::copy(addon_storage_path, addon_mount_path)
        .map_err(|e| MountAddonError::Write(e.to_string()))?;
    }
    DeployMethod::Symlink => {
      std::os::windows::fs::symlink_file(&addon_storage_path, &addon_mount_path)
        .map_err(|e| MountAddonError::Write(e.to_string()))?;
    }
  }

  Ok(())
}

pub fn unmount_addon(
  game_path: &Path,
  storage_path: &Path,
  addon_name: &str,
) -> Result<(), MountAddonError> {
  let addon_storage_path = storage_path.join(addon_name);
  let addon_mount_path = game_path.join(ADDON_MOUNT_PATH).join(addon_name);

  if !addon_mount_path.exists() {
    return Err(MountAddonError::NotMounted);
  }

  if !addon_storage_path.exists() && !addon_mount_path.is_symlink() {
    std::fs::rename(&addon_mount_path, &addon_storage_path)
      .map_err(|e| MountAddonError::Write(e.to_string()))?;
  } else {
    std::fs::remove_file(&addon_mount_path).map_err(|e| MountAddonError::Write(e.to_string()))?;
  }

  Ok(())
}

pub fn manage_addon(
  storage_path: &Path,
  options: ManageAddonOptions,
) -> Result<(), ManageAddonError> {
  if !options.addon_path.exists() {
    return Err(ManageAddonError::InvalidPath);
  }

  if options.addon_path.extension() != Some(OsStr::new(VPK_EXTENSION)) {
    return Err(ManageAddonError::NotAVPK);
  }

  let addon_name = if let Some(rename) = options.rename {
    rename
  } else {
    options
      .addon_path
      .file_stem()
      .unwrap()
      .to_string_lossy()
      .to_string()
  };

  let addon_storage_path = storage_path.join(&addon_name).with_extension(VPK_EXTENSION);

  std::fs::copy(&options.addon_path, &addon_storage_path)
    .map_err(|e| ManageAddonError::Write(e.to_string()))?;

  Ok(())
}

pub fn delete_addon(
  game_path: &Path,
  storage_path: &Path,
  addon_name: &str,
) -> Result<(), ManageAddonError> {
  let addon_storage_path = storage_path.join(addon_name).with_extension(VPK_EXTENSION);
  let addon_game_path = game_path.join(ADDON_MOUNT_PATH).join(addon_name);

  if !addon_storage_path.exists() {
    return Err(ManageAddonError::NotManaged);
  }

  if addon_game_path.exists() {
    return Err(ManageAddonError::Mounted);
  }

  std::fs::remove_file(&addon_storage_path).map_err(|e| ManageAddonError::Write(e.to_string()))?;

  Ok(())
}

pub fn list_mounted_addons(game_path: &Path) -> Result<Vec<String>, ReadMountedAddonsError> {
  let addon_mount_path = game_path.join(ADDON_MOUNT_PATH);

  if !addon_mount_path.exists() {
    return Ok(vec![]);
  }

  Ok(
    addon_mount_path
      .read_dir()
      .map_err(|e| ReadMountedAddonsError::Read(e.to_string()))?
      .filter_map(|entry| {
        entry.ok().and_then(|f| {
          f.path()
            .extension()
            .filter(|ext| *ext == OsStr::new(VPK_EXTENSION))
            .and_then(|_| {
              f.path()
                .file_stem()
                .map(|s| s.to_string_lossy().to_string())
            })
        })
      })
      .collect(),
  )
}

pub fn list_managed_addons(storage_path: &Path) -> Result<Vec<String>, ReadManagedAddonsError> {
  if !storage_path.exists() {
    return Ok(vec![]);
  }

  Ok(
    storage_path
      .read_dir()
      .map_err(|e| ReadManagedAddonsError::Read(e.to_string()))?
      .filter_map(|entry| {
        entry.ok().and_then(|f| {
          f.path()
            .extension()
            .filter(|ext| *ext == OsStr::new(VPK_EXTENSION))
            .and_then(|_| {
              f.path()
                .file_stem()
                .map(|s| s.to_string_lossy().to_string())
            })
        })
      })
      .collect(),
  )
}
