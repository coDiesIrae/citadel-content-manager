"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { Input } from "../ui/input";
import { Addon, DeployState } from "@/app/(app)/addons/page";

export interface AddonEntryProps {
  addon: Addon;
}

export default function AddonEntry({ addon }: AddonEntryProps) {
  return (
    <div className="rounded-xl bg-surface-500 p-4 flex flex-row items-center gap-4 border border-surface-100/30">
      <span className="icon-[lucide--file-cog] size-10" />

      <div className="flex flex-col gap-1 self-stretch">
        <span className="font-bold text-lg">{addon.name}</span>
        <span className="text-primary-200 text-sm">{addon.fileName}</span>
      </div>

      <div className="flex flex-row gap-1 items-center ml-auto">
        <Sheet>
          <SheetTrigger asChild>
            <button className="p-2 rounded-md flex bg-primary-500/30">
              <span className="icon-[lucide--edit] size-6 text-primary-500" />
            </button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader className="mb-6">
              <SheetTitle>Edit addon</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-6">
              <div className="flex flex-row gap-4 items-center">
                <span>Name</span>
                <Input defaultValue={addon.name} />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {addon.deployState === DeployState.Deployed ||
        addon.deployState === DeployState.Undeploying ? (
          <button className="p-2 rounded-md flex bg-primary-500/30">
            <span className="icon-[lucide--download] size-6 text-primary-500" />
          </button>
        ) : (
          <button className="p-2 rounded-md flex bg-primary-500/30">
            <span className="icon-[lucide--upload] size-6 text-primary-500" />
          </button>
        )}
        <button className="p-2 rounded-md flex bg-red-500/30">
          <span className="icon-[lucide--trash-2] size-6 text-red-500" />
        </button>
      </div>
    </div>
  );
}
