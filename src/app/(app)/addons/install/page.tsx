"use client";

import { useAddonConfigs } from "@/api/extras/mod-config";
import { useInvoke, useInvokeMutate } from "@/api/useInvoke";
import { installAddonsAtom } from "@/app/atoms/install";
import { InstallAddonConfig } from "@/components/main/addon-installer";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function InstallAdonsPage() {
  const router = useRouter();

  const [files, setFiles] = useAtom(installAddonsAtom);
  const [entries, setEntries] = useState<InstallAddonConfig[]>([]);

  const { data: installedAddons, mutate: mutateInstalledAddons } = useInvoke(
    "list_managed_addons_app",
    undefined
  );
  const { data: addonConfigs } = useAddonConfigs();

  const { trigger: installAddon } = useInvokeMutate("manage_addon_app");

  const setEntriesValidateFileNames = useCallback(
    (entries: InstallAddonConfig[]) => {
      entries.forEach((entry) => {
        if (installedAddons) {
          entry.collidesWithInstalledAddon = installedAddons.some(
            (a) => a === entry.fileName
          );
        } else {
          entry.collidesWithInstalledAddon = false;
        }

        entry.collidesWithSelectedAddon = entries.some(
          (e) =>
            e !== entry &&
            (e.fileName === entry.fileName ||
              (e.rename.active && e.rename.fileName === entry.fileName))
        );

        if (
          entry.collidesWithSelectedAddon ||
          (entry.collidesWithInstalledAddon &&
            entry.rename.active &&
            entry.rename.fileName === entry.fileName)
        ) {
          entry.rename.active = true;

          for (let i = 1; i < 99; i++) {
            const fileName = `pak${i.toString().padStart(2, "0")}_dir.vpk`;

            if (installedAddons?.includes(fileName)) {
              continue;
            }

            if (entries.some((e) => e.fileName === fileName)) {
              continue;
            }

            if (
              entries.some(
                (e) => e.rename.active && e.rename.fileName === fileName
              )
            ) {
              continue;
            }

            entry.rename.fileName = fileName;
            break;
          }
        }
      });

      setEntries(entries);
    },
    [setEntries, installedAddons]
  );

  useEffect(() => {
    if (!files) return;
    if (files.length === 0) return;
    if (entries.length > 0) return;

    setEntriesValidateFileNames(
      files.map((f) => {
        const fileName = f.split("\\").pop() ?? f;

        return {
          filePath: f,
          collidesWithInstalledAddon: false,
          collidesWithSelectedAddon: false,
          displayName: fileName,
          rename: { active: false, fileName: fileName },
          fileName,
        };
      })
    );
  }, [files, entries, setEntriesValidateFileNames]);

  const installAddons = useCallback(async () => {
    await Promise.all(
      entries.map((file) =>
        installAddon({
          options: {
            addonPath: file.filePath,
            rename: file.rename.active ? file.rename.fileName : undefined,
          },
        })
      )
    );

    mutateInstalledAddons();
    setFiles([]);

    router.push("/addons");
  }, [entries, setFiles]);

  if (!files) {
    router.push("/addons");

    return null;
  }

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
                {entry.filePath.split("\\").pop()}
              </span>
              {(entry.collidesWithInstalledAddon ||
                entry.collidesWithInstalledAddon) && (
                <span className="icon-[lucide--triangle-alert] size-6 mr-2 text-yellow-600" />
              )}
              <span className="icon-[lucide--chevrons-up-down] size-6 ml-auto" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pb-2 px-4">
              <div className="grid grid-cols-2 gap-2 items-center mt-4">
                {entry.collidesWithInstalledAddon && (
                  <>
                    <span className="text-orange-300">
                      Entry collides with an installed addon
                    </span>
                    <Tabs value={entry.rename.active ? "rename" : "replace"}>
                      <TabsList>
                        <TabsTrigger
                          value="replace"
                          className="text-lg"
                          onClick={() => {
                            setEntriesValidateFileNames(
                              entries.map((en) =>
                                en.filePath === entry.filePath
                                  ? {
                                      ...en,
                                      rename: {
                                        active: false,
                                        fileName: en.fileName,
                                      },
                                    }
                                  : en
                              )
                            );
                          }}
                        >
                          Replace
                        </TabsTrigger>
                        <TabsTrigger
                          value="rename"
                          className="text-lg"
                          onClick={() => {
                            setEntriesValidateFileNames(
                              entries.map((en) =>
                                en.filePath === entry.filePath
                                  ? {
                                      ...en,
                                      rename: {
                                        active: true,
                                        fileName: en.rename.fileName,
                                      },
                                    }
                                  : en
                              )
                            );
                          }}
                        >
                          Rename
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </>
                )}
                {entry.rename.active && (
                  <>
                    <span>New file name</span>
                    <span className="flex flex-row items-center gap-1">
                      pak
                      <Input
                        type="text"
                        className="w-11"
                        value={entry.rename.fileName.split("_")[0].slice(3)}
                        onChange={(e) =>
                          setEntriesValidateFileNames(
                            entries.map((en) =>
                              en.filePath === entry.filePath
                                ? {
                                    ...en,
                                    rename: {
                                      ...en.rename,
                                      fileName: `pak${e.target.value
                                        .padStart(2, "0")
                                        .slice(-2)}_dir.vpk`,
                                    },
                                  }
                                : en
                            )
                          )
                        }
                      />
                      _dir.vpk
                    </span>
                  </>
                )}
                <span className="font-bold">Display Name:</span>{" "}
                <Input
                  type="text"
                  readOnly={
                    entry.collidesWithInstalledAddon && !entry.rename.active
                  }
                  disabled={
                    entry.collidesWithInstalledAddon && !entry.rename.active
                  }
                  value={
                    entry.collidesWithInstalledAddon && !entry.rename.active
                      ? addonConfigs?.[entry.fileName]?.displayName ??
                        entry.displayName
                      : entry.displayName
                  }
                  onChange={(e) =>
                    setEntriesValidateFileNames(
                      entries.map((en) =>
                        en.filePath === entry.filePath
                          ? { ...en, displayName: e.target.value }
                          : en
                      )
                    )
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
            setFiles([]);

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
