import { atom } from "jotai";
import { atomWithStorage, unwrap } from "jotai/utils";
import { AsyncStorage } from "jotai/vanilla/utils/atomWithStorage";
import storeStorage from "./storage";

export type CategoryState = {
  expanded: boolean;
};

export type UIState = {
  categories: Record<number, CategoryState>;
};

export const defaultCategoryState: CategoryState = {
  expanded: false,
};

const storage = storeStorage<UIState>(".uistate");

const uiStateAtom = <K extends keyof UIState>(
  key: K,
  initialValue: UIState[K]
) =>
  atomWithStorage<UIState[K]>(
    key,
    initialValue,
    storage as unknown as AsyncStorage<UIState[K]>
  );

export const categoriesStateAtom = unwrap(uiStateAtom("categories", {}));

export const selectCategoryStateAtom = (categoryId: number) =>
  atom(
    (get) => {
      const categories = get(categoriesStateAtom);

      return categories?.[categoryId] ?? defaultCategoryState;
    },
    (_, set, newValue: CategoryState) => {
      set(categoriesStateAtom, async (old) => ({
        ...(await old),
        [categoryId]: newValue,
      }));
    }
  );
