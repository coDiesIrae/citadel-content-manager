import useSWRMutation from "swr/mutation";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import UserStore, { AddonMetadata } from "@/api/stores/userData";
import useSWR, { mutate } from "swr";
import { mutateInvoke, useInvokeMutate } from "@/api/useInvoke";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ElementRef, useCallback, useMemo, useRef, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";

export interface AddonEditProps {
  open: boolean;
  setOpen: (open: boolean) => void;

  fileName: string;
  mounted: boolean;
}

export default function AddonEdit({
  open,
  setOpen,
  fileName,
  mounted,
}: AddonEditProps) {
  const { data: metadata, mutate: mutateMetadata } =
    UserStore.useAddonMetadata(fileName);

  const { data: categories, mutate: mutateCategories } =
    UserStore.useCategories();

  const { mutate: mutateAllAddonMetadata } = UserStore.useAllAddonMetadata();

  const { trigger: setMetadata } = UserStore.useMutateAddonMetadata();
  const { trigger: deleteAddon } = useInvokeMutate("delete_addon_app");

  const categoryInputRef = useRef<ElementRef<"input">>(null);

  const [categorySelectOpen, setCategorySelectOpen] = useState(false);
  const [categoryInput, setCategoryInput] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const filteredCategories = useMemo(() => {
    return Object.entries(categories ?? {}).filter(([_, name]) =>
      name.toLowerCase().includes(categoryInput.toLowerCase())
    );
  }, [categories, categoryInput]);

  const selectCategory = useCallback((value: string) => {
    if (!categoryInputRef.current) return;

    categoryInputRef.current.value = value;
    setNewCategory(value);

    setCategorySelectOpen(false);
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="p-2 rounded-md flex bg-primary-500/30">
          <span className="icon-[lucide--edit] size-6 text-primary-500" />
        </button>
      </SheetTrigger>
      <SheetContent aria-describedby={undefined} className="flex flex-col">
        <SheetHeader className="mb-6">
          <SheetTitle>Edit addon</SheetTitle>
        </SheetHeader>
        <form
          action={async (data) => {
            if (!metadata) return;
            if (!categories) return;

            const newDisplayName = data.get("display_name");
            const newCategory = data.get("category");

            const newMetadata = { ...metadata };

            if (newDisplayName && typeof newDisplayName === "string") {
              newMetadata.displayName = newDisplayName || fileName;
            }

            if (newCategory && typeof newCategory === "string") {
              if (newCategory === "Uncategorized") {
                newMetadata.category = -1;
              } else {
                const categoryId = Object.entries(categories).find(
                  ([_, name]) => name === newCategory
                )?.[0];

                if (!categoryId) {
                  const newCategoryId = await UserStore.addCategory(
                    newCategory
                  );

                  newMetadata.category = newCategoryId;
                } else {
                  newMetadata.category = parseInt(categoryId);
                }
              }
            }

            await setMetadata({
              fileName,
              metadata: newMetadata,
            });

            mutateMetadata();
            mutateCategories();
            mutateAllAddonMetadata();

            setOpen(false);
          }}
          className="flex flex-col gap-2 flex-1"
        >
          <div className="flex flex-row gap-4 items-center">
            <label htmlFor="display_name">Name</label>
            <Input
              id="display_name"
              name="display_name"
              defaultValue={metadata?.displayName}
              autoComplete="off"
              autoCorrect="off"
            />
          </div>

          <div className="flex flex-row gap-4 items-center">
            <input hidden ref={categoryInputRef} name="category" />

            <label htmlFor="category">Category</label>
            <Popover
              open={categorySelectOpen}
              onOpenChange={setCategorySelectOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={categorySelectOpen}
                  className="justify-between gap-2 items-center flex-1"
                >
                  {(newCategory || categories?.[metadata?.category ?? -1]) ??
                    "Uncategorized"}
                  <span className="icon-[lucide--chevrons-up-down] size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Type in a category"
                    value={categoryInput}
                    onValueChange={setCategoryInput}
                  />
                  <CommandList>
                    <CommandEmpty>No categories found</CommandEmpty>

                    {categoryInput.length > 0 && (
                      <CommandGroup>
                        <CommandItem
                          value="__create__"
                          className="flex items-center gap-2 py-2 px-2.5 cursor-pointer"
                          onSelect={() => selectCategory(categoryInput)}
                        >
                          <span className="icon-[lucide--plus] size-5" />
                          Create
                        </CommandItem>
                      </CommandGroup>
                    )}

                    <CommandGroup>
                      <CommandItem
                        value="-1"
                        className="cursor-pointer"
                        onSelect={() => selectCategory("Uncategorized")}
                      >
                        Uncategorized
                      </CommandItem>

                      {filteredCategories.map(([id, name]) => (
                        <CommandItem
                          key={id}
                          value={id}
                          className="cursor-pointer"
                          onSelect={() => selectCategory(name)}
                        >
                          {name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <Button type="submit" className="mt-auto">
            Save
          </Button>
          {!mounted && (
            <Button
              variant="destructive"
              type="button"
              onClick={async () => {
                await deleteAddon({ addonName: fileName });

                mutateInvoke("list_managed_addons_app");
                mutateInvoke("list_mounted_addons_app");

                setOpen(false);
              }}
            >
              Delete
            </Button>
          )}
        </form>
      </SheetContent>
    </Sheet>
  );
}
