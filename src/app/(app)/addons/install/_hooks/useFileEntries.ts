import { useInvoke } from "@/api/useInvoke";
import { installAddonsAtom } from "@/app/atoms/install";
import { useAtom } from "jotai";
import { useEffect, useReducer } from "react";

export type InstallAddonEntry = {
  filePath: string;

  fileName: string;

  collidesWithInstalledAddon: boolean;
  collidesWithSelectedAddon: boolean;

  displayName: string;

  rename: { active: boolean; fileName: string };
};

export type AddonEntryAction =
  | {
      type: "ENABLE_REPLACE";
      data: {
        filePath: string;
      };
    }
  | {
      type: "ENABLE_RENAME";
      data: {
        filePath: string;
      };
    }
  | {
      type: "SET_RENAME";
      data: {
        filePath: string;
        fileName: string;
      };
    }
  | {
      type: "SET_DISPLAY_NAME";
      data: {
        filePath: string;
        displayName: string;
      };
    }
  | {
      type: "SET_INSTALLED_ADDONS";
      data: {
        installedAddons: string[];
      };
    }
  | {
      type: "SET_FILENAMES";
      data: {
        fileNames: string[];
      };
    };

export type AddonEntryState = {
  entries: InstallAddonEntry[];
  installedAddons: string[];
};

function parseInitialEntries(fileNames: string[]): AddonEntryState {
  const entries = fileNames.map((f) => {
    const fileName = f.split("\\").pop() ?? f;

    return {
      filePath: f,
      collidesWithInstalledAddon: false,
      collidesWithSelectedAddon: false,
      displayName: fileName,
      rename: { active: false, fileName: fileName },
      fileName,
    };
  });

  filterEntries(entries, []);

  return {
    entries,
    installedAddons: [],
  };
}

function filterEntries(
  entries: InstallAddonEntry[],
  installedAddons: string[]
) {
  entries.forEach((entry) => {
    entry.collidesWithInstalledAddon = installedAddons.some(
      (installedAddon) => installedAddon === entry.fileName
    );

    entry.collidesWithSelectedAddon = entries.some((otherEntry) => {
      if (otherEntry === entry) {
        return false;
      }

      if (otherEntry.fileName === entry.fileName) {
        return true;
      }

      if (
        otherEntry.rename.active &&
        otherEntry.rename.fileName === entry.fileName
      ) {
        return true;
      }

      return false;
    });

    if (
      entry.collidesWithSelectedAddon ||
      (entry.collidesWithInstalledAddon &&
        entry.rename.active &&
        entry.rename.fileName === entry.fileName)
    ) {
      entry.rename.active = true;

      for (let i = 1; i < 99; i++) {
        const fileName = `pak${i.toString().padStart(2, "0")}_dir.vpk`;

        if (installedAddons.includes(fileName)) {
          continue;
        }

        if (entries.some((e) => e.fileName === fileName)) {
          continue;
        }

        if (
          entries.some((e) => e.rename.active && e.rename.fileName === fileName)
        ) {
          continue;
        }

        entry.rename.fileName = fileName;

        break;
      }
    }
  });
}

function installAddonsReducer(
  state: AddonEntryState,
  action: AddonEntryAction
) {
  switch (action.type) {
    case "ENABLE_REPLACE": {
      const { entries } = state;

      const entry = entries.find((e) => e.filePath === action.data.filePath)!;

      entry.rename = {
        active: false,
        fileName: entry.fileName,
      };

      filterEntries(entries, state.installedAddons);

      return { ...state, entries };
    }

    case "ENABLE_RENAME": {
      const { entries } = state;

      const entry = entries.find((e) => e.filePath === action.data.filePath)!;

      entry.rename.active = true;

      filterEntries(entries, state.installedAddons);

      return { ...state, entries };
    }

    case "SET_RENAME": {
      const { entries } = state;

      const entry = entries.find((e) => e.filePath === action.data.filePath)!;

      entry.rename.fileName = action.data.fileName;

      filterEntries(entries, state.installedAddons);

      return { ...state, entries };
    }

    case "SET_DISPLAY_NAME": {
      const { entries } = state;

      const entry = entries.find((e) => e.filePath === action.data.filePath)!;

      entry.displayName = action.data.displayName;

      filterEntries(entries, state.installedAddons);

      return { ...state, entries };
    }

    case "SET_INSTALLED_ADDONS": {
      const { entries } = state;

      state.installedAddons = action.data.installedAddons;

      filterEntries(entries, state.installedAddons);

      return { ...state };
    }

    case "SET_FILENAMES": {
      return parseInitialEntries(action.data.fileNames);
    }
  }
}

export default function useFileEntries() {
  const [fileNames] = useAtom(installAddonsAtom);

  const { data: installedAddons } = useInvoke(
    "list_managed_addons_app",
    undefined
  );

  const [state, dispatch] = useReducer(installAddonsReducer, {
    entries: [],
    installedAddons: [],
  });

  useEffect(() => {
    dispatch({
      type: "SET_FILENAMES",
      data: {
        fileNames,
      },
    });
  }, [fileNames]);

  useEffect(() => {
    if (installedAddons) {
      dispatch({
        type: "SET_INSTALLED_ADDONS",
        data: {
          installedAddons,
        },
      });
    }
  }, [installedAddons]);

  return [state, dispatch] as const;
}
