"use client";

import { Button } from "@/components/ui/button";
import { useCallback, useState } from "react";
import ErrorDialog from "./_components/error-dialog";
import GamePathSelector from "./_components/game-path-selector";
import SearchPathsSetup from "./_components/search-paths-setup";
import StoragePathSelector from "./_components/storage-path-selector";
import { useRouter } from "next/navigation";
import UserStore from "@/api/stores/userData";

export default function SetupPage() {
  const router = useRouter();

  const [error, setError] = useState<{
    show: boolean;
    message: string;
    onClose?: () => void;
  }>({
    show: false,
    message: "",
  });

  const setErrorMessage = useCallback(
    (message: string, onClose?: () => void) => {
      setError({
        show: true,
        message,
        onClose,
      });
    },
    []
  );

  const onContinue = useCallback(() => {
    router.replace("/addons");

    UserStore.setValue("completedOnboarding", true);
  }, [router]);

  return (
    <div className="p-6 flex flex-col gap-8 h-screen w-screen">
      <span className="text-2xl font-bold">
        Welcome to Addon Manager! Let's get you set up
      </span>

      <div className="grid grid-cols-2 items-center gap-6">
        <GamePathSelector setError={setErrorMessage} />
        <StoragePathSelector setError={setErrorMessage} />
        <SearchPathsSetup setError={setErrorMessage} />
      </div>

      <Button
        className="mt-auto text-lg gap-2 items-center flex"
        onClick={onContinue}
      >
        <span className="font-semibold">Continue</span>
        <span className="icon-[lucide--move-right] size-6" />
      </Button>

      <ErrorDialog error={error} setError={setError} />
    </div>
  );
}
