"use client";

import { useInvoke, useInvokeMutate } from "@/api/useInvoke";
import { Input } from "@/components/ui/input";
import { open } from "@tauri-apps/plugin-dialog";

export default function SettingsPage() {
  const { data: installPath, mutate: mutateInstallPath } = useInvoke(
    "get_install_path",
    undefined
  );

  const { trigger: setInstallPath } = useInvokeMutate("set_install_path");

  return (
    <div className="flex flex-col justify-start p-4 gap-4">
      <div className="self-stretch flex flex-row justify-between">
        <span className="font-extrabold text-3xl text-primary-200">
          Settings
        </span>
      </div>
      <div className="grid grid-cols-2 items-center gap-6">
        <div className="flex flex-col gap-1">
          <span className="font-bold text-lg">Addon install path</span>
          <span className="text-primary-200 text-sm">
            The path where all your addons will be stored
          </span>
        </div>
        <Input
          type="text"
          className="cursor-pointer text-lg h-10"
          value={installPath ?? "Select..."}
          readOnly
          onClick={() => {
            open({
              directory: true,
              multiple: false,
              canCreateDirectories: true,
              title: "Select addons install path",
            }).then((result) => {
              if (result !== null) {
                setInstallPath({ installPath: result });
                mutateInstallPath(undefined, {
                  populateCache: false,
                  revalidate: true,
                  optimisticData: {
                    success: true,
                    result,
                  },
                });
              }
            });
          }}
        />
      </div>
    </div>
  );
}
