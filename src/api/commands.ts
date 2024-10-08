import { SearchPathsState } from "./types";

export type commands = {
  get_game_path: {
    input: undefined;
    output: string | undefined;
    error: undefined;
  };
  get_search_paths_state: {
    input: undefined;
    output: SearchPathsState;
    error: string;
  };
  mod_search_paths: {
    input: undefined;
    output: undefined;
    error: string;
  };
  reset_search_paths: {
    input: undefined;
    output: undefined;
    error: string;
  };
  get_install_path: {
    input: undefined;
    output: string | undefined;
    error: undefined;
  };
  set_install_path: {
    input: {
      installPath: string;
    };
    output: undefined;
    error: string;
  };
  list_installed_addons: {
    input: undefined;
    output: string[];
    error: string;
  };
  list_mounted_addons: {
    input: undefined;
    output: string[];
    error: string;
  };
  install_addon: {
    input: {
      filePath: string;
    };
    output: undefined;
    error: string;
  };
  uninstall_addon: {
    input: {
      addonFileName: string;
    };
    output: undefined;
    error: string;
  };
  mount_addon: {
    input: {
      addonFileName: string;
    };
    output: undefined;
    error: string;
  };
  unmount_addon: {
    input: {
      addonFileName: string;
    };
    output: undefined;
    error: string;
  };
};
