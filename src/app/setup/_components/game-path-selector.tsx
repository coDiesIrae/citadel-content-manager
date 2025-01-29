import { genericAppErrorMessage } from "@/api/errorMessages/app";
import { gamePathErrorMessage } from "@/api/errorMessages/gamePath";
import { mutateInvoke, useInvoke, useInvokeMutate } from "@/api/useInvoke";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { open } from "@tauri-apps/plugin-dialog";
import { useCallback } from "react";

export interface GamePathSelectorProps {
  setError: (error: string, onClose?: () => void) => void;
}

export default function GamePathSelector({ setError }: GamePathSelectorProps) {
  const {
    data: gamePath,
    isLoading: gamePathLoading,
    mutate: mutateGamePath,
  } = useInvoke("get_game_path_app", undefined);

  const { trigger: validateGamePath } = useInvokeMutate(
    "validate_custom_game_path_app"
  );
  const { trigger: setGamePath } = useInvokeMutate("set_custom_game_path_app");

  const selectGamePath = useCallback(async () => {
    const chosenPath = await open({
      directory: true,
      multiple: false,
      canCreateDirectories: true,
      title: "Select game installation path",
    });

    if (!chosenPath) return;
    if (chosenPath === gamePath) return;

    const validateResult = await validateGamePath({
      customGamePath: chosenPath,
    });

    if (validateResult.success) {
      const setResult = await setGamePath({ customGamePath: chosenPath });

      if (setResult.success) {
        mutateGamePath(
          { success: true, result: chosenPath },
          {
            populateCache: true,
            revalidate: false,
          }
        );

        mutateInvoke("get_deploy_method_app");
        mutateInvoke("get_search_paths_state_app");
        mutateInvoke("list_mounted_addons_app");
      } else {
        setError(
          genericAppErrorMessage(setResult.error, gamePathErrorMessage),
          selectGamePath
        );
      }
    } else {
      setError(gamePathErrorMessage(validateResult.error), selectGamePath);
    }
  }, [setGamePath, validateGamePath, gamePath, setError, mutateGamePath]);

  return (
    <>
      <div className="flex flex-col gap-1">
        <span className="font-bold text-lg">Game installation path</span>
        <span className="text-primary-200 text-sm">
          Path to the <span className="text-white code">Deadlock</span> or{" "}
          <span className="text-white code">Project8Staging</span> folder.
        </span>
      </div>

      {gamePathLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <Input
          type="text"
          className="cursor-pointer text-sm h-10"
          value={gamePath ?? "Select..."}
          readOnly
          onClick={selectGamePath}
        />
      )}
    </>
  );
}
