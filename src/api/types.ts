export type InstallAddonInfo = {
  filePath: string;
  fileName?: string;
  displayName?: string;
};

export type TaggedEnum<T> = T extends string
  ? { type: T; data: never }
  : T extends [string, infer U]
  ? { type: T[0]; data: U }
  : never;

export type AppError<T> = TaggedEnum<
  ["NoGamePath", GamePathError] | "NoStoragePath" | ["Module", T]
>;

// addons.rs

export type ManageAddonsOptions = {
  addonPath: string;
  rename?: string;
};

export type DeployMethod = "Copy" | "Symlink";

export type DeployMethodNotAvailable = TaggedEnum<"DifferentDrives">;

export type DeployMethodError = TaggedEnum<
  | ["NotAvailable", DeployMethodNotAvailable]
  | "InvalidGamePath"
  | "InvalidStoragePath"
>;

export type MountAddonError = TaggedEnum<
  "NotManaged" | "NotMounted" | "AlreadyMounted" | ["Write", string]
>;

export type ManageAddonError = TaggedEnum<
  "InvalidPath" | "NotAVPK" | ["Write", string] | "NotManaged" | "Mounted"
>;

export type ReadMountedAddonsError = TaggedEnum<["Read", string]>;

export type ReadManagedAddonsError = TaggedEnum<["Read", string]>;

// game.rs

export type InvalidGamePath = TaggedEnum<"NoGameInfo">;

export type GamePathError = TaggedEnum<
  "SteamNotFound" | "GameNotFound" | ["Invalid", InvalidGamePath]
>;

// search_paths.rs

export type SearchPathsState = "Vanilla" | "Modded";

export type SearchPathsError = TaggedEnum<
  | ["Read", string]
  | ["Write", string]
  | "NotFound"
  | ["Serialize", string]
  | ["Deserialize", string]
  | "AlreadyModded"
>;

// storage.rs

export type StoragePathError = TaggedEnum<
  "DoesNotExist" | "NotADirectory" | "NotEmpty" | "InsideGamePath"
>;
