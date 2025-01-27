import { createStore } from "@tauri-apps/plugin-store";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

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

export const defaultUserData: UserData = {
  addons: {},
  completedOnboarding: false,
  categories: {},
};

async function getStore() {
  return await createStore(".userdata");
}

export default abstract class UserStore {
  static async getValue<T extends keyof UserData>(
    key: T
  ): Promise<UserData[T]> {
    const store = await getStore();

    return (await store.get<UserData[T]>(key)) ?? defaultUserData[key];
  }

  static useValue<T extends keyof UserData>(key: T) {
    return useSWR([key], ([k]) => UserStore.getValue(k));
  }

  static async setValue<T extends keyof UserData>(key: T, value: UserData[T]) {
    const store = await getStore();

    await store.set(key, value);

    await store.save();
  }

  static useMutateValue<T extends keyof UserData>(key: T) {
    return useSWRMutation([key], ([k], { arg }: { arg: UserData[T] }) =>
      UserStore.setValue(k, arg)
    );
  }

  static async getAddonMetadata(addonFileName: string) {
    const addons = await UserStore.getValue("addons");

    return (
      addons[addonFileName] ?? {
        displayName: addonFileName,
        category: CATEGORY_UNCATEGORIZED,
      }
    );
  }

  static useAddonMetadata(addonFileName: string) {
    return useSWR(["addonMetadata", addonFileName], ([, fileName]) =>
      UserStore.getAddonMetadata(fileName)
    );
  }

  static async getAddonMetadataBulk(addonFileNames: string[]) {
    const addons = await UserStore.getValue("addons");

    return addonFileNames.map((fileName) => ({
      fileName,
      metadata: addons[fileName] ?? {
        displayName: fileName,
        category: CATEGORY_UNCATEGORIZED,
      },
    }));
  }

  static useAddonMetadataBulk(addonFileNames: string[]) {
    return useSWR(["addonMetadataBulk", addonFileNames], ([, fileNames]) =>
      UserStore.getAddonMetadataBulk(fileNames)
    );
  }

  static async getAllAddonMetadata() {
    return await UserStore.getValue("addons");
  }

  static useAllAddonMetadata() {
    return useSWR(["list_addons_metadata"], UserStore.getAllAddonMetadata);
  }

  static async getCategories() {
    return (await UserStore.getValue("categories")) ?? {};
  }

  static useCategories() {
    return useSWR(["get_categories"], UserStore.getCategories);
  }

  static async setCategories(categories: Record<number, string>) {
    await UserStore.setValue("categories", categories);
  }

  static useMutateCategories() {
    return useSWRMutation(
      ["categories"],
      (_, { arg }: { arg: Record<number, string> }) =>
        UserStore.setCategories(arg)
    );
  }

  static async addCategory(name: string) {
    const categories = await UserStore.getCategories();

    const newId = Math.max(...Object.keys(categories).map(Number), 0) + 1;

    await UserStore.setCategories({
      ...categories,
      [newId]: name,
    });

    return newId;
  }

  static useMutateAddCategory() {
    return useSWRMutation(["add_category"], (_, { arg }: { arg: string }) =>
      UserStore.addCategory(arg)
    );
  }

  static async setAddonMetadata(
    addonFileName: string,
    metadata: AddonMetadata
  ) {
    const addons = await UserStore.getValue("addons");

    await UserStore.setValue("addons", {
      ...addons,
      [addonFileName]: metadata,
    });
  }

  static useMutateAddonMetadata() {
    return useSWRMutation(
      ["set_addon_metadata"],
      (_, { arg }: { arg: { fileName: string; metadata: AddonMetadata } }) =>
        UserStore.setAddonMetadata(arg.fileName, arg.metadata)
    );
  }

  static async setAddonMetadataBulk(metadata: Record<string, AddonMetadata>) {
    const addons = await UserStore.getValue("addons");

    await UserStore.setValue("addons", {
      ...addons,
      ...metadata,
    });
  }

  static useMutateAddonMetadataBulk() {
    return useSWRMutation(
      ["set_addon_metadata_bulk"],
      (_, { arg }: { arg: Record<string, AddonMetadata> }) =>
        UserStore.setAddonMetadataBulk(arg)
    );
  }
}
