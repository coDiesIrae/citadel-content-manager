import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useRef, useState } from "react";

const enum DragState {
  None,
  HoverAccepted,
  HoverNotAccepted,
}

export interface FileDropListenerProps {
  onDrop: (files: string[]) => void;
}

export default function FileDropListener({ onDrop }: FileDropListenerProps) {
  const unlistenFn = useRef<() => void>();

  const [dragState, setDragState] = useState<DragState>(DragState.None);

  useEffect(() => {
    if (unlistenFn.current) {
      unlistenFn.current();
    }

    getCurrentWindow()
      .onDragDropEvent((e) => {
        switch (e.payload.type) {
          case "enter":
            const isAccepted = e.payload.paths.some((p) => p.endsWith(".vpk"));

            setDragState(
              isAccepted ? DragState.HoverAccepted : DragState.HoverNotAccepted
            );

            break;
          case "leave":
            setDragState(DragState.None);

            break;
          case "drop":
            setDragState(DragState.None);

            onDrop(e.payload.paths.filter((p) => p.endsWith(".vpk")));

            break;
          default:
        }
      })
      .then((fn) => {
        if (unlistenFn.current) {
          unlistenFn.current();
        }

        unlistenFn.current = fn;
      });

    return () => {
      if (unlistenFn.current) {
        unlistenFn.current();
      }
    };
  }, [onDrop]);

  if (dragState === DragState.None) {
    return null;
  }

  if (dragState === DragState.HoverNotAccepted) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center flex-col gap-6 justify-center bg-black/60 font-bold text-2xl">
      <span className="icon-[lucide--file-plus] size-24" />
      <span className="text-primary-400">Drop files here</span>
    </div>
  );
}
