"use client";

import UserStore from "@/api/stores/userData";
import { useInvoke } from "@/api/useInvoke";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useSWR from "swr";

export default function Home() {
  const router = useRouter();

  const { isLoading: isRevalidatingGamePath } = useInvoke(
    "revalidate_custom_game_path_app",
    undefined
  );
  const { data: completedOnboarding } = useSWR("completed_onboarding", () =>
    UserStore.getValue("completedOnboarding")
  );

  useEffect(() => {
    if (isRevalidatingGamePath) return;
    if (completedOnboarding === undefined) return;

    if (completedOnboarding) {
      router.replace("/addons");
    } else {
      router.replace("/setup");
    }
  }, [completedOnboarding, isRevalidatingGamePath]);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-end">
      <span>Loading...</span>
    </div>
  );
}

