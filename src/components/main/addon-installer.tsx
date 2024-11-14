import { useInvoke, useInvokeMutate } from "@/api/useInvoke";
import { CollapsibleContent } from "@radix-ui/react-collapsible";
import { useCallback, useEffect, useState } from "react";
import { Collapsible, CollapsibleTrigger } from "../ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { useAddonConfigs } from "@/api/extras/mod-config";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";

export type InstallAddonConfig = {
  filePath: string;
  fileName: string;
  collidesWithInstalledAddon: boolean;
  collidesWithSelectedAddon: boolean;
  displayName: string;
  rename: { active: boolean; fileName: string };
};

export interface AddonInstallerProps {
  files: string[];
  setFiles: (files: string[]) => void;
}

export default function AddonInstaller({
  files,
  setFiles,
}: AddonInstallerProps) {
  const [entries, setEntries] = useState<InstallAddonConfig[]>([]);

  const { data: installedAddons, mutate: mutateInstalledAddons } = useInvoke(
    "list_installed_addons",
    undefined
  );
  const { data: addonConfigs } = useAddonConfigs();

  const { trigger: installAddon } = useInvokeMutate("install_addon");

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
          input: {
            filePath: file.filePath,
            displayName: file.displayName,
            fileName: file.rename.active ? file.rename.fileName : undefined,
          },
        })
      )
    );

    mutateInstalledAddons();
    setFiles([]);
  }, [entries, setFiles]);

  return (
    <Dialog open={files.length > 0}>
      <DialogContent aria-describedby={undefined} className="min-w-min">
        <DialogHeader>
          <DialogTitle>Import Addons</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {entries.map((entry) => (
            <Collapsible
              key={entry.filePath}
              className="py-2 px-4 border-surface-200 rounded-lg border"
            >
              <CollapsibleTrigger className="flex flex-row text-lg w-full items-center">
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
              <CollapsibleContent>
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
                                          .slice(1)}_dir.vpk`,
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
        <DialogFooter>
          <Button
            variant={"ghost"}
            onClick={() => {
              setFiles([]);
            }}
          >
            Cancel
          </Button>
          <Button onClick={() => installAddons()}>Import</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
