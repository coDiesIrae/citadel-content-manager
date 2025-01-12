import AddonEntry from "@/components/main/addon-entry";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";

export interface AddonCategoryProps {
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
  addons,
  name,
  filter,
}: AddonCategoryProps) {
  const [open, setOpen] = useState(false);

  const filteredAddons = useMemo(() => {
    if (!filter) return addons;
    if (name.toLowerCase().includes(filter)) return addons;

    return addons.filter(
      (addon) =>
        addon.path.toLowerCase().includes(filter) ||
        addon.displayName.toLowerCase().includes(filter)
    );
  }, [addons, filter, name]);

  return (
    <div className="flex flex-col">
      <div
        className="flex self-stretch flex-row justify-between cursor-pointer bg-surface-100/10 items-center p-3 rounded-lg"
        onClick={() => setOpen(!open)}
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
          "flex flex-col gap-3",
          open && filteredAddons.length > 0 && "mt-4"
        )}
      >
        {open &&
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
