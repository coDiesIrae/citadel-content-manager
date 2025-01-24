import { createStore } from "@tauri-apps/plugin-store";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

export type CategoryState = {
  expanded: boolean;
};

export type UIState = {
  categories: Record<number, CategoryState>;
};

export const defaultCategoryState: CategoryState = {
  expanded: false,
};

export const defaultUIState: UIState = {
  categories: {},
};

async function getStore() {
  return await createStore(".uistate");
}

export default abstract class UIStateStore {
  static async getValue<T extends keyof UIState>(key: T): Promise<UIState[T]> {
    const store = await getStore();

    return (await store.get<UIState[T]>(key)) ?? defaultUIState[key];
  }

  static async setValue<T extends keyof UIState>(key: T, value: UIState[T]) {
    const store = await getStore();

    await store.set(key, value);

    await store.save();
  }

  static useValue<T extends keyof UIState>(key: T) {
    return useSWR([key], ([k]) => UIStateStore.getValue(k));
  }

  static useMutateValue<T extends keyof UIState>(key: T) {
    return useSWRMutation([key], ([k], { arg }: { arg: UIState[T] }) =>
      UIStateStore.setValue(k, arg)
    );
  }

  static async getCategoryState(category: number) {
    const categories = await UIStateStore.getValue("categories");

    return categories[category] ?? defaultCategoryState;
  }

  static async setCategoryState(
    category: number,
    state: Partial<CategoryState>
  ) {
    const categories = await UIStateStore.getValue("categories");

    await UIStateStore.setValue("categories", {
      ...categories,
      [category]: {
        ...defaultCategoryState,
        ...categories[category],
        ...state,
      },
    });
  }

  static useCategoryState(category: number) {
    return useSWR([category], ([c]) => UIStateStore.getCategoryState(c));
  }

  static useMutateCategoryState(category: number) {
    return useSWRMutation([category], ([c], { arg }: { arg: CategoryState }) =>
      UIStateStore.setCategoryState(c, arg)
    );
  }
}
