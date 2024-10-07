import useSWR from "swr";
import { commands } from "./commands";
import invoke from "./invoke";
import useSWRMutation from "swr/mutation";

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
    | { success: boolean; result: commands[T]["output"]; error?: undefined }
    | { success: boolean; error: commands[T]["error"]; result?: undefined },
    never,
    [T],
    commands[T]["input"]
  >([command], async (_, { arg: input }) => {
    return await invoke(command, input);
  });
}
