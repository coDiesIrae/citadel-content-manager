import useSWR, { mutate } from "swr";
import useSWRMutation from "swr/mutation";
import { commands } from "./commands";
import invoke from "./invoke";

export function useInvoke<T extends keyof commands>(
  command: T,
  input: commands[T]["input"]
) {
  const {
    data,
    error: _,
    ...result
  } = useSWR([command, input], async ([command, input]) => {
    return await invoke(command, input);
  });

  return {
    data: data?.result,
    error: data?.error,
    ...result,
  };
}

export function useInvokeMutate<T extends keyof commands>(command: T) {
  return useSWRMutation<
    | { success: true; result: commands[T]["output"]; error?: undefined }
    | { success: false; error: commands[T]["error"]; result?: undefined },
    never,
    [T],
    commands[T]["input"]
  >([command], async (_, { arg: input }) => {
    return await invoke(command, input);
  });
}

export function mutateInvoke<T extends keyof commands>(
  command: T,
  input?: commands[T]["input"]
) {
  if (input) {
    return mutate([command, input]);
  } else {
    return mutate((key) => {
      return Array.isArray(key) && key[0] === command;
    });
  }
}
