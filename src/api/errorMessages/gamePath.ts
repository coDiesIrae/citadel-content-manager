import { GamePathError, InvalidGamePath } from "../types";

export function invalidGamePathErrorMessage(error: InvalidGamePath) {
  switch (error.type) {
    case "NoGameInfo":
      return "gameinfo.gi file not found";
  }
}

export function gamePathErrorMessage(error: GamePathError) {
  switch (error.type) {
    case "SteamNotFound":
      return "Steam installation not found";
    case "GameNotFound":
      return "Game installation not found";
    case "Invalid":
      return `Invalid game installation: ${invalidGamePathErrorMessage(
        error.data
      )}`;
  }
}
