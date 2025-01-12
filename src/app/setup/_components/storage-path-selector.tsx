import { genericAppErrorMessage } from "@/api/errorMessages/app";
import { storagePathErrorMessage } from "@/api/errorMessages/storagePath";
import { mutateInvoke, useInvoke, useInvokeMutate } from "@/api/useInvoke";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { open } from "@tauri-apps/plugin-dialog";
import { useCallback } from "react";

export interface StoragePathSelectorProps {
  setError: (error: string, onClose?: () => void) => void;
}

export default function StoragePathSelector({
  setError,
}: StoragePathSelectorProps) {
  const {
    data: storagePath,
    isLoading: storagePathLoading,
    mutate: mutateStoragePath,
  } = useInvoke("get_storage_path_app", undefined);

  const { trigger: validateStoragePath } = useInvokeMutate(
    "validate_storage_path_app"
  );
  const { trigger: setStoragePath } = useInvokeMutate("set_storage_path_app");

  const selectStoragePath = useCallback(async () => {
    const chosenPath = await open({
      directory: true,
      multiple: false,
      canCreateDirectories: true,
      title: "Select game installation path",
    });

    if (!chosenPath) return;

    const validateResult = await validateStoragePath({
      storagePath: chosenPath,
    });

    if (validateResult.success) {
      const setResult = await setStoragePath({ storagePath: chosenPath });

      if (setResult.success) {
        mutateStoragePath(
          { success: true, result: chosenPath },
          {
            populateCache: true,
            revalidate: false,
          }
        );

        mutateInvoke("get_deploy_method_app");
        mutateInvoke("list_managed_addons_app");
      } else {
        setError(
          genericAppErrorMessage(setResult.error, storagePathErrorMessage),
          selectStoragePath
        );
      }
    } else {
      setError(
        genericAppErrorMessage(validateResult.error, storagePathErrorMessage),
        selectStoragePath
      );
    }
  }, [setStoragePath]);

  return (
    <>
      <div className="flex flex-col gap-1">
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

      {storagePathLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <Input
          type="text"
          className="cursor-pointer text-sm h-10"
          value={storagePath ?? "Select..."}
          readOnly
          onClick={selectStoragePath}
        />
      )}
    </>
  );
}
