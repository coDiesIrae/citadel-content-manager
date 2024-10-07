"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavRouteProps {
  text: string;
  url: string;
  icon: string;
}

export default function NavRoute({ text, icon, url }: NavRouteProps) {
  const pathname = usePathname();

  return (
    <Link
      href={url}
      className={cn(
        "flex gap-2 items-center",
        pathname === url && "text-primary-400"
      )}
    >
      <span className={cn("size-6", icon)} />
      <span className="text-lg">{text}</span>
    </Link>
  );
}
