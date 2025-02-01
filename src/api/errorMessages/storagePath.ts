import { StoragePathError } from "../types";

export function storagePathErrorMessage(error: StoragePathError): string {
  switch (error.type) {
    case "DoesNotExist":
      return "Path does not exist";
    case "NotADirectory":
      return "Path is not a directory";
    case "NotEmpty":
      return "Path contains files other than .vpk files";
    case "InsideGamePath":
      return "Path is inside the game installation directory";
    case "CreateStore":
      return `Failed to initialize configuration storage: ${error.data}`;
  }
}
