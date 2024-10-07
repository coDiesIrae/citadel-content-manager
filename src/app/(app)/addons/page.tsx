import AddonEntry from "@/components/main/addon-entry";

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
    <div className="flex flex-col justify-start">
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
  );
}
