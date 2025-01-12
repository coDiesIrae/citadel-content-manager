import { genericAppErrorMessage } from "@/api/errorMessages/app";
import { deployMethodErrorMessage } from "@/api/errorMessages/deployMethod";
import { DeployMethod } from "@/api/types";
import { useInvoke, useInvokeMutate } from "@/api/useInvoke";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCallback } from "react";

export interface DeployMethodSelectorProps {
  deployMethod: DeployMethod | undefined;
  setDeployMethod: (deployMethod: DeployMethod | undefined) => void;
  setError: (error: string, onClose?: () => void) => void;
}

export default function DeployMethodSelector({
  deployMethod: selectedDeployMethod,
  setDeployMethod,
  setError,
}: DeployMethodSelectorProps) {
  const { data: currentDeployMethod, isLoading: deployMethodLoading } =
    useInvoke("get_deploy_method_app", undefined);

  const { trigger: validateDeployMethod } = useInvokeMutate(
    "validate_deploy_method_app"
  );

  const deployMethod = selectedDeployMethod ?? currentDeployMethod;

  const selectDeployMethod = useCallback(
    async (newDeployMethod: DeployMethod) => {
      if (newDeployMethod === selectedDeployMethod) {
        return;
      }

      const validateResult = await validateDeployMethod({
        deployMethod: newDeployMethod,
      });

      if (validateResult.success) {
        setDeployMethod(newDeployMethod);
      } else {
        setError(
          genericAppErrorMessage(validateResult.error, deployMethodErrorMessage)
        );
      }
    },
    [selectedDeployMethod]
  );

  return (
    <>
      <div className="flex flex-col gap-1">
        <span className="font-bold text-lg">Deploy Method</span>
      </div>

      <div className="flex gap-3">
        {deployMethodLoading ? (
          <Skeleton className="h-10 flex-1" />
        ) : (
          <>
            <span
              className={cn(
                "px-3 py-2 rounded-lg cursor-pointer bg-surface-500",
                deployMethod === "Copy" && "bg-primary-400 text-black"
              )}
              onClick={() => selectDeployMethod("Copy")}
            >
              Copy
            </span>
            <span
              className={cn(
                "px-3 py-2 rounded-lg cursor-pointer bg-surface-500",
                deployMethod === "Symlink" && "bg-primary-400 text-black"
              )}
              onClick={() => selectDeployMethod("Symlink")}
            >
              Symlink
            </span>
          </>
        )}
      </div>
    </>
  );
}
