import { cn } from "@/lib/utils";
import Link from "next/link";

export interface NavRouteProps {
  text: string;
  url: string;
  icon: string;
}

export default function NavRoute({ text, icon, url }: NavRouteProps) {
  return (
    <Link href={url} className="flex gap-2 items-center">
      <span className={cn("size-6", icon)} />
      <span className="text-lg">{text}</span>
    </Link>
  );
}
