import AddonEntry from "@/components/main/addon-entry";
import NavRoute from "@/components/nav/route";

export enum DeployState {
  Deployed,
  NotDeployed,
  Deploying,
  Undeploying,
}

export type Addon = {
  name: string;
  fileName: string;
  deployState: DeployState;
};

export const items: Addon[] = [
  {
    name: "Kali Ivy",
    fileName: "pak03_dir.vpk",
    deployState: DeployState.Deployed,
  },
  {
    name: "Ketchup Abrams",
    fileName: "pak21_dir.vpk",
    deployState: DeployState.NotDeployed,
  },
  {
    name: "MLG Haze",
    fileName: "pak12_dir.vpk",
    deployState: DeployState.Deploying,
  },
];

export default function Home() {
  const deployedItems = items.filter(
    (item) =>
      item.deployState === DeployState.Deployed ||
      item.deployState === DeployState.Undeploying
  );
  const notDeployedItems = items.filter(
    (item) =>
      item.deployState === DeployState.NotDeployed ||
      item.deployState === DeployState.Deploying
  );

  return (
    <div className="flex flex-row justify-start w-[100dvw] h-[100dvh] bg-surface-600">
      <div className="bg-surface-500 flex flex-col gap-2 p-2 items-start">
        <span className="font-bold py-2 pr-14 text-xl">ModManager</span>
        <div className="h-[1px] w-full bg-surface-100/30" />

        <NavRoute icon="icon-[lucide--folder-cog]" text="Mods" url="/" />
        <NavRoute
          icon="icon-[lucide--settings-2]"
          text="Settings"
          url="/settings"
        />

        <a
          href="steam://run/1422450"
          className="flex self-stretch justify-center mt-auto items-center gap-2 py-2 px-3 bg-primary-600 rounded-md text-black"
        >
          <span className="icon-[lucide--play] size-5" />
          <span className="text-lg font-semibold pr-1">Launch game</span>
        </a>
      </div>
      <div className="flex flex-col justify-start flex-1">
        <div className="self-stretch flex flex-row justify-between p-4">
          <span className="font-extrabold text-3xl text-primary-200">Mods</span>
          <button className="ml-auto flex items-center gap-1 py-2 px-3 bg-primary-600 rounded-md text-black">
            <span className="icon-[lucide--plus] size-5" />
            <span className="text-lg font-semibold pr-1">Add</span>
          </button>
        </div>
        <div className="flex flex-col flex-1 overflow-auto scrollbar-none gap-10 px-4 pb-2">
          <div className="flex flex-col gap-4">
            <span className="font-bold text-lg">Deployed</span>
            <div className="h-[1px] w-full bg-surface-100/30" />
            <div className="flex flex-col gap-6">
              {deployedItems.map((item, index) => (
                <AddonEntry key={index} addon={item} />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <span className="font-bold text-lg">Not deployed</span>
            <div className="h-[1px] w-full bg-surface-100/30" />
            <div className="flex flex-col gap-6">
              {notDeployedItems.map((item, index) => (
                <AddonEntry key={index} addon={item} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

