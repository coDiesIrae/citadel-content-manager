import NavRoute from "@/components/nav/route";
import { Button } from "@/components/ui/button";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-row justify-start w-[100dvw] h-[100dvh]">
      <div className="bg-surface-500 flex flex-col gap-2 p-2 items-start">
        <span className="font-bold py-2 text-xl self-center">ModManager</span>
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

        <Button
          asChild
          className="flex self-stretch justify-center mt-auto items-center gap-2"
        >
          <a href="steam://run/1422450">
            <span className="icon-[lucide--play] size-5" />
            <span className="text-lg pr-1 font-semibold">Launch game</span>
          </a>
        </Button>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
