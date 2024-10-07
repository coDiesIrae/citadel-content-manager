import { createStore } from "@tauri-apps/plugin-store";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

export type AddonConfig = {
  displayName: string;
};

export async function getAddonConfig(addonFileName: string) {
  const store = await createStore(".config");

  const config = (await store.get<Record<string, AddonConfig>>("addons")) ?? {};

  return (
    config[addonFileName] ?? {
      displayName: addonFileName,
    }
  );
}

export async function setAddonConfig(
  addonFileName: string,
  config: AddonConfig
) {
  const store = await createStore(".config");

  const currentConfig =
    (await store.get<Record<string, AddonConfig>>("addons")) ?? {};

  await store.set("addons", {
    ...currentConfig,
    [addonFileName]: config,
  });

  await store.save();
}

export function useAddonConfig(addonFileName: string) {
  return useSWR(["addonConfig", addonFileName], async ([_, addonFileName]) =>
    getAddonConfig(addonFileName)
  );
}

export function useAddonConfigMutation(addonFileName: string) {
  return useSWRMutation<void, never, [string], AddonConfig>(
    [addonFileName],
    ([addonFileName], { arg }) => setAddonConfig(addonFileName, arg)
  );
}
