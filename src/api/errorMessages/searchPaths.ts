import { SearchPathsError } from "../types";

export function searchPathsErrorMessage(error: SearchPathsError) {
  switch (error.type) {
    case "Read":
      return `Failed to read gameinfo.gi file: ${error.data}`;
    case "Write":
      return `Failed to write to gameinfo.gi file: ${error.data}`;
    case "NotFound":
      return "Failed to find SearchPaths block in gameinfo.gi file";
    case "Serialize":
      return `Failed to write SearchPaths block in gameinfo.gi file: ${error.data}`;
    case "Deserialize":
      return `Failed to read SearchPaths block in gameinfo.gi file: ${error.data}`;
    case "AlreadyModded":
      return "SearchPaths block in gameinfo.gi file is already modded";
  }
}
