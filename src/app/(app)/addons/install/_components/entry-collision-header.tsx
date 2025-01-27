import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InstallAddonEntry } from "../_hooks/useFileEntries";
import { Fragment } from "react";

export interface EntryCollisionHeaderProps {
  entry: InstallAddonEntry;
  onEnableReplace: (filePath: string) => void;
  onEnableRename: (filePath: string) => void;
}

export default function EntryCollisionHeader({
  entry,
  onEnableRename,
  onEnableReplace,
}: EntryCollisionHeaderProps) {
  if (!entry.collidesWithInstalledAddon) {
    return null;
  }

  return (
    <Fragment>
      <span className="text-orange-300">
        Entry collides with an installed addon
      </span>
      <Tabs value={entry.rename.active ? "rename" : "replace"}>
        <TabsList>
          <TabsTrigger
            value="replace"
            className="text-lg"
            onClick={() => {
              onEnableReplace(entry.filePath);
            }}
          >
            Replace
          </TabsTrigger>
          <TabsTrigger
            value="rename"
            className="text-lg"
            onClick={() => {
              onEnableRename(entry.filePath);
            }}
          >
            Rename
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </Fragment>
  );
}
