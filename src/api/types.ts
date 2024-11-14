export type SearchPathsState = "Vanilla" | "Modded" | "Custom";

export type DeployMethod = "Copy" | "Symlink";

export type InstallAddonInfo = {
  filePath: string;
  fileName?: string;
  displayName?: string;
};
