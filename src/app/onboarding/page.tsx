"use client";

import { useInvoke, useInvokeMutate } from "@/api/useInvoke";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { open } from "@tauri-apps/plugin-dialog";
import Link from "next/link";

export default function Home() {
  const { data: installPath, mutate: mutateInstallPath } = useInvoke(
    "get_install_path",
    undefined
  );
  const { data: searchPathsState, mutate: mutateSearchPathsState } = useInvoke(
    "get_search_paths_state",
    undefined
  );

  const { trigger: setInstallPath } = useInvokeMutate("set_install_path");
  const { trigger: modSearchPaths } = useInvokeMutate("mod_search_paths");

  return (
    <div className="p-6 flex flex-col gap-8 h-screen w-screen">
      <span className="text-2xl font-bold">
        Welcome to Addon Manager! Let's get you set up
      </span>

      <div className="grid grid-cols-2 items-center gap-6">
        <div className="flex flex-col gap-1">
          <span className="font-bold text-lg">Addon storage path</span>
          <span className="text-primary-200 text-sm">
            The path where all your addons will be stored
          </span>
        </div>
        <Input
          type="text"
          className="cursor-pointer text-lg h-10"
          value={installPath ?? "Select..."}
          readOnly
          onClick={() => {
            open({
              directory: true,
              multiple: false,
              canCreateDirectories: true,
              title: "Select addons install path",
            }).then((result) => {
              if (result !== null) {
                setInstallPath({ installPath: result });
                mutateInstallPath(undefined, {
                  populateCache: false,
                  revalidate: true,
                  optimisticData: {
                    success: true,
                    result,
                  },
                });
              }
            });
          }}
        />

        <span className="text-lg font-bold">
          <span className="text-primary-200">gameinfo.gi</span>
          <span> state</span>
        </span>

        <div className="flex flex-row gap-4 items-center">
          <span className="text-lg">{searchPathsState}</span>
          <Button
            className="ml-auto"
            disabled={searchPathsState !== "Vanilla"}
            onClick={() => {
              modSearchPaths(undefined);
              mutateSearchPathsState(undefined, {
                populateCache: false,
                revalidate: true,
                optimisticData: {
                  success: true,
                  result: "Modded",
                },
              });
            }}
          >
            Apply mod
          </Button>
        </div>
      </div>

      <Link href="/addons" legacyBehavior>
        <Button
          disabled={
            installPath === undefined ||
            searchPathsState === undefined ||
            searchPathsState === "Vanilla"
          }
          className="flex gap-1 items-center mt-auto"
        >
          <span className="text-lg">Continue</span>
          <span className="icon-[lucide--move-right] size-6" />
        </Button>
      </Link>
    </div>
  );
}
