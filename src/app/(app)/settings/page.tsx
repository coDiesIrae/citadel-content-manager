"use client";

import { DeployMethod } from "@/api/types";
import { useInvoke, useInvokeMutate } from "@/api/useInvoke";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { open } from "@tauri-apps/plugin-dialog";
import { useState } from "react";

export default function SettingsPage() {
  const { data: installPath, mutate: mutateInstallPath } = useInvoke(
    "get_install_path",
    undefined
  );
  const { data: symlinkAvailable, mutate: mutateSymlinkAvailable } = useInvoke(
    "is_symlink_available",
    undefined
  );

  const { data: deployMethod, mutate: mutateDeployMethod } = useInvoke(
    "get_deploy_method",
    undefined
  );

  const { trigger: setInstallPath } = useInvokeMutate("set_install_path");
  const { trigger: setDeployMethod } = useInvokeMutate("set_deploy_method");

  const [error, setError] = useState<string>();
  const [errorOpen, setErrorOpen] = useState(false);

  return (
    <div className="flex flex-col justify-start p-4 gap-4">
      <div className="self-stretch flex flex-row justify-between">
        <span className="font-extrabold text-3xl text-primary-200">
          Settings
        </span>
      </div>

      <div className="grid grid-cols-2 items-center gap-6">
        <div className="flex flex-col gap-1">
          <span className="font-bold text-lg">Addon storage path</span>
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
                setInstallPath({ installPath: result }).then((d) => {
                  if (d.error) {
                    setError(d.error);
                    setErrorOpen(true);
                  }
                });
                mutateInstallPath(undefined, {
                  populateCache: false,
                  revalidate: true,
                  optimisticData: {
                    success: true,
                    result,
                  },
                });
                mutateSymlinkAvailable();
              }
            });
          }}
        />

        <div className="flex flex-col gap-1">
          <span className="font-bold text-lg">Deploy method</span>
          <span className="text-primary-200 text-sm">
            How addons are deployed
          </span>
        </div>
        <Tabs
          value={deployMethod}
          onValueChange={async (s) => {
            const res = await setDeployMethod({
              deployMethod: s as DeployMethod,
            });

            if (res.error) {
              setError(res.error);
              setErrorOpen(true);
            } else {
              mutateDeployMethod(undefined, {
                populateCache: false,
                revalidate: true,
                optimisticData: {
                  success: true,
                  result: s as DeployMethod,
                },
              });
            }
          }}
        >
          <TabsList>
            <TabsTrigger value="Copy" className="text-xl">
              Copy
            </TabsTrigger>
            <TabsTrigger
              value="Symlink"
              disabled={!symlinkAvailable}
              className="text-xl"
            >
              Symlink
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Dialog open={errorOpen} onOpenChange={setErrorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>{error}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
