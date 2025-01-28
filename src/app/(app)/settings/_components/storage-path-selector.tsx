import { useCallback } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { useInvoke, useInvokeMutate } from "@/api/useInvoke";
import { storagePathErrorMessage } from "@/api/errorMessages/storagePath";
import { genericAppErrorMessage } from "@/api/errorMessages/app";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import ChangedHighlighter from "./changed-highlighter";

export interface StoragePathSelectorProps {
  setError: (error: string, onClose?: () => void) => void;
  path: string | undefined;
  setPath: (value: string | undefined) => void;
}

export default function StoragePathSelector({
  setError,
  path,
  setPath,
}: StoragePathSelectorProps) {
  const { data: storagePath, isLoading: storagePathLoading } = useInvoke(
    "get_storage_path_app",
    undefined
  );

  const { trigger: validateStoragePath } = useInvokeMutate(
    "validate_storage_path_app"
  );

  const selectGamePath = useCallback(async () => {
    const chosenPath = await open({
      directory: true,
      multiple: false,
      canCreateDirectories: true,
      title: "Select game installation path",
    });

    if (!chosenPath) return;
    if (chosenPath === storagePath) return;

    const validateResult = await validateStoragePath({
      storagePath: chosenPath,
    });

    console.log({ validateResult });

    if (validateResult.success) {
      setPath(chosenPath);
    } else {
      setError(
        genericAppErrorMessage(validateResult.error, storagePathErrorMessage),
        selectGamePath
      );
    }
  }, [validateStoragePath, storagePath, setError, setPath]);

  return (
    <div className="col-span-2 flex flex-row items-center gap-6 relative">
      <ChangedHighlighter active={path !== undefined} />

      <div className="flex flex-col gap-1 flex-1">
        <span className="font-bold text-lg">Addon storage path</span>
        <span className="text-primary-200 text-sm">
          <p>Folder, where all addons managed by this app will be stored.</p>
          <p>
            This folder should only contain{" "}
            <span className="code text-white">.vpk</span> files and be outside
            of the game installation folder.
          </p>
        </span>
      </div>

      <div className="flex gap-2 flex-1">
        {storagePathLoading ? (
          <Skeleton className="h-10 flex-1" />
        ) : (
          <>
            <Input
              type="text"
              className="cursor-pointer text-sm h-10 flex-1"
              value={path ?? storagePath ?? "Select..."}
              readOnly
              onClick={selectGamePath}
            />
            <div
              className={cn(
                "flex items-center justify-center size-10 cursor-pointer",
                !storagePath &&
                  "disabled:cursor-not-allowed disabled:opacity-50"
              )}
              onClick={() => {
                if (storagePath) {
                  revealItemInDir(storagePath);
                }
              }}
            >
              <span className="icon-[lucide--external-link] size-6" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
