import { invoke as tauriInvoke } from "@tauri-apps/api/core";

import { commands } from "./commands";

export const errorLog = [] as any[];

export default async function invoke<T extends keyof commands>(
  command: T,
  input: commands[T]["input"]
) {
  try {
    const result = await tauriInvoke<commands[T]["output"]>(command, input);
    return {
      success: true as true,
      result: result,
    };
  } catch (error) {
    errorLog.push({
      command,
      input,
      error,
    });

    return {
      success: false as false,
      error: error as commands[T]["error"],
    };
  }
}
