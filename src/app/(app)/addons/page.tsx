"use client";

import UserStore, { CATEGORY_UNCATEGORIZED } from "@/api/stores/userData";
import { useInvoke, useInvokeMutate } from "@/api/useInvoke";
import AddonInstaller from "@/components/main/addon-installer";
import FileDropListener from "@/components/main/file-drop-listener";
import { Input } from "@/components/ui/input";
import { useCallback, useMemo, useState } from "react";
import AddonCategory from "./_components/addon-category";

export default function Home() {
  const [files, setFiles] = useState<string[]>([]);

  const { data: managedAddons } = useInvoke(
    "list_managed_addons_app",
    undefined
  );

  const { data: mountedAddons } = useInvoke(
    "list_mounted_addons_app",
    undefined
  );

  const { data: addonMetadata } = UserStore.useAllAddonMetadata();
  const { data: categories } = UserStore.useCategories();

  const { trigger: installAddon } = useInvokeMutate("manage_addon_app");

  const [filter, setFilter] = useState("");

  const installAddons = useCallback(
    async (files: string[]) => {
      setFiles(files);
    },
    [installAddon]
  );

  const groupedAddons = useMemo(() => {
    if (!addonMetadata) return {};
    if (!categories) return {};

    const m = {} as Record<
      number,
      {
        name: string;
        addons: {
          path: string;
          mounted: boolean;
          managed: boolean;
          displayName: string;
        }[];
      }
    >;

    for (const [id, name] of Object.entries(categories)) {
      m[parseInt(id)] = {
        addons: [],
        name,
      };
    }

    const allAddons = [
      ...(managedAddons ?? []),
      ...(mountedAddons ?? []),
    ].filter((item, index, array) => array.indexOf(item) === index);

    for (const addon of allAddons) {
      const category = addonMetadata[addon]?.category ?? CATEGORY_UNCATEGORIZED;

      m[category] = m[category] ?? {
        addons: [],
        name: categories[category] ?? "Uncategorized",
      };

      m[category].addons.push({
        path: addon,
        managed: managedAddons?.includes(addon) ?? false,
        mounted: mountedAddons?.includes(addon) ?? false,
        displayName: addonMetadata[addon]?.displayName ?? addon,
      });
    }

    return m;
  }, [managedAddons, mountedAddons, addonMetadata, categories]);

  return (
    <div className="flex flex-col justify-start h-full">
      <FileDropListener onDrop={installAddons} />
      <AddonInstaller files={files} setFiles={setFiles} />

      <div className="self-stretch flex flex-row justify-between p-4">
        <span className="font-extrabold text-3xl text-primary-200">Addons</span>
      </div>

      <div className="self-stretch flex flex-row gap-1 items-center p-4">
        <span className="icon-[lucide--search] size-6" />
        <Input
          className="border-white/60 border-none text-lg"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value.toLowerCase());
          }}
          placeholder="Search..."
        />
      </div>

      <div className="flex flex-col flex-1 overflow-auto scrollbar-none px-4 pb-2 gap-6">
        {Object.entries(groupedAddons).map(([_, { name, addons }], index) => (
          <AddonCategory
            key={index}
            name={name}
            addons={addons}
            filter={filter}
          />
        ))}
      </div>
    </div>
  );
}
