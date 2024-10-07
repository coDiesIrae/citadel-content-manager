"use client";

import { useInvoke, useInvokeMutate } from "@/api/useInvoke";
import AddonEntry from "@/components/main/addon-entry";
import { Button } from "@/components/ui/button";
import { open } from "@tauri-apps/plugin-dialog";
import { useMemo } from "react";

export default function Home() {
  const { data: installedAddons, mutate: mutateInstalledAddons } = useInvoke(
    "list_installed_addons",
    undefined
  );
  const { data: mountedAddons } = useInvoke("list_mounted_addons", undefined);

  const { trigger: installAddon } = useInvokeMutate("install_addon");

  const notMountedAddons = useMemo(() => {
    if (!installedAddons || !mountedAddons) return [];

    return installedAddons.filter((a) => !mountedAddons.includes(a));
  }, [installedAddons, mountedAddons]);

  return (
    <div className="flex flex-col justify-start">
      <div className="self-stretch flex flex-row justify-between p-4">
        <span className="font-extrabold text-3xl text-primary-200">Addons</span>
        <Button
          className="ml-auto flex items-center gap-1"
          onClick={async () => {
            const r = await open({
              directory: false,
              multiple: false,
              filters: [
                {
                  name: "VPK files",
                  extensions: ["vpk"],
                },
              ],
            });

            if (r) {
              const { success } = await installAddon({
                filePath: r,
              });

              if (success) {
                mutateInstalledAddons();
              }
            }
          }}
        >
          <span className="icon-[lucide--plus] size-5" />
          <span className="text-lg font-semibold pr-1">Add</span>
        </Button>
      </div>
      <div className="flex flex-col flex-1 overflow-auto scrollbar-none gap-10 px-4 pb-2">
        <div className="flex flex-col gap-4">
          <span className="font-bold text-lg">Mounted</span>
          <div className="h-[1px] w-full bg-surface-100/30" />
          <div className="flex flex-col gap-6">
            {mountedAddons?.map((item, index) => (
              <AddonEntry key={index} fileName={item} mounted />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <span className="font-bold text-lg">Installed</span>
          <div className="h-[1px] w-full bg-surface-100/30" />
          <div className="flex flex-col gap-6">
            {notMountedAddons.map((item, index) => (
              <AddonEntry key={index} fileName={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}