"use client";

import { useEffect } from "react";
import { Check, X } from "lucide-react";
import type { ToastMessage } from "@/lib/data";

type ToastProps = {
  toast: ToastMessage;
  onDismiss: () => void;
};

export function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 4800);
    return () => window.clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div className="toast" role="status" aria-live="polite">
      <span className="toast-icon" aria-hidden="true">
        <Check size={14} strokeWidth={3} />
      </span>
      <span>{toast.message}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss notification">
        <X size={15} />
      </button>
    </div>
  );
}