import { useInvoke, useInvokeMutate } from "@/api/useInvoke";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function SearchPathsSetup() {
  const {
    data: searchPathsState,
    isLoading: searchPathsLoading,
    mutate: mutateSearchPaths,
  } = useInvoke("get_search_paths_state_app", undefined);

  const { trigger: modSearchPaths, isMutating: modSearchPathsLoading } =
    useInvokeMutate("mod_search_paths_app");

  return (
    <>
      <div className="flex flex-col gap-1">
        <span className="font-bold text-lg">Search Paths State</span>
      </div>

      <div className="flex gap-6 items-center">
        {searchPathsLoading ? (
          <Skeleton className="h-10 flex-1" />
        ) : (
          <>
            <span className="text-primary-200">{searchPathsState}</span>
            <Button
              className="text-base"
              disabled={searchPathsState === "Modded" || modSearchPathsLoading}
              onClick={() => {
                modSearchPaths();
                mutateSearchPaths();
              }}
            >
              Mod
            </Button>
          </>
        )}
      </div>
    </>
  );
}
