"use client";

import { Command } from "@/api/commands";
import { DeployMethod } from "@/api/types";
import { mutateInvoke, useInvoke, useInvokeMutate } from "@/api/useInvoke";
import { Button } from "@/components/ui/button";
import { useCallback, useState } from "react";
import DeployMethodSelector from "./_components/deploy-method-selector";
import ErrorDialog from "./_components/error-dialog";
import GamePathSelector from "./_components/game-path-selector";
import StoragePathSelector from "./_components/storage-path-selector";
import { toast } from "sonner";
import { genericAppErrorMessage } from "@/api/errorMessages/app";
import { mountAddonErrorMessage } from "@/api/errorMessages/mountAddon";
import { Separator } from "@/components/ui/separator";
import SearchPathsSetup from "./_components/search-paths-setup";

export interface Settings {
  gamePath: string;
  storagePath: string;
  deployMethod: DeployMethod;
}

export default function SettingsPage() {
  const { data: mountedAddons } = useInvoke(
    "list_mounted_addons_app",
    undefined
  );

  const { trigger: setCustomGamePath } = useInvokeMutate(
    "set_custom_game_path_app"
  );
  const { trigger: setStoragePath } = useInvokeMutate("set_storage_path_app");
  const { trigger: setDeployMethod } = useInvokeMutate("set_deploy_method_app");

  const { trigger: mountAddon } = useInvokeMutate("mount_addon_app");
  const { trigger: unmountAddon } = useInvokeMutate("unmount_addon_app");

  const [settings, setSettings] = useState<Partial<Settings>>({});

  const setValue = useCallback(
    <K extends keyof Settings>(key: K) =>
      (value: Settings[K] | undefined) => {
        setSettings((prev) => ({
          ...prev,
          [key]: value,
        }));
      },
    []
  );

  const [error, setError] = useState<{
    show: boolean;
    message: string;
    onClose?: () => void;
  }>({
    show: false,
    message: "",
  });

  const setErrorMessage = useCallback(
    (message: string, onClose?: () => void) => {
      setError({
        show: true,
        message,
        onClose,
      });
    },
    []
  );

  const onReset = useCallback(() => {
    setSettings({});
  }, []);

  const onSave = useCallback(async () => {
    const promises = [];

    const refresh = new Set<Command>();

    const addons = [...(mountedAddons ?? [])];
    const remountAddons =
      settings.deployMethod !== undefined ||
      settings.gamePath !== undefined ||
      settings.storagePath !== undefined;

    if (remountAddons) {
      const res = await Promise.all(
        addons.map((a) =>
          unmountAddon({ addonName: a }).then((r) => ({
            ...r,
            addonName: a,
          }))
        )
      );

      const err = res.find((r) => !r.success);

      if (err) {
        toast.error(
          <div className="flex flex-col gap-2">
            <span className="text-xl font-semibold">
              {err.addonName} - An error occurred while unmounting addons
            </span>
            <span className="text-base">
              {genericAppErrorMessage(err.error, mountAddonErrorMessage)}
            </span>
          </div>
        );

        return;
      }
    }

    if (settings.gamePath) {
      promises.push(setCustomGamePath({ customGamePath: settings.gamePath }));

      refresh.add("get_game_path_app");
      refresh.add("get_search_paths_state_app");
      refresh.add("list_mounted_addons_app");
      refresh.add("list_managed_addons_app");
      refresh.add("get_deploy_method_app");
    }

    if (settings.storagePath) {
      promises.push(setStoragePath({ storagePath: settings.storagePath }));

      refresh.add("get_storage_path_app");
      refresh.add("list_mounted_addons_app");
      refresh.add("list_managed_addons_app");
      refresh.add("get_deploy_method_app");
    }

    if (settings.deployMethod) {
      promises.push(setDeployMethod({ deployMethod: settings.deployMethod }));

      refresh.add("list_mounted_addons_app");
      refresh.add("list_managed_addons_app");
      refresh.add("get_deploy_method_app");
    }

    {
      const result = await Promise.all(promises);

      const errors = result.find((r) => !r.success);

      if (errors) {
        toast.error(
          <div className="flex flex-col gap-2">
            <span className="text-xl font-semibold">
              An error occurred while saving settings
            </span>
            <span className="text-base">
              See the error log for more information
            </span>
          </div>
        );
      }
    }

    if (remountAddons) {
      const res = await Promise.all(
        addons.map((a) =>
          mountAddon({ addonName: a }).then((r) => ({ ...r, addonName: a }))
        )
      );

      const err = res.find((r) => !r.success);

      if (err) {
        toast.error(
          <div className="flex flex-col gap-2">
            <span className="text-xl font-semibold">
              <span className="code">{err.addonName}</span> - An error occurred
              while remounting addons
            </span>
            <span className="text-base">
              {genericAppErrorMessage(err.error, mountAddonErrorMessage)}
            </span>
          </div>
        );
      }
    }

    refresh.forEach((c) => mutateInvoke(c));

    setSettings({});
  }, [
    settings,
    setCustomGamePath,
    setStoragePath,
    setDeployMethod,
    mountAddon,
    mountedAddons,
    unmountAddon,
  ]);

  return (
    <div className="flex flex-col justify-start p-4 gap-4">
      <div className="self-stretch flex flex-row justify-between">
        <span className="font-extrabold text-3xl text-primary-200">
          Settings
        </span>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            disabled={Object.keys(settings).length === 0}
            onClick={onReset}
          >
            Reset
          </Button>
          <Button
            disabled={Object.keys(settings).length === 0}
            onClick={onSave}
          >
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 items-center gap-6">
        <GamePathSelector
          path={settings.gamePath}
          setPath={setValue("gamePath")}
          setError={setErrorMessage}
        />
        <StoragePathSelector
          path={settings.storagePath}
          setPath={setValue("storagePath")}
          setError={setErrorMessage}
        />
        <DeployMethodSelector
          deployMethod={settings.deployMethod}
          setDeployMethod={setValue("deployMethod")}
          setError={setErrorMessage}
        />
      </div>

      <Separator className="my-6" />

      <div className="grid grid-cols-2 items-center gap-6">
        <SearchPathsSetup />
      </div>

      <ErrorDialog error={error} setError={setError} />
    </div>
  );
}
