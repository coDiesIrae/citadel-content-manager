"use client";

import { useInvoke } from "@/api/useInvoke";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const { isLoading: installPathLoading, data: installPath } = useInvoke(
    "get_install_path",
    undefined
  );
  const { isLoading: searchPathsStateLoading, data: searchPathsState } =
    useInvoke("get_search_paths_state", undefined);

  const router = useRouter();

  const isLoading = installPathLoading || searchPathsStateLoading;

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (installPath && searchPathsState && searchPathsState !== "Vanilla") {
      router.push("/addons");
    } else {
      router.push("/onboarding");
    }
  }, [installPath, searchPathsState, router, isLoading]);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-end">
      <span>Loading...</span>
    </div>
  );
}

