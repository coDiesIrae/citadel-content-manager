import { ManageAddonError } from "../types";

export function manageAddonErrorMessage(error: ManageAddonError): string {
  switch (error.type) {
    case "InvalidPath":
      return "Invalid path";

    case "NotAVPK":
      return "Not a valid .vpk file";

    case "Write":
      return `Failed to write to disk: ${error.data}`;

    case "NotManaged":
      return "Addon is not installed";

    case "Mounted":
      return "Addon is already mounted";
  }
}
