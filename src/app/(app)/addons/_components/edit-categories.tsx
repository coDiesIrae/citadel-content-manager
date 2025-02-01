import { categoriesStateAtom } from "@/api/stores/uiAtom";
import {
  addonsMetadataAtom,
  CATEGORY_UNCATEGORIZED,
  categoryNamesAtom,
} from "@/api/stores/userAtom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Reorder, useDragControls } from "framer-motion";
import { useAtom } from "jotai";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { mutate } from "swr";

type CategoryEntry = {
  id: number;
  title: string;
  renameActive: boolean;
  markedForDeletion: boolean;
};

interface CategoryItemProps {
  category: CategoryEntry;
  setCategories: Dispatch<SetStateAction<CategoryEntry[]>>;
}

function CategoryItem({ category, setCategories }: CategoryItemProps) {
  const controls = useDragControls();

  if (category.markedForDeletion) {
    return null;
  }

  return (
    <Reorder.Item
      value={category}
      className="p-2 bg-surface-400 rounded-md border border-primary-100/15 flex flex-row gap-2 items-center"
      dragListener={false}
      dragControls={controls}
    >
      <span
        className="icon-[lucide--grip-vertical] size-4 cursor-pointer select-none"
        onPointerDown={(e) => controls.start(e)}
      />

      {category.renameActive ? (
        <Input
          className="outline-none bg-transparent text-lg flex-1 h-auto p-0 border-0 border-b rounded-none"
          value={category.title}
          onChange={(e) => {
            setCategories((prev) =>
              prev.map((c) =>
                c.id === category.id ? { ...c, title: e.target.value } : c
              )
            );
          }}
        />
      ) : (
        <span className="text-lg">{category.title}</span>
      )}

      <div className="flex gap-1 ml-auto">
        <Button
          className="size-auto p-2"
          variant={category.renameActive ? "default" : "secondary"}
          onClick={() => {
            setCategories((prev) =>
              prev.map((c) =>
                c.id === category.id
                  ? { ...c, renameActive: !c.renameActive }
                  : c
              )
            );
          }}
        >
          <span className="icon-[lucide--pencil] size-4" />
        </Button>
        <Button
          className="size-auto p-2"
          variant="destructive"
          onClick={() => {
            setCategories((prev) =>
              prev.map((c) =>
                c.id === category.id ? { ...c, markedForDeletion: true } : c
              )
            );
          }}
        >
          <span className="icon-[lucide--trash-2] size-4" />
        </Button>
      </div>
    </Reorder.Item>
  );
}

export default function EditCategories() {
  const [addonMetadata, setAllMetadata] = useAtom(addonsMetadataAtom);
  const [storeCategories, setAllCategories] = useAtom(categoryNamesAtom);
  const [categoryStates, setCategoryState] = useAtom(categoriesStateAtom);

  const [categories, setCategories] = useState<CategoryEntry[]>([]);

  useEffect(() => {
    if (storeCategories) {
      setCategories(
        Object.entries(storeCategories).map(([id, title]) => ({
          id: parseInt(id),
          title,
          markedForDeletion: false,
          renameActive: false,
        }))
      );
    }
  }, [storeCategories]);

  const saveCategories = () => {
    const categoryIdRemap = {} as Record<number, number>;

    const newCategories = categories
      .filter((c) => !c.markedForDeletion)
      .reduce<Record<number, string>>((acc, c, index) => {
        if (!c.markedForDeletion) {
          categoryIdRemap[c.id] = index;

          acc[index] = c.title;
        }
        return acc;
      }, {});

    setAllCategories(newCategories);
    setAllMetadata(
      Object.fromEntries(
        Object.entries(addonMetadata ?? {}).map(([fileName, meta]) => [
          fileName,
          {
            ...meta,
            category: categoryIdRemap[meta.category] ?? CATEGORY_UNCATEGORIZED,
          },
        ])
      )
    );
    setCategoryState(
      Object.fromEntries(
        categories.map((c) => [
          categoryIdRemap[c.id],
          { expanded: categoryStates?.[c.id]?.expanded ?? false },
        ])
      )
    );

    mutate(() => true);
  };

  return (
    <Dialog
      onOpenChange={(o) => {
        if (!o && storeCategories) {
          setTimeout(() => {
            setCategories(
              Object.entries(storeCategories).map(([id, title]) => ({
                id: parseInt(id),
                title,
                markedForDeletion: false,
                renameActive: false,
              }))
            );
          }, 100);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary" className="flex gap-2 ml-auto">
          <span className="icon-[lucide--layout-list] size-5" />
          <span>Edit categories</span>
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} asChild>
        <div className="flex flex-col p-4 bg-surface-500 border border-primary-100/30">
          <div className="flex items-center">
            <DialogTitle className="text-xl font-bold text-primary-200">
              Categories
            </DialogTitle>

            <DialogClose asChild>
              <span className="icon-[lucide--x] text-primary-200 ml-auto size-6 cursor-pointer" />
            </DialogClose>
          </div>

          <Separator />

          <Reorder.Group
            axis="y"
            values={categories}
            onReorder={setCategories}
            className="flex flex-col gap-2"
          >
            {categories.map((c) => (
              <CategoryItem
                key={c.id}
                category={c}
                setCategories={setCategories}
              />
            ))}
          </Reorder.Group>

          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              className="bg-surface-400"
              onClick={() => {
                if (storeCategories) {
                  setCategories(
                    Object.entries(storeCategories).map(([id, title]) => ({
                      id: parseInt(id),
                      title,
                      markedForDeletion: false,
                      renameActive: false,
                    }))
                  );
                }
              }}
            >
              Reset
            </Button>
            <Button
              onClick={() => {
                saveCategories();
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
