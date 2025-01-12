import { StoragePathError } from "../types";

export function storagePathErrorMessage(error: StoragePathError) {
  switch (error.type) {
    case "DoesNotExist":
      return "Path does not exist";
    case "NotADirectory":
      return "Path is not a directory";
    case "NotEmpty":
      return "Path contains files other than .vpk files";
    case "InsideGamePath":
      return "Path is inside the game installation directory";
  }
}
