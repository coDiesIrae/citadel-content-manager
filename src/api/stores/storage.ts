import { createStore } from "@tauri-apps/plugin-store";
import { AsyncStorage } from "jotai/vanilla/utils/atomWithStorage";

export default function storeStorage<D>(name: string) {
  return {
    async getItem(key: string, initialValue: D[keyof D]) {
      const store = await createStore(name);

      return (await store.get<D[keyof D]>(key)) ?? initialValue;
    },

    async setItem(key: string, value: D[keyof D]) {
      const store = await createStore(name);

      await store.set(key, value);

      await store.save();
    },

    async removeItem(key: string) {
      const store = await createStore(name);

      await store.delete(key);

      await store.save();
    },
  } satisfies AsyncStorage<D[keyof D]>;
}
