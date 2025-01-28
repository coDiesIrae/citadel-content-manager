"use client";

import { useInvoke } from "@/api/useInvoke";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export default function SearchPathsChecker() {
  const router = useRouter();

  const { data: searchPathsState } = useInvoke(
    "get_search_paths_state_app",
    undefined
  );

  useEffect(() => {
    if (searchPathsState === "Vanilla") {
      const toastId = toast.info(
        <div className="flex flex-col gap-2">
          <div className="flex flex-row items-center gap-2">
            <span className="icon-[lucide--triangle-alert] size-6 text-primary-400" />
            <span className="text-lg">Search paths are not set up</span>
          </div>

          <Button
            className="self-end"
            onClick={() => {
              router.push("/settings");
              toast.dismiss(toastId);
            }}
          >
            Go to settings
          </Button>
        </div>
      );
    }
  }, [searchPathsState]);

  return null;
}
