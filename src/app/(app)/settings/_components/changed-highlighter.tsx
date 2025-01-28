import { cn } from "@/lib/utils";

export interface ChangedHighlighterProps {
  active: boolean;
}

export default function ChangedHighlighter({
  active,
}: ChangedHighlighterProps) {
  return (
    <div
      className={cn(
        "absolute -inset-x-3 -inset-y-2 bg-surface-400 -z-10 rounded-md",
        !active && "hidden"
      )}
    />
  );
}
