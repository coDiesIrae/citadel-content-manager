import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Dispatch, SetStateAction } from "react";

export interface ErrorDialogProps {
  error: {
    show: boolean;
    message: string;
    onClose?: () => void;
  };
  setError: Dispatch<
    SetStateAction<{
      show: boolean;
      message: string;
      onClose?: () => void;
    }>
  >;
}

export default function ErrorDialog({ error, setError }: ErrorDialogProps) {
  return (
    <Dialog
      open={error.show}
      onOpenChange={(o) => {
        if (!o) {
          error.onClose?.();

          setError((p) => ({
            ...p,
            show: false,
          }));
        }
      }}
    >
      <DialogContent asChild aria-describedby={undefined}>
        <div className="p-4">
          <DialogTitle asChild>
            <span className="text-primary-200 font-bold text-xl">Error</span>
          </DialogTitle>
          <span>{error.message}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
