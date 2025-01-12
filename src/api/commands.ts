import {
  AppError,
  DeployMethod,
  DeployMethodError,
  GamePathError,
  InstallAddonInfo,
  ManageAddonError,
  ManageAddonsOptions,
  MountAddonError,
  ReadManagedAddonsError,
  ReadMountedAddonsError,
  SearchPathsError,
  SearchPathsState,
  StoragePathError,
} from "./types";

export type commands = {
  get_game_path_app: {
    input: undefined;
    output: string;
    error: AppError<GamePathError>;
  };
  validate_custom_game_path_app: {
    input: {
      customGamePath: string;
    };
    output: undefined;
    error: GamePathError;
  };
  revalidate_custom_game_path_app: {
    input: undefined;
    output: undefined;
    error: undefined;
  };
  set_custom_game_path_app: {
    input: {
      customGamePath: string;
    };
    output: undefined;
    error: AppError<GamePathError>;
  };
  get_storage_path_app: {
    input: undefined;
    output: string | undefined;
    error: undefined;
  };
  validate_storage_path_app: {
    input: {
      storagePath: string;
    };
    output: undefined;
    error: AppError<StoragePathError>;
  };
  set_storage_path_app: {
    input: {
      storagePath: string;
    };
    output: undefined;
    error: AppError<StoragePathError>;
  };
  get_deploy_method_app: {
    input: undefined;
    output: DeployMethod;
    error: undefined;
  };
  validate_deploy_method_app: {
    input: {
      deployMethod: DeployMethod;
    };
    output: undefined;
    error: AppError<DeployMethodError>;
  };
  set_deploy_method_app: {
    input: {
      deployMethod: DeployMethod;
    };
    output: undefined;
    error: AppError<DeployMethodError>;
  };
  get_search_paths_state_app: {
    input: undefined;
    output: SearchPathsState;
    error: AppError<SearchPathsError>;
  };
  mod_search_paths_app: {
    input: undefined;
    output: undefined;
    error: AppError<SearchPathsError>;
  };
  mount_addon_app: {
    input: {
      addonName: string;
    };
    output: undefined;
    error: AppError<MountAddonError>;
  };
  unmount_addon_app: {
    input: {
      addonName: string;
    };
    output: undefined;
    error: AppError<MountAddonError>;
  };
  manage_addon_app: {
    input: {
      options: ManageAddonsOptions;
    };
    output: undefined;
    error: AppError<ManageAddonError>;
  };
  delete_addon_app: {
    input: {
      addonName: string;
    };
    output: undefined;
    error: AppError<ManageAddonError>;
  };
  list_mounted_addons_app: {
    input: undefined;
    output: string[];
    error: AppError<ReadMountedAddonsError>;
  };
  list_managed_addons_app: {
    input: undefined;
    output: string[];
    error: AppError<ReadManagedAddonsError>;
  };
};

export type Command = keyof commands;
