import NavRoute from "@/components/nav/route";
import { Button } from "@/components/ui/button";
import LaunchGameButton from "./_components/run-game";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-row justify-start w-[100dvw] h-[100dvh]">
      <div className="bg-surface-500 flex flex-col gap-2 p-2 items-start">
        <span className="font-bold py-2 text-xl self-center">AddonManager</span>
        <div className="h-[1px] w-full bg-surface-100/30" />

        <NavRoute
          icon="icon-[lucide--folder-cog]"
          text="Addons"
          url="/addons"
        />
        <NavRoute
          icon="icon-[lucide--settings-2]"
          text="Settings"
          url="/settings"
        />

        <NavRoute
          icon="icon-[lucide--bell]"
          text="Notifications"
          url="/notifications"
          className="mt-auto mb-2"
        />

        <LaunchGameButton />
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
