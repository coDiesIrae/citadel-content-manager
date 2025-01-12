import { genericAppErrorMessage } from "@/api/errorMessages/app";
import { searchPathsErrorMessage } from "@/api/errorMessages/searchPaths";
import { useInvoke, useInvokeMutate } from "@/api/useInvoke";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallback } from "react";

export interface SearchPathsSetupProps {
  setError: (error: string, onClose?: () => void) => void;
}

export default function SearchPathsSetup({ setError }: SearchPathsSetupProps) {
  const {
    data: searchPaths,
    isLoading: searchPathsLoading,
    mutate: mutateSearchPaths,
    error: searchPathsError,
  } = useInvoke("get_search_paths_state_app", undefined);

  const { trigger: modSearchPaths, isMutating: moddingSearchPaths } =
    useInvokeMutate("mod_search_paths_app");

  const onMod = useCallback(async () => {
    const modResult = await modSearchPaths();

    if (modResult.success) {
      mutateSearchPaths(
        { success: true, result: "Modded" },
        {
          populateCache: true,
          revalidate: false,
        }
      );
    } else {
      setError(
        genericAppErrorMessage(modResult.error, searchPathsErrorMessage),
        onMod
      );
    }
  }, [modSearchPaths]);

  return (
    <>
      <div className="flex flex-col gap-1">
        <span className="font-bold text-lg">Search Paths</span>

        <span className="text-primary-200 text-sm">
          <span className="code text-white">gameinfo.gi</span>'s{" "}
          <span className="text-white code">SearchPaths</span> block, must be
          modded for addons to be recognized by the game.
        </span>
      </div>

      {searchPathsLoading ? (
        <Skeleton className="h-10" />
      ) : searchPathsError ? (
        <HoverCard openDelay={100} closeDelay={100}>
          <HoverCardTrigger asChild>
            <div className="flex items-center gap-3 justify-self-start cursor-help">
              <span className="text-red-500 text-xl">Error</span>

              <span className="icon-[lucide--info] size-5" />
            </div>
          </HoverCardTrigger>

          <HoverCardContent className="w-max">
            {genericAppErrorMessage(searchPathsError, searchPathsErrorMessage)}
          </HoverCardContent>
        </HoverCard>
      ) : (
        <div className="flex items-center gap-6">
          <span className="text-xl text-white">{searchPaths}</span>
          {searchPaths === "Vanilla" && (
            <Button
              disabled={moddingSearchPaths}
              className="text-lg"
              onClick={onMod}
            >
              Apply mod
            </Button>
          )}
        </div>
      )}
    </>
  );
}
