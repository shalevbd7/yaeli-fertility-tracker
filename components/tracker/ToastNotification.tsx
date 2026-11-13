"use client";

import type { Toast } from '@/lib/tracker/types';

type ToastNotificationProps = {
  toast: NonNullable<Toast>;
};

export default function ToastNotification({ toast }: ToastNotificationProps) {
  return (
    <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-sm animate-in slide-in-from-bottom-5">
      <span>💖</span>
      <span>{toast.message}</span>
    </div>
  );
}
