import { DeployMethodError, DeployMethodNotAvailable } from "../types";

export function notAvailableDeployMethodErrorMessage(
  error: DeployMethodNotAvailable
) {
  switch (error.type) {
    case "DifferentDrives":
      return "Game and storage paths are on different drives";
  }
}

export function deployMethodErrorMessage(error: DeployMethodError) {
  switch (error.type) {
    case "InvalidGamePath":
      return "Invalid game path";
    case "InvalidStoragePath":
      return "Invalid storage path";
    case "NotAvailable":
      return `Deploy method not available: ${notAvailableDeployMethodErrorMessage(
        error.data
      )}`;
  }
}
