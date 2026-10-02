"use client";

import { useEffect } from "react";

export interface ToastMessage {
  id: number;
  text: string;
}

export function Toast({ toast, onDone }: { toast: ToastMessage | null; onDone: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(onDone, 2200);
    return () => window.clearTimeout(id);
  }, [toast, onDone]);

  return (
    <div aria-live="polite" className="toast-region">
      {toast && (
        <div key={toast.id} className="toast">
          {toast.text}
        </div>
      )}
    </div>
  );
}
