import { selectAddonMetadataAtom } from "@/api/stores/userAtom";
import { Input } from "@/components/ui/input";
import { useAtom } from "jotai";
import { Fragment, useMemo } from "react";
import { InstallAddonEntry } from "../_hooks/useFileEntries";

export interface EntryDisplayNameEditProps {
  entry: InstallAddonEntry;
  onEdit: (filePath: string, newName: string) => void;
}

export default function EntryDisplayNameEdit({
  entry,
  onEdit,
}: EntryDisplayNameEditProps) {
  const [addonConfig] = useAtom(
    useMemo(() => selectAddonMetadataAtom(entry.fileName), [entry.fileName])
  );

  const disabled = entry.collidesWithInstalledAddon && !entry.rename.active;

  return (
    <Fragment>
      <span className="font-bold">Display Name:</span>{" "}
      <Input
        type="text"
        readOnly={disabled}
        disabled={disabled}
        value={
          disabled
            ? addonConfig?.displayName ?? entry.displayName
            : entry.displayName
        }
        onChange={(e) => {
          onEdit(entry.filePath, e.target.value);
        }}
      />
    </Fragment>
  );
}
