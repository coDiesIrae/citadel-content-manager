import { MountAddonError } from "../types";

export function mountAddonErrorMessage(error: MountAddonError): string {
  switch (error.type) {
    case "NotManaged":
      return "Addon is not installed";

    case "NotMounted":
      return "Addon is not mounted";

    case "AlreadyMounted":
      return "Addon is already mounted";

    case "Write":
      return `Failed to write to disk: ${error.data}`;
  }
}
