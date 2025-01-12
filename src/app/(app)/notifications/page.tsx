import Link from "next/link";

export default function NotificationsPage() {
  return (
    <div className="flex flex-col justify-start h-full">
      <div className="self-stretch flex flex-row justify-between p-4 items-center">
        <span className="font-extrabold text-3xl text-primary-200">
          Notifications
        </span>

        <Link href="/notifications/error-log" className="text-sm text-white/60">
          Error log
        </Link>
      </div>
    </div>
  );
}
