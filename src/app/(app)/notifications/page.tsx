"use client";

import Link from "next/link";
import { toast, ToastT } from "sonner";

export default function NotificationsPage() {
  const toasts = toast.getHistory();

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

      <div className="flex flex-col flex-1 overflow-auto scrollbar-none px-4 pb-2 gap-3">
        {toasts.length > 0 ? (
          toasts.map((toast: ToastT) => (
            <div
              key={toast.id}
              className="p-4 rounded-md border border-primary-100/30 bg-surface-500"
            >
              {typeof toast.title === "function" ? toast.title() : toast.title}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 w-full h-full">
            <span className="icon-[lucide--bell-off] size-64 text-white/15" />
            <span></span>
          </div>
        )}
      </div>
    </div>
  );
}
