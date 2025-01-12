import { AppError } from "../types";
import { gamePathErrorMessage } from "./gamePath";

export function getAppErrorMessage(error: AppError<unknown>) {
  switch (error.type) {
    case "NoStoragePath":
      return "No storage path set";
    case "NoGamePath":
      return `No game installation path: ${gamePathErrorMessage(error.data)}`;
    case "Module":
      return "Unknown module error";
  }

  return "Unknown error";
}

export function genericAppErrorMessage<T>(
  error: AppError<T>,
  handler: (error: T) => string | undefined
) {
  if (error.type === "Module") {
    const handlerResult = handler(error.data);

    if (handlerResult) {
      return handlerResult;
    }
  }

  return getAppErrorMessage(error);
}
