import { Fragment } from "react";
import { InstallAddonEntry } from "../_hooks/useFileEntries";
import { Input } from "@/components/ui/input";

export interface EntryFileNameEditProps {
  entry: InstallAddonEntry;
  onEdit: (filePath: string, newName: string) => void;
}

export default function EntryFileNameEdit({
  entry,
  onEdit,
}: EntryFileNameEditProps) {
  if (!entry.rename.active) {
    return null;
  }

  return (
    <Fragment>
      <span>New file name</span>
      <span className="flex flex-row items-center gap-1">
        pak
        <Input
          type="text"
          className="w-11"
          value={entry.rename.fileName.split("_")[0].slice(3)}
          onChange={(e) =>
            onEdit(
              entry.filePath,
              `pak${e.target.value.padStart(2, "0").slice(-2)}_dir.vpk`
            )
          }
        />
        _dir.vpk
      </span>
    </Fragment>
  );
}
