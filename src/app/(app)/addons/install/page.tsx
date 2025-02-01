"use client";

import { genericAppErrorMessage } from "@/api/errorMessages/app";
import { manageAddonErrorMessage } from "@/api/errorMessages/manageAddon";
import {
  addonsMetadataAtom,
  defaultAddonMetadata,
} from "@/api/stores/userAtom";
import { useInvoke, useInvokeMutate } from "@/api/useInvoke";
import { installAddonsAtom } from "@/app/atoms/install";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";
import EntryCollisionHeader from "./_components/entry-collision-header";
import EntryDisplayNameEdit from "./_components/entry-display-name-edit";
import EntryFileNameEdit from "./_components/entry-file-name-edit";
import useFileEntries from "./_hooks/useFileEntries";

export default function InstallAdonsPage() {
  const router = useRouter();

  const [{ entries }, dispatchEntries] = useFileEntries();

  const [, setFileNames] = useAtom(installAddonsAtom);
  const [, setAddonMetadata] = useAtom(addonsMetadataAtom);

  const { mutate: mutateInstalledAddons } = useInvoke(
    "list_managed_addons_app",
    undefined
  );

  const { trigger: installAddon } = useInvokeMutate("manage_addon_app");

  const installAddons = useCallback(async () => {
    await Promise.all(
      entries.map(async (file) => {
        const res = await installAddon({
          options: {
            addonPath: file.filePath,
            rename: file.rename.active ? file.rename.fileName : undefined,
          },
        });

        if (res.success) {
          setAddonMetadata(async (previousMetadata) => {
            const currentMetadata = await previousMetadata;

            return {
              ...currentMetadata,
              [file.fileName]: {
                ...defaultAddonMetadata(file.fileName),
                ...currentMetadata[file.fileName],
                displayName: file.displayName,
              },
            };
          });
        } else {
          toast.error(
            <div className="flex flex-col gap-2">
              <span className="text-xl font-semibold text-primary-200">
                {file.fileName} - An error occurred while installing addon
              </span>
              <span className="text-base">
                {genericAppErrorMessage(res.error, manageAddonErrorMessage)}
              </span>
            </div>
          );
        }
      })
    );

    mutateInstalledAddons();
    setFileNames([]);

    router.push("/addons");
  }, [
    entries,
    setFileNames,
    installAddon,
    mutateInstalledAddons,
    setAddonMetadata,
    router,
  ]);

  return (
    <div className="flex flex-col justify-start h-full">
      <div className="self-stretch flex flex-row justify-between p-4">
        <span className="font-extrabold text-3xl text-primary-200">
          Import Addons
        </span>
      </div>

      <div className="flex flex-col flex-1 overflow-auto scrollbar-none px-4 pb-2 gap-6">
        {entries.map((entry) => (
          <Collapsible
            key={entry.filePath}
            className="border-surface-200 rounded-lg border"
          >
            <CollapsibleTrigger className="flex flex-row text-lg w-full items-center py-2 px-4">
              <span className="text-white/50">
                {entry.filePath.split("\\").slice(0, -1).join("\\")}\
              </span>
              <span className="text-primary-500 font-bold mr-2">
                {entry.fileName}
              </span>
              {(entry.collidesWithInstalledAddon ||
                entry.collidesWithSelectedAddon) && (
                <span className="icon-[lucide--triangle-alert] size-6 mr-2 text-yellow-600" />
              )}
              <span className="icon-[lucide--chevrons-up-down] size-6 ml-auto" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pb-2 px-4">
              <div className="grid grid-cols-2 gap-2 items-center mt-4">
                <EntryCollisionHeader
                  entry={entry}
                  onEnableRename={(filePath) =>
                    dispatchEntries({
                      type: "ENABLE_RENAME",
                      data: {
                        filePath,
                      },
                    })
                  }
                  onEnableReplace={(filePath) =>
                    dispatchEntries({
                      type: "ENABLE_REPLACE",
                      data: {
                        filePath,
                      },
                    })
                  }
                />

                <EntryDisplayNameEdit
                  entry={entry}
                  onEdit={(filePath, newName) =>
                    dispatchEntries({
                      type: "SET_DISPLAY_NAME",
                      data: {
                        filePath,
                        displayName: newName,
                      },
                    })
                  }
                />

                <EntryFileNameEdit
                  entry={entry}
                  onEdit={(filePath, newName) =>
                    dispatchEntries({
                      type: "SET_RENAME",
                      data: {
                        filePath,
                        fileName: newName,
                      },
                    })
                  }
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
      <div className="flex flex-row justify-end space-x-2 mt-auto p-4">
        <Button
          variant={"ghost"}
          onClick={() => {
            setFileNames([]);

            router.back();
          }}
        >
          Cancel
        </Button>
        <Button onClick={() => installAddons()}>Import</Button>
      </div>
    </div>
  );
}
