"use client";

import UserStore from "@/api/stores/userData";
import { mutateInvoke, useInvokeMutate } from "@/api/useInvoke";
import { useState } from "react";
import { Switch } from "../ui/switch";
import AddonEdit from "./addon-edit";

export interface AddonEntryProps {
  fileName: string;
  mounted?: boolean;
}

export default function AddonEntry({
  fileName,
  mounted = false,
}: AddonEntryProps) {
  const { data: metadata } = UserStore.useAddonMetadata(fileName);

  const { trigger: mountAddon } = useInvokeMutate("mount_addon_app");
  const { trigger: unmountAddon } = useInvokeMutate("unmount_addon_app");

  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="rounded-xl bg-surface-500 p-4 flex flex-row items-center gap-4 border border-surface-100/30">
      <Switch
        checked={mounted}
        onCheckedChange={async () => {
          let res;

          if (mounted) {
            res = await unmountAddon({ addonName: fileName });
          } else {
            res = await mountAddon({ addonName: fileName });
          }

          if (res.success) {
            mutateInvoke("list_managed_addons_app");
            mutateInvoke("list_mounted_addons_app");
          }
        }}
      />

      <div className="flex flex-col gap-1 self-stretch">
        <span className="font-bold text-lg">{metadata?.displayName}</span>
        <span className="text-primary-200 text-sm">{fileName}</span>
      </div>

      <div className="flex flex-row gap-1 items-center ml-auto">
        <AddonEdit
          open={editOpen}
          setOpen={setEditOpen}
          fileName={fileName}
          mounted={mounted}
        />
      </div>
    </div>
  );
}
