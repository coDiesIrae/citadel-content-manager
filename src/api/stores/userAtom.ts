import { atom } from "jotai";
import { atomWithStorage, unwrap } from "jotai/utils";
import { AsyncStorage } from "jotai/vanilla/utils/atomWithStorage";
import storeStorage from "./storage";

export const CATEGORY_UNCATEGORIZED = -1;

export type AddonMetadata = {
  displayName: string;
  category: number;
};

export type UserData = {
  addons: Record<string, AddonMetadata>;
  completedOnboarding: boolean;
  categories: Record<number, string>;
};

export function defaultAddonMetadata(addonFileName: string): AddonMetadata {
  return {
    displayName: addonFileName,
    category: CATEGORY_UNCATEGORIZED,
  };
}

const storage = storeStorage<UserData>(".userdata");

const userStoreAtom = <K extends keyof UserData>(
  key: K,
  initialValue: UserData[K]
) =>
  atomWithStorage<UserData[K]>(
    key,
    initialValue,
    storage as unknown as AsyncStorage<UserData[K]>
  );

export const addonsMetadataAtom = unwrap(userStoreAtom("addons", {}));
export const categoryNamesAtom = unwrap(userStoreAtom("categories", {}));
export const completedOnboardingAtom = unwrap(
  userStoreAtom("completedOnboarding", false)
);

export const selectAddonMetadataAtom = (addonFileName: string) =>
  atom(
    (get) => {
      const addons = get(addonsMetadataAtom);

      return addons?.[addonFileName] ?? defaultAddonMetadata(addonFileName);
    },
    (_, set, newValue: AddonMetadata) => {
      set(addonsMetadataAtom, async (old) => ({
        ...(await old),
        [addonFileName]: newValue,
      }));
    }
  );
