import { selectCategoryStateAtom } from "@/api/stores/uiAtom";
import AddonEntry from "@/components/main/addon-entry";
import { cn } from "@/lib/utils";
import { useAtom } from "jotai";
import { useMemo } from "react";

export interface AddonCategoryProps {
  id: number;

  name: string;
  addons: {
    path: string;
    mounted: boolean;
    managed: boolean;
    displayName: string;
  }[];

  filter?: string;
}

export default function AddonCategory({
  id,
  addons,
  name,
  filter,
}: AddonCategoryProps) {
  const [categoryState, setCategoryState] = useAtom(
    useMemo(() => selectCategoryStateAtom(id), [id])
  );

  const filteredAddons = useMemo(() => {
    if (!filter) return addons;
    if (name.toLowerCase().includes(filter)) return addons;

    return addons.filter(
      (addon) =>
        addon.path.toLowerCase().includes(filter) ||
        addon.displayName.toLowerCase().includes(filter)
    );
  }, [addons, filter, name]);

  if (filteredAddons.length === 0) return null;

  return (
    <div className="flex flex-col">
      <div
        className="flex self-stretch flex-row justify-between cursor-pointer bg-surface-100/10 items-center px-3 py-1.5 rounded-md"
        onClick={() => {
          setCategoryState({ expanded: !categoryState.expanded });
        }}
      >
        <span className="font-bold text-lg">
          {name} - {filteredAddons.length}
        </span>
        <span
          className={cn(
            "icon-[lucide--chevron-down] size-6",
            !open && "-rotate-90"
          )}
        />
      </div>

      <div
        className={cn(
          "flex flex-col gap-1",
          categoryState.expanded && filteredAddons.length > 0 && "mt-2"
        )}
      >
        {categoryState.expanded &&
          filteredAddons.map((item) => (
            <AddonEntry
              key={item.path}
              fileName={item.path}
              mounted={item.mounted}
            />
          ))}
      </div>
    </div>
  );
}
