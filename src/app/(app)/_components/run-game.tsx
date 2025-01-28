"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function LaunchGameButton() {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      asChild
      className={cn(
        "flex self-stretch justify-center items-center gap-2",
        loading && "cursor-wait pointer-events-none opacity-50"
      )}
      onClick={() => {
        setLoading(true);

        setTimeout(() => {
          setLoading(false);
        }, 10000);
      }}
    >
      <a href="steam://run/1422450">
        <span className="icon-[lucide--play] size-5" />
        <span className="text-lg pr-1 font-semibold">Launch game</span>
      </a>
    </Button>
  );
}
