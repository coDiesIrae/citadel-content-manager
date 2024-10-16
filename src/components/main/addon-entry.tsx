"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { Input } from "../ui/input";
import {
  useAddonConfig,
  useAddonConfigMutation,
} from "@/api/extras/mod-config";
import { Button } from "../ui/button";
import { useState } from "react";
import { mutateInvoke, useInvokeMutate } from "@/api/useInvoke";

export interface AddonEntryProps {
  fileName: string;
  mounted?: boolean;
}

export default function AddonEntry({
  fileName,
  mounted = false,
}: AddonEntryProps) {
  const { data, mutate } = useAddonConfig(fileName);
  const { trigger } = useAddonConfigMutation(fileName);

  const { trigger: mountAddon } = useInvokeMutate("mount_addon");
  const { trigger: unmountAddon } = useInvokeMutate("unmount_addon");
  const { trigger: deleteAddon } = useInvokeMutate("uninstall_addon");

  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="rounded-xl bg-surface-500 p-4 flex flex-row items-center gap-4 border border-surface-100/30">
      <span className="icon-[lucide--file-cog] size-10" />

      <div className="flex flex-col gap-1 self-stretch">
        <span className="font-bold text-lg">{data?.displayName}</span>
        <span className="text-primary-200 text-sm">{fileName}</span>
      </div>

      <div className="flex flex-row gap-1 items-center ml-auto">
        <Sheet open={editOpen} onOpenChange={setEditOpen}>
          <SheetTrigger asChild>
            <button className="p-2 rounded-md flex bg-primary-500/30">
              <span className="icon-[lucide--edit] size-6 text-primary-500" />
            </button>
          </SheetTrigger>
          <SheetContent aria-describedby={undefined} className="flex flex-col">
            <SheetHeader className="mb-6">
              <SheetTitle>Edit addon</SheetTitle>
            </SheetHeader>
            <form
              action={async (data) => {
                const newDisplayName = data.get("display_name");

                if (!newDisplayName) return;

                trigger({
                  ...data,
                  displayName: newDisplayName?.toString() ?? undefined,
                }).then(() => {
                  mutate();
                });

                setEditOpen(false);
              }}
              className="flex flex-col gap-2 flex-1"
            >
              <div className="flex flex-row gap-4 items-center">
                <label htmlFor="display_name">Name</label>
                <Input
                  id="display_name"
                  name="display_name"
                  defaultValue={data?.displayName}
                  autoFocus={false}
                  autoComplete="off"
                  autoCorrect="off"
                />
              </div>

              <Button type="submit" className="mt-auto">
                Save
              </Button>
              {!mounted && (
                <Button
                  variant="destructive"
                  type="button"
                  onClick={async () => {
                    await deleteAddon({ addonFileName: fileName });

                    mutateInvoke("list_installed_addons");
                    mutateInvoke("list_mounted_addons");

                    setEditOpen(false);
                  }}
                >
                  Delete
                </Button>
              )}
            </form>
          </SheetContent>
        </Sheet>

        {mounted ? (
          <button
            className="p-2 rounded-md flex bg-primary-500/30"
            onClick={async () => {
              await unmountAddon({ addonFileName: fileName });

              mutateInvoke("list_installed_addons");
              mutateInvoke("list_mounted_addons");
            }}
          >
            <span className="icon-[lucide--download] size-6 text-primary-500" />
          </button>
        ) : (
          <button
            className="p-2 rounded-md flex bg-primary-500/30"
            onClick={async () => {
              await mountAddon({ addonFileName: fileName });

              mutateInvoke("list_installed_addons");
              mutateInvoke("list_mounted_addons");
            }}
          >
            <span className="icon-[lucide--upload] size-6 text-primary-500" />
          </button>
        )}
      </div>
    </div>
  );
}
