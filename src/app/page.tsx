"use client";

import { completedOnboardingAtom } from "@/api/stores/userAtom";
import { useInvoke } from "@/api/useInvoke";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  const [completedOnboarding] = useAtom(completedOnboardingAtom);

  const { isLoading: isRevalidatingGamePath } = useInvoke(
    "revalidate_custom_game_path_app",
    undefined
  );

  useEffect(() => {
    if (isRevalidatingGamePath) return;
    if (completedOnboarding === undefined) return;

    if (completedOnboarding) {
      router.replace("/addons");
    } else {
      router.replace("/setup");
    }
  }, [completedOnboarding, isRevalidatingGamePath, router]);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-end">
      <span>Loading...</span>
    </div>
  );
}
