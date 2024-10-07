import { invoke as tauriInvoke } from "@tauri-apps/api/core";

import { commands } from "./commands";

export default async function invoke<T extends keyof commands>(
  command: T,
  input: commands[T]["input"]
) {
  try {
    const result = await tauriInvoke<commands[T]["output"]>(command, input);
    return {
      success: true,
      result: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error as commands[T]["error"],
    };
  }
}
