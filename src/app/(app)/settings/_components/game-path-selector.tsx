import { useInvoke, useInvokeMutate } from "@/api/useInvoke";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallback } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { gamePathErrorMessage } from "@/api/errorMessages/gamePath";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { cn } from "@/lib/utils";

export interface GamePathSelectorProps {
  path: string | undefined;
  setPath: (value: string | undefined) => void;
  setError: (error: string, onClose?: () => void) => void;
}

export default function GamePathSelector({
  path,
  setPath,
  setError,
}: GamePathSelectorProps) {
  const { data: gamePath, isLoading: gamePathLoading } = useInvoke(
    "get_game_path_app",
    undefined
  );

  const { trigger: validateGamePath } = useInvokeMutate(
    "validate_custom_game_path_app"
  );

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
      setPath(chosenPath);
    } else {
      setError(gamePathErrorMessage(validateResult.error), selectGamePath);
    }
  }, [validateGamePath, gamePath, setError]);

  return (
    <>
      <div className="flex flex-col gap-1">
        <span className="font-bold text-lg">Game installation path</span>
        <span className="text-primary-200 text-sm">
          Path to the <span className="text-white code">Deadlock</span> or{" "}
          <span className="text-white code">project8</span> folder.
        </span>
      </div>

      <div className="flex gap-2">
        {gamePathLoading ? (
          <Skeleton className="h-10 flex-1" />
        ) : (
          <>
            <Input
              type="text"
              className="cursor-pointer text-sm h-10 flex-1"
              value={gamePath ?? "Select..."}
              readOnly
              onClick={selectGamePath}
            />
            <div
              className={cn(
                "flex items-center justify-center size-10 cursor-pointer",
                !gamePath && "disabled:cursor-not-allowed disabled:opacity-50"
              )}
              onClick={() => {
                if (gamePath) {
                  revealItemInDir(gamePath);
                }
              }}
            >
              <span className="icon-[lucide--external-link] size-6" />
            </div>
          </>
        )}
      </div>
    </>
  );
}
